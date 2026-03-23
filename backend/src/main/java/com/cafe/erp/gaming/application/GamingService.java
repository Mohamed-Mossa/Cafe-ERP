package com.cafe.erp.gaming.application;

import com.cafe.erp.gaming.application.command.StartSessionRequest;
import com.cafe.erp.gaming.application.command.SwitchTypeRequest;
import com.cafe.erp.gaming.domain.model.*;
import com.cafe.erp.gaming.infrastructure.persistence.DeviceRepository;
import com.cafe.erp.gaming.infrastructure.persistence.GamingSessionRepository;
import com.cafe.erp.identity.domain.model.User;
import com.cafe.erp.identity.infrastructure.persistence.UserRepository;
import com.cafe.erp.membership.application.service.MembershipService;
import com.cafe.erp.pos.application.command.CreateOrderRequest;
import com.cafe.erp.pos.application.service.OrderService;
import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service @RequiredArgsConstructor @Slf4j
public class GamingService {
    private final GamingSessionRepository sessionRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final MembershipService membershipService;
    private final OrderService orderService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public GamingSession startSession(StartSessionRequest req) {
        Device device = deviceRepository.findById(req.getDeviceId())
                .orElseThrow(() -> BusinessException.notFound("Device"));
        if (device.getStatus() == DeviceStatus.ACTIVE) throw BusinessException.conflict("Device already has an active session");

        User user = SecurityUtils.currentUser();

        // Create linked order
        var orderReq = new CreateOrderRequest();
        orderReq.setSource(com.cafe.erp.pos.domain.model.OrderSource.GAMING);
        orderReq.setDeviceId(device.getId());
        orderReq.setDeviceName(device.getName());
        orderReq.setCustomerId(req.getCustomerId());
        var order = orderService.createOrder(orderReq);

        LocalDateTime now = LocalDateTime.now();
        GamingSession session = GamingSession.builder()
                .deviceId(device.getId()).deviceName(device.getName())
                .cashierId(user.getId()).startedAt(now)
                .currentType(req.getSessionType()).linkedOrderId(order.getId())
                .customerId(req.getCustomerId()).build();
        GamingSession saved = sessionRepository.save(session);

        // First segment
        SessionSegment segment = SessionSegment.builder()
                .session(saved)
                .sessionType(req.getSessionType())
                .rate(req.getSessionType() == SessionType.SINGLE ? device.getSingleRate() : device.getMultiRate())
                .startedAt(now).build();
        saved.getSegments().add(segment);
        sessionRepository.save(saved);

        device.setStatus(DeviceStatus.ACTIVE);
        deviceRepository.save(device);
        broadcastDeviceUpdate(device);
        return saved;
    }

    @Transactional
    public GamingSession switchType(UUID sessionId, SwitchTypeRequest req) {
        GamingSession session = getActiveSession(sessionId);
        if (session.getCurrentType() == req.getNewType()) throw new BusinessException("Session is already " + req.getNewType());

        Device device = deviceRepository.findById(session.getDeviceId())
                .orElseThrow(() -> BusinessException.notFound("Device"));
        LocalDateTime now = LocalDateTime.now();

        // Close current segment
        SessionSegment current = session.getSegments().stream()
                .filter(s -> s.getEndedAt() == null).findFirst().orElseThrow();
        closeSegment(current, now);

        // Open new segment
        SessionSegment next = SessionSegment.builder()
                .session(session)
                .sessionType(req.getNewType())
                .rate(req.getNewType() == SessionType.SINGLE ? device.getSingleRate() : device.getMultiRate())
                .startedAt(now).build();
        session.getSegments().add(next);
        session.setCurrentType(req.getNewType());
        return sessionRepository.save(session);
    }

    @Transactional
    public EndSessionResult endSession(UUID sessionId) {
        return closeSession(sessionId, null);
    }

    @Transactional
    public EndSessionResult endSessionWithPackage(UUID sessionId, UUID customerPackageId) {
        return closeSession(sessionId, customerPackageId);
    }

