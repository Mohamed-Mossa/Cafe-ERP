package com.cafe.erp.reservation.infrastructure.persistence;
import com.cafe.erp.reservation.domain.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {
    List<Reservation> findByReservationDateAndDeletedFalseOrderByReservationTime(LocalDate date);
    List<Reservation> findByStatusAndDeletedFalseOrderByReservationDateAscReservationTimeAsc(String status);
    List<Reservation> findByDeletedFalseOrderByReservationDateDescReservationTimeDesc();

    /** CONFIRMED reservations today whose time is between now and now+windowMinutes */
    @Query("SELECT r FROM Reservation r WHERE r.deleted = false AND r.status = 'CONFIRMED' " +
           "AND r.reservationDate = :today " +
           "AND r.reservationTime >= :from AND r.reservationTime <= :to")
    List<Reservation> findConfirmedInWindow(
        @Param("today") LocalDate today,
        @Param("from")  LocalTime from,
        @Param("to")    LocalTime to
    );
}
