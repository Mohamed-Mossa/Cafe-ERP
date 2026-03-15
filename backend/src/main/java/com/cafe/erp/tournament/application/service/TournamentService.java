package com.cafe.erp.tournament.application.service;

import com.cafe.erp.shared.infrastructure.exception.BusinessException;
import com.cafe.erp.shared.infrastructure.security.SecurityUtils;
import com.cafe.erp.tournament.domain.model.Tournament;
import com.cafe.erp.tournament.domain.model.TournamentPlayer;
import com.cafe.erp.tournament.infrastructure.persistence.TournamentPlayerRepository;
import com.cafe.erp.tournament.infrastructure.persistence.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class TournamentService {
    private final TournamentRepository tournamentRepo;
    private final TournamentPlayerRepository playerRepo;

    public List<Tournament> getAll() { return tournamentRepo.findByDeletedFalseOrderByTournamentDateDesc(); }

    public Map<String, Object> getTournamentDetail(UUID id) {
        Tournament t = tournamentRepo.findById(id).orElseThrow(() -> BusinessException.notFound("Tournament"));
        List<TournamentPlayer> players = playerRepo.findByTournamentIdOrderByCreatedAt(id);
        BigDecimal collected = players.stream()
            .filter(TournamentPlayer::isFeePaid)
            .map(TournamentPlayer::getFeeAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("tournament", t, "players", players,
            "totalCollected", collected, "registeredCount", players.size());
    }

    @Transactional
    public Tournament create(Map<String, Object> body) {
        var user = SecurityUtils.currentUser();
        return tournamentRepo.save(Tournament.builder()
            .name((String) body.get("name"))
            .gameName((String) body.getOrDefault("gameName", "FIFA"))
            .tournamentDate(LocalDate.parse((String) body.get("tournamentDate")))
            .entryFee(new BigDecimal(body.getOrDefault("entryFee", "0").toString()))
            .maxPlayers(Integer.parseInt(body.getOrDefault("maxPlayers", "16").toString()))
            .prizePool(new BigDecimal(body.getOrDefault("prizePool", "0").toString()))
            .notes((String) body.get("notes"))
            .cashierId(user.getId())
            .build());
    }

    @Transactional
    public Tournament updateStatus(UUID id, String status) {
        Tournament t = tournamentRepo.findById(id).orElseThrow(() -> BusinessException.notFound("Tournament"));
        t.setStatus(status);
        return tournamentRepo.save(t);
    }

    @Transactional
    public void delete(UUID id) {
        tournamentRepo.findById(id).ifPresent(t -> { t.setDeleted(true); tournamentRepo.save(t); });
    }

    @Transactional
    public TournamentPlayer registerPlayer(UUID tournamentId, Map<String, Object> body) {
        Tournament t = tournamentRepo.findById(tournamentId).orElseThrow(() -> BusinessException.notFound("Tournament"));
        long count = playerRepo.countByTournamentId(tournamentId);
        if (count >= t.getMaxPlayers()) throw new BusinessException("Tournament is full (" + t.getMaxPlayers() + " players max)");
        var user = SecurityUtils.currentUser();
        return playerRepo.save(TournamentPlayer.builder()
            .tournamentId(tournamentId)
            .playerName((String) body.get("playerName"))
            .playerPhone((String) body.get("playerPhone"))
            .customerId(body.get("customerId") != null ? UUID.fromString((String) body.get("customerId")) : null)
            .feePaid(Boolean.parseBoolean(body.getOrDefault("feePaid", "false").toString()))
            .feeAmount(new BigDecimal(body.getOrDefault("feeAmount", t.getEntryFee().toString()).toString()))
            .notes((String) body.get("notes"))
            .cashierId(user.getId())
            .build());
    }

    @Transactional
    public TournamentPlayer updatePlayer(UUID playerId, Map<String, Object> body) {
        TournamentPlayer p = playerRepo.findById(playerId).orElseThrow(() -> BusinessException.notFound("Player"));
        if (body.containsKey("feePaid")) p.setFeePaid(Boolean.parseBoolean(body.get("feePaid").toString()));
        if (body.containsKey("checkedIn")) p.setCheckedIn(Boolean.parseBoolean(body.get("checkedIn").toString()));
        if (body.containsKey("rank")) p.setRank(Integer.parseInt(body.get("rank").toString()));
        if (body.containsKey("notes")) p.setNotes((String) body.get("notes"));
        return playerRepo.save(p);
    }

    @Transactional
    public void removePlayer(UUID playerId) { playerRepo.deleteById(playerId); }
}
