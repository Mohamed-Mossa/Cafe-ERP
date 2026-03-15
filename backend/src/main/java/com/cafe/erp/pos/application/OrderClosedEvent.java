package com.cafe.erp.pos.application;

import com.cafe.erp.pos.domain.model.Order;

public record OrderClosedEvent(Order order) {}
