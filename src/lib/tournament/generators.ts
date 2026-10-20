export interface PlayerRef {
  id: string;
  name: string;
  gender: string;
}

export interface GeneratedMatch {
  courtNumber: number;
  team1Player1Id: string;
  team1Player2Id?: string;
  team1Name: string;
  team2Player1Id: string;
  team2Player2Id?: string;
  team2Name: string;
}

export interface GeneratedRound {
  roundNumber: number;
  matches: GeneratedMatch[];
  restingPlayerIds?: string[];
}

/**
 * Standard Berger Double Rotation for 4, 8, 12, 16 players
 * or Greedy Combinatorial Balance for any player count
 */
export function generateAmericanoRounds(
  players: PlayerRef[],
  customRoundCount?: number,
  customCourtsCount?: number
): GeneratedRound[] {
  const n = players.length;
  if (n < 4) {
    throw new Error("Paling sedikit dibutuhkan 4 pemain untuk turnamen");
  }

  const maxPossibleCourts = Math.floor(n / 4);
  const courtsCount = Math.max(
    1,
    Math.min(customCourtsCount || maxPossibleCourts, maxPossibleCourts)
  );
  const activePerRound = courtsCount * 4;

  // Determine rounds count:
  // If there are resting players (e.g. 8 players on 1 court), provide more rounds so everyone plays fairly
  const hasResting = n > activePerRound;
  let totalRounds = customRoundCount;
  if (!totalRounds) {
    if (hasResting) {
      totalRounds = Math.min(Math.ceil((n * 3) / activePerRound), 10);
    } else {
      totalRounds = n % 4 === 0 ? Math.min(n - 1, 7) : 5;
    }
  }
  if (totalRounds < 1) totalRounds = 3;

  const playerIds = players.map((p) => p.id);
  const playerMap = new Map(players.map((p) => [p.id, p.name]));

  // Matrices to track pairings and matchups to maximize fairness
  const partnerCount: Record<string, Record<string, number>> = {};
  const opponentCount: Record<string, Record<string, number>> = {};
  const playCount: Record<string, number> = {};

  playerIds.forEach((id) => {
    partnerCount[id] = {};
    opponentCount[id] = {};
    playCount[id] = 0;
    playerIds.forEach((other) => {
      partnerCount[id][other] = 0;
      opponentCount[id][other] = 0;
    });
  });

  const rounds: GeneratedRound[] = [];

  for (let r = 1; r <= totalRounds; r++) {
    // Select active players for this round (prioritize those who played least)
    const sortedByPlay = [...playerIds].sort((a, b) => {
      if (playCount[a] !== playCount[b]) return playCount[a] - playCount[b];
      return Math.random() - 0.5;
    });

    const activePlayers = sortedByPlay.slice(0, activePerRound);
    const restingPlayers = sortedByPlay.slice(activePerRound);

    // Form pairs and matches minimizing repeat partners
    const matches: GeneratedMatch[] = [];
    const pool = [...activePlayers];

    for (let c = 1; c <= courtsCount; c++) {
      // Pick 4 players from pool that have least partnered
      let bestT1A = pool[0];
      let bestT1B = pool[1];
      let bestScore = Infinity;

      // Find best team 1
      for (let i = 0; i < pool.length; i++) {
        for (let j = i + 1; j < pool.length; j++) {
          const score = partnerCount[pool[i]][pool[j]];
          if (score < bestScore) {
            bestScore = score;
            bestT1A = pool[i];
            bestT1B = pool[j];
          }
        }
      }

      // Remove team 1 from pool
      const remaining = pool.filter((id) => id !== bestT1A && id !== bestT1B);
      let bestT2A = remaining[0];
      let bestT2B = remaining[1];
      let bestT2Score = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        for (let j = i + 1; j < remaining.length; j++) {
          const pScore = partnerCount[remaining[i]][remaining[j]];
          const oppScore =
            opponentCount[bestT1A][remaining[i]] +
            opponentCount[bestT1A][remaining[j]] +
            opponentCount[bestT1B][remaining[i]] +
            opponentCount[bestT1B][remaining[j]];
          const combined = pScore * 3 + oppScore;
          if (combined < bestT2Score) {
            bestT2Score = combined;
            bestT2A = remaining[i];
            bestT2B = remaining[j];
          }
        }
      }

      // Remove chosen 4 from pool
      const chosen = [bestT1A, bestT1B, bestT2A, bestT2B];
      chosen.forEach((id) => {
        const idx = pool.indexOf(id);
        if (idx !== -1) pool.splice(idx, 1);
        playCount[id]++;
      });

      // Update partnership matrix
      partnerCount[bestT1A][bestT1B]++;
      partnerCount[bestT1B][bestT1A]++;
      partnerCount[bestT2A][bestT2B]++;
      partnerCount[bestT2B][bestT2A]++;

      // Update opponent matrix
      [bestT1A, bestT1B].forEach((t1) => {
        [bestT2A, bestT2B].forEach((t2) => {
          opponentCount[t1][t2]++;
          opponentCount[t2][t1]++;
        });
      });

      const t1Name = `${playerMap.get(bestT1A)} & ${playerMap.get(bestT1B)}`;
      const t2Name = `${playerMap.get(bestT2A)} & ${playerMap.get(bestT2B)}`;

      matches.push({
        courtNumber: c,
        team1Player1Id: bestT1A,
        team1Player2Id: bestT1B,
        team1Name: t1Name,
        team2Player1Id: bestT2A,
        team2Player2Id: bestT2B,
        team2Name: t2Name,
      });
    }

    rounds.push({
      roundNumber: r,
      matches,
      restingPlayerIds: restingPlayers,
    });
  }

  return rounds;
}

