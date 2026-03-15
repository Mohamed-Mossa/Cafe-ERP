package com.cafe.erp.shared.infrastructure.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class RealtimeNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyFloorUpdate(Object payload) {
        messagingTemplate.convertAndSend("/topic/floor", payload);
        log.debug("Floor update sent via WebSocket");
    }

    public void notifyGamingUpdate(Object payload) {
        messagingTemplate.convertAndSend("/topic/gaming", payload);
        log.debug("Gaming update sent via WebSocket");
    }

    public void notifyKitchenOrder(Object payload) {
        messagingTemplate.convertAndSend("/topic/kitchen", payload);
    }

    public void notifyStockAlert(Object payload) {
        messagingTemplate.convertAndSend("/topic/stock-alerts", payload);
    }
}
