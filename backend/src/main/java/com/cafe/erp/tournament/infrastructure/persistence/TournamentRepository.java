package com.cafe.erp.tournament.infrastructure.persistence;
import com.cafe.erp.tournament.domain.model.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface TournamentRepository extends JpaRepository<Tournament, UUID> {
    List<Tournament> findByDeletedFalseOrderByTournamentDateDesc();
}