    private EndSessionResult closeSession(UUID sessionId, UUID customerPackageId) {
        GamingSession session = getActiveSession(sessionId);
        Device device = deviceRepository.findById(session.getDeviceId())
                .orElseThrow(() -> BusinessException.notFound("Device"));
        LocalDateTime now = LocalDateTime.now();

        // Close last segment
        session.getSegments().stream().filter(s -> s.getEndedAt() == null).forEach(s -> closeSegment(s, now));

        // Calculate total
        BigDecimal total = session.getSegments().stream()
                .map(s -> s.getAmount() != null ? s.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int billableMinutes = session.getSegments().stream()
                .mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                .sum();

        session.setGamingAmount(total);
        int totalMins = (int) Duration.between(session.getStartedAt(), now).toMinutes();
        session.setTotalMinutes(totalMins);
        session.setEndedAt(now);
        session.setStatus(SessionStatus.CLOSED);

        boolean packageUsed = customerPackageId != null;
        BigDecimal deductedHours = null;
        UUID payableOrderId = session.getLinkedOrderId();

        if (packageUsed) {
            if (session.getCustomerId() == null) {
                throw new BusinessException("This session has no customer attached");
            }
            var customerPackage = membershipService.getUsableCustomerPackage(session.getCustomerId(), customerPackageId);
            validatePackageCompatibility(customerPackage, device, session);
            deductedHours = BigDecimal.valueOf(billableMinutes)
                    .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
            membershipService.deductHours(customerPackageId, deductedHours);
        } else if (session.getLinkedOrderId() != null && total.compareTo(BigDecimal.ZERO) > 0) {
            // Add gaming charge as a line item to the linked order.
            // NOT wrapped in try-catch — if this fails the cashier must see the error.
            // A swallowed exception here means the customer gets free gaming time with no trace.
            com.cafe.erp.pos.domain.model.Order linkedOrder =
                    orderService.getOrder(session.getLinkedOrderId());
            if (linkedOrder.getStatus() == com.cafe.erp.pos.domain.model.OrderStatus.OPEN) {
                addGamingFeeToOrder(session.getLinkedOrderId(), session.getDeviceName(), totalMins, total);
            }
        }

        device.setStatus(DeviceStatus.FREE);
        deviceRepository.save(device);
        broadcastDeviceUpdate(device);

        if (packageUsed && session.getLinkedOrderId() != null) {
            var linkedOrder = orderService.getOrder(session.getLinkedOrderId());
            if (linkedOrder.getStatus() == com.cafe.erp.pos.domain.model.OrderStatus.OPEN && linkedOrder.getLines().isEmpty()) {
                orderService.cancelOrder(linkedOrder.getId(), "Package-covered gaming session with no payable items");
                payableOrderId = null;
            } else if (linkedOrder.getStatus() != com.cafe.erp.pos.domain.model.OrderStatus.OPEN) {
                payableOrderId = null;
            }
        }

        log.info("Session ended for {}. Duration: {} min, Amount: {} EGP",
                session.getDeviceName(), session.getTotalMinutes(), total);
        GamingSession saved = sessionRepository.save(session);
        return new EndSessionResult(saved, payableOrderId, packageUsed, customerPackageId, deductedHours);
    }

    private void closeSegment(SessionSegment segment, LocalDateTime endTime) {
        segment.setEndedAt(endTime);
        int minutes = (int) Math.max(15, Duration.between(segment.getStartedAt(), endTime).toMinutes());
        segment.setDurationMinutes(minutes);
        segment.setAmount(segment.getRate().multiply(BigDecimal.valueOf(minutes))
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP));
    }

    public List<GamingSession> getActiveSessions() {
        return sessionRepository.findByStatus(SessionStatus.ACTIVE);
    }

    public List<Device> getAllDevices() {
        return deviceRepository.findByActiveAndDeletedFalseOrderByName(true);
    }

    private GamingSession getActiveSession(UUID id) {
        GamingSession s = sessionRepository.findById(id).orElseThrow(() -> BusinessException.notFound("Session"));
        if (s.getStatus() != SessionStatus.ACTIVE) throw new BusinessException("Session is not active");
        return s;
    }

    private void broadcastDeviceUpdate(Device device) {
        messagingTemplate.convertAndSend("/topic/devices", device);
    }

    public List<GamingSession> getSessionHistory(java.time.LocalDateTime from, java.time.LocalDateTime to) {
        return sessionRepository.findByStartedAtBetween(from, to);
    }

    @org.springframework.transaction.annotation.Transactional
    public com.cafe.erp.gaming.domain.model.Device createDevice(java.util.Map<String, Object> body) {
        return deviceRepository.save(com.cafe.erp.gaming.domain.model.Device.builder()
                .name((String) body.get("name"))
                .type(com.cafe.erp.gaming.domain.model.DeviceType.valueOf((String) body.getOrDefault("type", "PS4")))
                .singleRate(new java.math.BigDecimal(body.getOrDefault("singleRate", "30").toString()))
                .multiRate(new java.math.BigDecimal(body.getOrDefault("multiRate", "50").toString()))
                .build());
    }

