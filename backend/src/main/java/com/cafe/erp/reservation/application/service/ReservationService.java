package com.cafe.erp.reservation.application.service;
import com.cafe.erp.reservation.domain.model.Reservation;
import com.cafe.erp.reservation.infrastructure.persistence.ReservationRepository;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class ReservationService {
    private final ReservationRepository repo;

    public List<Reservation> getAll() { return repo.findByDeletedFalseOrderByReservationDateDescReservationTimeDesc(); }
    public List<Reservation> getForDate(LocalDate date) { return repo.findByReservationDateAndDeletedFalseOrderByReservationTime(date); }
    public List<Reservation> getUpcoming() { return repo.findByStatusAndDeletedFalseOrderByReservationDateAscReservationTimeAsc("CONFIRMED"); }

    @Transactional
    public Reservation create(Map<String,Object> body) {
        return repo.save(Reservation.builder()
            .customerName((String)body.get("customerName"))
            .customerPhone((String)body.get("customerPhone"))
            .tableName((String)body.getOrDefault("tableName",""))
            .partySize(Integer.parseInt(body.getOrDefault("partySize","2").toString()))
            .reservationDate(LocalDate.parse((String)body.get("reservationDate")))
            .reservationTime(LocalTime.parse((String)body.get("reservationTime")))
            .durationMinutes(Integer.parseInt(body.getOrDefault("durationMinutes","120").toString()))
            .depositAmount(new BigDecimal(body.getOrDefault("depositAmount","0").toString()))
            .depositPaid(Boolean.parseBoolean(body.getOrDefault("depositPaid","false").toString()))
            .notes((String)body.getOrDefault("notes",""))
            .status("PENDING")
            .cashierId(SecurityUtils.currentUser().getId())
            .build());
    }

    @Transactional
    public Reservation updateStatus(UUID id, String status) {
        Reservation r = repo.findById(id).orElseThrow();
        r.setStatus(status);
        return repo.save(r);
    }

    @Transactional
    public Reservation markDepositPaid(UUID id) {
        Reservation r = repo.findById(id).orElseThrow();
        r.setDepositPaid(true);
        return repo.save(r);
    }

    @Transactional
    public void delete(UUID id) { repo.findById(id).ifPresent(r -> { r.setDeleted(true); repo.save(r); }); }
}
