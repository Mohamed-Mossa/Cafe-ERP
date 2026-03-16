package com.cafe.erp.reservation.application.service;
import com.cafe.erp.floor.domain.model.TableStatus;
import com.cafe.erp.floor.infrastructure.persistence.CafeTableRepository;
import com.cafe.erp.reservation.domain.model.Reservation;
import com.cafe.erp.reservation.infrastructure.persistence.ReservationRepository;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
public class ReservationService {
    private final ReservationRepository repo;
    private final CafeTableRepository tableRepo;
    private final SimpMessagingTemplate messaging;

    public ReservationService(ReservationRepository repo,
                              CafeTableRepository tableRepo,
                              @Lazy SimpMessagingTemplate messaging) {
        this.repo = repo;
        this.tableRepo = tableRepo;
        this.messaging = messaging;
    }

    public List<Reservation> getAll() { return repo.findByDeletedFalseOrderByReservationDateDescReservationTimeDesc(); }
    public List<Reservation> getForDate(LocalDate date) { return repo.findByReservationDateAndDeletedFalseOrderByReservationTime(date); }
    public List<Reservation> getUpcoming() { return repo.findByStatusAndDeletedFalseOrderByReservationDateAscReservationTimeAsc("CONFIRMED"); }

    @Transactional
    public Reservation create(Map<String,Object> body) {
        UUID tableId = body.containsKey("tableId") && body.get("tableId") != null
                ? UUID.fromString(body.get("tableId").toString())
                : null;
        String tableName = (String) body.getOrDefault("tableName", "");

        // If a tableId is provided, look up the canonical table name from the DB
        if (tableId != null) {
            tableRepo.findById(tableId).ifPresent(t -> {
                // tableName resolved from DB — we'll set it on the builder below
            });
            var tableOpt = tableRepo.findById(tableId);
            if (tableOpt.isPresent()) tableName = tableOpt.get().getName();
        }

        Reservation r = repo.save(Reservation.builder()
            .customerName((String) body.get("customerName"))
            .customerPhone((String) body.get("customerPhone"))
            .tableId(tableId)
            .tableName(tableName)
            .partySize(Integer.parseInt(body.getOrDefault("partySize", "2").toString()))
            .reservationDate(LocalDate.parse((String) body.get("reservationDate")))
            .reservationTime(LocalTime.parse((String) body.get("reservationTime")))
            .durationMinutes(Integer.parseInt(body.getOrDefault("durationMinutes", "120").toString()))
            .depositAmount(new BigDecimal(body.getOrDefault("depositAmount", "0").toString()))
            .depositPaid(Boolean.parseBoolean(body.getOrDefault("depositPaid", "false").toString()))
            .notes((String) body.getOrDefault("notes", ""))
            .status("PENDING")
            .cashierId(SecurityUtils.currentUser().getId())
            .build());

        // Mark table RESERVED immediately when a confirmed reservation is saved
        // (PENDING reservations don't lock the table yet — the floor shows RESERVED only on CONFIRM)
        return r;
    }

    @Transactional
    public Reservation updateStatus(UUID id, String status) {
        Reservation r = repo.findById(id).orElseThrow();
        String oldStatus = r.getStatus();
        r.setStatus(status);
        Reservation saved = repo.save(r);

        // Sync floor plan:
        // CONFIRMED → mark table RESERVED so the floor plan shows 🟣
        // SEATED    → mark table OCCUPIED (guest has arrived, now in an active order)
        // COMPLETED / CANCELLED → free the table if we reserved it
        if (r.getTableId() != null) {
            tableRepo.findById(r.getTableId()).ifPresent(table -> {
                switch (status) {
                    case "CONFIRMED" -> {
                        table.setStatus(TableStatus.RESERVED);
                        var t = tableRepo.save(table);
                        messaging.convertAndSend("/topic/tables", t);
                    }
                    case "COMPLETED", "CANCELLED" -> {
                        // Only free if we were the ones who reserved it
                        if (table.getStatus() == TableStatus.RESERVED) {
                            table.setStatus(TableStatus.FREE);
                            var t = tableRepo.save(table);
                            messaging.convertAndSend("/topic/tables", t);
                        }
                    }
                    default -> { /* PENDING / SEATED handled elsewhere */ }
                }
            });
        }

        return saved;
    }

    @Transactional
    public Reservation markDepositPaid(UUID id) {
        Reservation r = repo.findById(id).orElseThrow();
        r.setDepositPaid(true);
        return repo.save(r);
    }

    @Transactional
    public void delete(UUID id) {
        repo.findById(id).ifPresent(r -> {
            // Free the table if this reservation had reserved it
            if (r.getTableId() != null && "CONFIRMED".equals(r.getStatus())) {
                tableRepo.findById(r.getTableId()).ifPresent(table -> {
                    if (table.getStatus() == TableStatus.RESERVED) {
                        table.setStatus(TableStatus.FREE);
                        var t = tableRepo.save(table);
                        messaging.convertAndSend("/topic/tables", t);
                    }
                });
            }
            r.setDeleted(true);
            repo.save(r);
        });
    }
}
