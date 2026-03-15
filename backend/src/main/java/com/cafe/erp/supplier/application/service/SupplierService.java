package com.cafe.erp.supplier.application.service;
import com.cafe.erp.supplier.domain.model.Supplier;
import com.cafe.erp.supplier.infrastructure.persistence.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service @RequiredArgsConstructor
public class SupplierService {
    private final SupplierRepository repo;

    public List<Supplier> getAll() { return repo.findByDeletedFalseOrderByName(); }
    public List<Supplier> getActive() { return repo.findByActiveAndDeletedFalseOrderByName(true); }

    @Transactional
    public Supplier create(Map<String,Object> body) {
        return repo.save(Supplier.builder()
            .name((String) body.get("name"))
            .contactPerson((String) body.getOrDefault("contactPerson",""))
            .phone((String) body.getOrDefault("phone",""))
            .email((String) body.getOrDefault("email",""))
            .address((String) body.getOrDefault("address",""))
            .notes((String) body.getOrDefault("notes",""))
            .build());
    }

    @Transactional
    public Supplier update(UUID id, Map<String,Object> body) {
        Supplier s = repo.findById(id).orElseThrow();
        if (body.containsKey("name")) s.setName((String)body.get("name"));
        if (body.containsKey("contactPerson")) s.setContactPerson((String)body.get("contactPerson"));
        if (body.containsKey("phone")) s.setPhone((String)body.get("phone"));
        if (body.containsKey("email")) s.setEmail((String)body.get("email"));
        if (body.containsKey("address")) s.setAddress((String)body.get("address"));
        if (body.containsKey("notes")) s.setNotes((String)body.get("notes"));
        return repo.save(s);
    }

    @Transactional
    public void delete(UUID id) { repo.findById(id).ifPresent(s -> { s.setDeleted(true); repo.save(s); }); }
}