/**
 * Generate a single Mexicano round based on current player standings
 */
export function generateNextMexicanoRound(
  roundNumber: number,
  standings: { playerId: string; name: string; rank: number; points: number }[],
  totalCourts?: number
): GeneratedRound {
  const courts = totalCourts || Math.floor(standings.length / 4);
  const activeCount = courts * 4;
  const active = standings.slice(0, activeCount);
  const resting = standings.slice(activeCount).map((s) => s.playerId);

  const matches: GeneratedMatch[] = [];

  for (let c = 0; c < courts; c++) {
    // 4 players on this court: rank 1, 2, 3, 4 on court 1
    // Mexicano standard pairing: #1 & #4 vs #2 & #3 (ensures tight balanced games)
    const p1 = active[c * 4];
    const p2 = active[c * 4 + 1];
    const p3 = active[c * 4 + 2];
    const p4 = active[c * 4 + 3];

    matches.push({
      courtNumber: c + 1,
      team1Player1Id: p1.playerId,
      team1Player2Id: p4.playerId,
      team1Name: `${p1.name} & ${p4.name}`,
      team2Player1Id: p2.playerId,
      team2Player2Id: p3.playerId,
      team2Name: `${p2.name} & ${p3.name}`,
    });
  }

  return {
    roundNumber,
    matches,
    restingPlayerIds: resting,
  };
}

/**
 * Calculate full tournament standings from match results
 */
export function computeStandings(
  players: { id: string; name: string; gender: string }[],
  matches: {
    status: string;
    team1Player1Id: string;
    team1Player2Id?: string | null;
    team2Player1Id: string;
    team2Player2Id?: string | null;
    team1Score: number;
    team2Score: number;
  }[]
) {
  const statsMap = new Map<
    string,
    {
      playerId: string;
      name: string;
      gender: string;
      pointsScored: number;
      pointsConceded: number;
      matchesPlayed: number;
      matchesWon: number;
      matchesLost: number;
      matchesDrawn: number;
      pointDiff: number;
      rank: number;
    }
  >();

  players.forEach((p) => {
    statsMap.set(p.id, {
      playerId: p.id,
      name: p.name,
      gender: p.gender,
      pointsScored: 0,
      pointsConceded: 0,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      matchesDrawn: 0,
      pointDiff: 0,
      rank: 1,
    });
  });

  matches.forEach((m) => {
    if (m.status !== "COMPLETED") return;

    const t1 = [m.team1Player1Id, m.team1Player2Id].filter(Boolean) as string[];
    const t2 = [m.team2Player1Id, m.team2Player2Id].filter(Boolean) as string[];

    const s1 = m.team1Score;
    const s2 = m.team2Score;

    const isT1Win = s1 > s2;
    const isT2Win = s2 > s1;
    const isDraw = s1 === s2;

    t1.forEach((id) => {
      const p = statsMap.get(id);
      if (p) {
        p.pointsScored += s1;
        p.pointsConceded += s2;
        p.matchesPlayed += 1;
        if (isT1Win) p.matchesWon += 1;
        else if (isDraw) p.matchesDrawn += 1;
        else p.matchesLost += 1;
        p.pointDiff = p.pointsScored - p.pointsConceded;
      }
    });

    t2.forEach((id) => {
      const p = statsMap.get(id);
      if (p) {
        p.pointsScored += s2;
        p.pointsConceded += s1;
        p.matchesPlayed += 1;
        if (isT2Win) p.matchesWon += 1;
        else if (isDraw) p.matchesDrawn += 1;
        else p.matchesLost += 1;
        p.pointDiff = p.pointsScored - p.pointsConceded;
      }
    });
  });

  // Sort: pointsScored desc, pointDiff desc, matchesWon desc
  const list = Array.from(statsMap.values()).sort((a, b) => {
    if (b.pointsScored !== a.pointsScored) {
      return b.pointsScored - a.pointsScored;
    }
    if (b.pointDiff !== a.pointDiff) {
      return b.pointDiff - a.pointDiff;
    }
    return b.matchesWon - a.matchesWon;
  });

  // Assign ranks
  list.forEach((item, index) => {
    item.rank = index + 1;
  });

  return list;
}
