package com.cafe.erp.tournament.infrastructure.persistence;
import com.cafe.erp.tournament.domain.model.TournamentPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface TournamentPlayerRepository extends JpaRepository<TournamentPlayer, UUID> {
    List<TournamentPlayer> findByTournamentIdOrderByCreatedAt(UUID tournamentId);
    long countByTournamentId(UUID tournamentId);
}