    @org.springframework.transaction.annotation.Transactional
    public com.cafe.erp.gaming.domain.model.Device updateDevice(java.util.UUID id, java.util.Map<String, Object> body) {
        var device = deviceRepository.findById(id).orElseThrow(() -> com.cafe.erp.shared.infrastructure.exception.BusinessException.notFound("Device"));
        if (body.containsKey("name")) device.setName((String) body.get("name"));
        if (body.containsKey("type")) device.setType(com.cafe.erp.gaming.domain.model.DeviceType.valueOf((String) body.get("type")));
        if (body.containsKey("singleRate")) device.setSingleRate(new java.math.BigDecimal(body.get("singleRate").toString()));
        if (body.containsKey("multiRate")) device.setMultiRate(new java.math.BigDecimal(body.get("multiRate").toString()));
        return deviceRepository.save(device);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteDevice(java.util.UUID id) {
        deviceRepository.findById(id).ifPresent(d -> { d.setActive(false); deviceRepository.save(d); });
    }

    @org.springframework.transaction.annotation.Transactional
    public com.cafe.erp.gaming.domain.model.GamingSession addFnbItem(java.util.UUID sessionId, java.util.UUID productId, int quantity) {
        com.cafe.erp.gaming.domain.model.GamingSession session = getActiveSession(sessionId);
        if (session.getLinkedOrderId() == null) throw new com.cafe.erp.shared.infrastructure.exception.BusinessException("Session has no linked order");
        var addLineReq = new com.cafe.erp.pos.application.command.AddLineRequest();
        addLineReq.setProductId(productId);
        addLineReq.setQuantity(quantity);
        orderService.addLine(session.getLinkedOrderId(), addLineReq);
        return sessionRepository.findById(sessionId).orElseThrow();
    }

    private void addGamingFeeToOrder(java.util.UUID orderId, String deviceName, int minutes, BigDecimal amount) {
        orderService.addGamingFee(orderId, deviceName, minutes, amount);
        log.info("Added gaming fee {} EGP for device {} ({} min) to order {}", amount, deviceName, minutes, orderId);
    }

    private void validatePackageCompatibility(
            com.cafe.erp.membership.domain.model.CustomerPackage customerPackage,
            Device device,
            GamingSession session
    ) {
        String packageDeviceType = customerPackage.getDeviceType();
        if (packageDeviceType != null
                && !"ANY".equalsIgnoreCase(packageDeviceType)
                && !packageDeviceType.equalsIgnoreCase(device.getType().name())) {
            throw new BusinessException("This package is only valid for " + packageDeviceType + " devices");
        }

        String packageSessionType = customerPackage.getSessionType();
        if (packageSessionType != null
                && !"ANY".equalsIgnoreCase(packageSessionType)
                && !packageSessionType.equalsIgnoreCase(session.getCurrentType().name())) {
            throw new BusinessException("This package is only valid for " + packageSessionType + " sessions");
        }
    }

    // Returns the linked order ID for the session so frontend can redirect to payment
    public java.util.UUID getLinkedOrderId(java.util.UUID sessionId) {
        return sessionRepository.findById(sessionId)
                .map(com.cafe.erp.gaming.domain.model.GamingSession::getLinkedOrderId)
                .orElse(null);
    }

    @org.springframework.transaction.annotation.Transactional
    public GamingSession transferSession(java.util.UUID sessionId, java.util.UUID targetDeviceId) {
        GamingSession session = getActiveSession(sessionId);
        if (session.getDeviceId().equals(targetDeviceId))
            throw new BusinessException("Cannot transfer to the same device");
        Device target = deviceRepository.findById(targetDeviceId)
                .orElseThrow(() -> BusinessException.notFound("Target device"));
        if (target.getStatus() == DeviceStatus.ACTIVE)
            throw new BusinessException("Target device is already in use");
        // Free old device
        Device oldDevice = deviceRepository.findById(session.getDeviceId())
                .orElseThrow(() -> BusinessException.notFound("Device"));
        oldDevice.setStatus(DeviceStatus.FREE);
        deviceRepository.save(oldDevice);
        // Occupy new device
        target.setStatus(DeviceStatus.ACTIVE);
        deviceRepository.save(target);
        // Update session
        session.setDeviceId(target.getId());
        session.setDeviceName(target.getName());
        return sessionRepository.save(session);
    }
}
