package com.cafe.erp.happyhour.application.service;
import com.cafe.erp.happyhour.domain.model.HappyHour;
import com.cafe.erp.happyhour.infrastructure.persistence.HappyHourRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class HappyHourService {
    private final HappyHourRepository repo;

    public List<HappyHour> getAll() { return repo.findByDeletedFalseOrderByStartTime(); }

    @Transactional
    public HappyHour create(Map<String,Object> body) {
        return repo.save(HappyHour.builder()
            .name((String) body.get("name"))
            .discountPercent(new BigDecimal(body.get("discountPercent").toString()))
            .startTime(LocalTime.parse((String) body.get("startTime")))
            .endTime(LocalTime.parse((String) body.get("endTime")))
            .daysOfWeek(body.getOrDefault("daysOfWeek","MON,TUE,WED,THU,FRI,SAT,SUN").toString())
            .build());
    }

    @Transactional
    public HappyHour toggle(UUID id) {
        HappyHour h = repo.findById(id).orElseThrow();
        h.setActive(!h.isActive());
        return repo.save(h);
    }

    @Transactional
    public void delete(UUID id) {
        repo.findById(id).ifPresent(h -> { h.setDeleted(true); repo.save(h); });
    }

    public BigDecimal getCurrentDiscount() {
        LocalTime now = LocalTime.now();
        String day = LocalDate.now().getDayOfWeek().name().substring(0,3);
        return repo.findByActiveAndDeletedFalse(true).stream()
            .filter(h -> h.getDaysOfWeek().contains(day)
                && !now.isBefore(h.getStartTime()) && !now.isAfter(h.getEndTime()))
            .map(HappyHour::getDiscountPercent)
            .max(BigDecimal::compareTo).orElse(null);
    }
}
