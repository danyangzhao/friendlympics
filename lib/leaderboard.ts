import { getScoresByEvent, getUsersByEvent, getGamesByEvent, getScoresByGame } from './data';

/** Collapse multiple scores per user to their best score. For score/hybrid: highest points wins. For time: lowest time wins. */
function getBestScoresPerUser(
  scores: { user_id: number; points?: number | null; time_ms?: number | null; [key: string]: any }[],
  gameType: string
): { user_id: number; points?: number | null; time_ms?: number | null; [key: string]: any }[] {
  const byUser = new Map<number, typeof scores>();
  for (const s of scores) {
    const list = byUser.get(s.user_id) || [];
    list.push(s);
    byUser.set(s.user_id, list);
  }
  const result: typeof scores = [];
  for (const [, userScores] of byUser) {
    if (gameType === 'score' || gameType === 'hybrid') {
      const best = userScores.reduce((a, b) => ((b.points ?? 0) > (a.points ?? 0) ? b : a));
      result.push(best);
    } else {
      const best = userScores.reduce((a, b) => {
        const aTime = a.time_ms ?? Infinity;
        const bTime = b.time_ms ?? Infinity;
        return bTime < aTime ? b : a;
      });
      result.push(best);
    }
  }
  return result;
}

export interface TeamLeaderboardEntry {
  team: 'boys' | 'girls';
  totalPoints: number;
  gameScores: Record<number, number>;
  memberCount: number;
}

export interface LeaderboardEntry {
  userId: number;
  name: string;
  nickname?: string;
  avatar?: string;
  totalPoints: number;
  gameScores: Record<number, { points?: number; timeMs?: number; rank: number }>;
  overallRank: number;
}

export function calculateTeamLeaderboard(eventId: number): TeamLeaderboardEntry[] {
  const users = getUsersByEvent(eventId);
  const games = getGamesByEvent(eventId);
  const scores = getScoresByEvent(eventId);

  // Initialize team entries
  const teams: Record<'boys' | 'girls', TeamLeaderboardEntry> = {
    boys: {
      team: 'boys',
      totalPoints: 0,
      gameScores: {},
      memberCount: 0,
    },
    girls: {
      team: 'girls',
      totalPoints: 0,
      gameScores: {},
      memberCount: 0,
    },
  };

  // Count team members
  users.forEach(user => {
    const team = user.team as 'boys' | 'girls' | undefined;
    if (team === 'boys' || team === 'girls') {
      teams[team].memberCount++;
    }
  });

  // Process scores by game
  for (const game of games) {
    const gameScores = scores.filter(s => s.game_id === game.id);
    
    // Group scores by team
    const teamScores: Record<'boys' | 'girls', number> = {
      boys: 0,
      girls: 0,
    };

    if (game.type === 'score' || game.type === 'hybrid') {
      // Sum points by team
      gameScores.forEach(score => {
        const team = (score as { team?: string }).team;
        if (team === 'boys' || team === 'girls') {
          teamScores[team] += (score.points || 0);
        }
      });
    } else if (game.type === 'time') {
      // For time-based, calculate average time per team (lower is better)
      const teamTimes: Record<'boys' | 'girls', number[]> = {
        boys: [],
        girls: [],
      };
      
      gameScores.forEach(score => {
        const team = (score as { team?: string }).team;
        if ((team === 'boys' || team === 'girls') && score.time_ms) {
          teamTimes[team].push(score.time_ms);
        }
      });

      // Calculate average time for each team
      Object.keys(teamTimes).forEach(team => {
        const times = teamTimes[team as 'boys' | 'girls'];
        if (times.length > 0) {
          const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
          // Convert to points (lower time = higher points)
          teamScores[team as 'boys' | 'girls'] = 10000 - avgTime; // Inverse scoring
        }
      });
    }

    // Award 1 point to the winning team (0.5 each for ties)
    const boysScore = teamScores.boys;
    const girlsScore = teamScores.girls;
    
    if (boysScore > girlsScore) {
      teams.boys.gameScores[game.id] = 1;
      teams.girls.gameScores[game.id] = 0;
      teams.boys.totalPoints += 1;
    } else if (girlsScore > boysScore) {
      teams.girls.gameScores[game.id] = 1;
      teams.boys.gameScores[game.id] = 0;
      teams.girls.totalPoints += 1;
    } else {
      // Tie - each team gets 0.5 points
      teams.boys.gameScores[game.id] = 0.5;
      teams.girls.gameScores[game.id] = 0.5;
      teams.boys.totalPoints += 0.5;
      teams.girls.totalPoints += 0.5;
    }
  }

  return [teams.boys, teams.girls].sort((a, b) => b.totalPoints - a.totalPoints);
}

