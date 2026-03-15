package com.cafe.erp.pos.infrastructure.persistence;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.atomic.AtomicLong;

@Component
@RequiredArgsConstructor
public class OrderNumberGenerator {

    private final OrderRepository orderRepository;
    private final AtomicLong sequence = new AtomicLong(-1);

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public synchronized long next() {
        if (sequence.get() < 0) {
            sequence.set(orderRepository.findMaxOrderNumber());
        }
        return sequence.incrementAndGet();
    }
}
