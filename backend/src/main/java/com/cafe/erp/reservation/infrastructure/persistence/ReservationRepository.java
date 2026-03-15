package com.cafe.erp.reservation.infrastructure.persistence;
import com.cafe.erp.reservation.domain.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {
    List<Reservation> findByReservationDateAndDeletedFalseOrderByReservationTime(LocalDate date);
    List<Reservation> findByStatusAndDeletedFalseOrderByReservationDateAscReservationTimeAsc(String status);
    List<Reservation> findByDeletedFalseOrderByReservationDateDescReservationTimeDesc();
}