export function calculateLeaderboard(eventId: number): LeaderboardEntry[] {
  const users = getUsersByEvent(eventId);
  const games = getGamesByEvent(eventId);
  const scores = getScoresByEvent(eventId);

  // Initialize user entries
  const userMap = new Map<number, LeaderboardEntry>();
  for (const user of users) {
    userMap.set(user.id, {
      userId: user.id,
      name: user.name,
      nickname: user.nickname,
      avatar: user.avatar,
      totalPoints: 0,
      gameScores: {},
      overallRank: 0,
    });
  }

  // Process scores by game
  for (const game of games) {
    const gameScoresRaw = scores.filter(s => s.game_id === game.id);
    // Use best score per user when a player has multiple entries (e.g. extra slot for smaller team)
    const gameScores = getBestScoresPerUser(gameScoresRaw, game.type);
    
    if (game.type === 'score' || game.type === 'hybrid') {
      // Sort by points descending
      gameScores.sort((a, b) => (b.points || 0) - (a.points || 0));
    } else if (game.type === 'time') {
      // Sort by time ascending (lower is better)
      gameScores.sort((a, b) => (a.time_ms || Infinity) - (b.time_ms || Infinity));
    }

    // Assign ranks
    gameScores.forEach((score, index) => {
      const entry = userMap.get(score.user_id);
      if (!entry) return;

      const rank = index + 1;
      entry.gameScores[game.id] = {
        points: score.points ?? undefined,
        timeMs: score.time_ms ?? undefined,
        rank,
      };
    });

    // Award 1 point to winner(s) - handle ties
    if (gameScores.length > 0) {
      // Determine the winning value (best score or best time)
      const firstScore = gameScores[0];
      let winningValue: number | null;
      
      if (game.type === 'score' || game.type === 'hybrid') {
        winningValue = firstScore.points ?? null;
      } else {
        winningValue = firstScore.time_ms ?? null;
      }

      if (winningValue !== null) {
        // Find all players tied for first place (since array is sorted, check consecutive entries)
        const winners: number[] = [];
        for (const score of gameScores) {
          let scoreValue: number | null;
          
          if (game.type === 'score' || game.type === 'hybrid') {
            scoreValue = score.points ?? null;
          } else {
            scoreValue = score.time_ms ?? null;
          }

          // Check if this score matches the winning value
          if (scoreValue === winningValue) {
            winners.push(score.user_id);
          } else {
            // Since scores are sorted, we can stop once we find a non-winning value
            break;
          }
        }

        // Award points: 1 point divided among winners (0.5 each if 2-way tie, etc.)
        const pointsPerWinner = winners.length > 0 ? 1 / winners.length : 0;
        winners.forEach(userId => {
          const entry = userMap.get(userId);
          if (entry) {
            entry.totalPoints += pointsPerWinner;
          }
        });
      }
    }
  }

  // Convert to array and sort by total points
  const leaderboard = Array.from(userMap.values());
  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

  // Assign overall ranks
  leaderboard.forEach((entry, index) => {
    entry.overallRank = index + 1;
  });

  return leaderboard;
}

export function getGameLeaderboard(gameId: number, gameType: string) {
  const scores = getScoresByGame(gameId);
  // Group by user to get best score and entry count (for extra-slot indicator)
  const byUser = new Map<number, { best: (typeof scores)[0]; count: number }>();
  for (const s of scores) {
    const existing = byUser.get(s.user_id);
    if (!existing) {
      byUser.set(s.user_id, { best: s, count: 1 });
    } else {
      existing.count += 1;
      const isBetter =
        gameType === 'score' || gameType === 'hybrid'
          ? (s.points ?? 0) > (existing.best.points ?? 0)
          : (s.time_ms ?? Infinity) < (existing.best.time_ms ?? Infinity);
      if (isBetter) existing.best = s;
    }
  }
  const result = Array.from(byUser.values()).map(({ best, count }) => ({
    ...best,
    entryCount: count,
  }));
  if (gameType === 'score' || gameType === 'hybrid') {
    return result.sort((a, b) => (b.points || 0) - (a.points || 0));
  } else if (gameType === 'time') {
    return result.sort((a, b) => (a.time_ms || Infinity) - (b.time_ms || Infinity));
  }
  return result;
}
