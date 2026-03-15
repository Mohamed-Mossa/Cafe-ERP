package com.cafe.erp.gaming.infrastructure.persistence;
import com.cafe.erp.gaming.domain.model.Device;
import com.cafe.erp.gaming.domain.model.DeviceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface DeviceRepository extends JpaRepository<Device, UUID> {
    List<Device> findByActiveAndDeletedFalseOrderByName(boolean active);
    List<Device> findByStatus(DeviceStatus status);
}
