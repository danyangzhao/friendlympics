import {
  getScoresByEvent,
  getScoresByGame,
  getUsersByEvent,
  getGamesByEvent,
  getGameById,
} from './data';
import {
  aggregateTeamMetric,
  compareTeamMetrics,
  resolveTeamWinRule,
  resolveTimeDirection,
} from './scoring';

/** Collapse multiple scores per user to their best score. For score/hybrid: highest points wins. For time: respects time_direction. */
function getBestScoresPerUser(
  scores: { user_id: number; points?: number | null; time_ms?: number | null; [key: string]: any }[],
  gameType: string,
  timeDirection: 'lower_better' | 'higher_better' = 'lower_better'
): typeof scores {
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
        const aTime = a.time_ms ?? (timeDirection === 'lower_better' ? Infinity : -Infinity);
        const bTime = b.time_ms ?? (timeDirection === 'lower_better' ? Infinity : -Infinity);
        if (timeDirection === 'lower_better') {
          return bTime < aTime ? b : a;
        }
        return bTime > aTime ? b : a;
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

const EPS = 1e-9;

export function calculateTeamLeaderboard(eventId: number): TeamLeaderboardEntry[] {
  const users = getUsersByEvent(eventId);
  const games = getGamesByEvent(eventId);
  const scores = getScoresByEvent(eventId);

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

  users.forEach((user) => {
    if (user.team === 'boys' || user.team === 'girls') {
      teams[user.team as 'boys' | 'girls'].memberCount++;
    }
  });

  for (const game of games) {
    const gameScores = scores.filter((s) => s.game_id === game.id);
    const boysRows = gameScores.filter((s) => s.team === 'boys');
    const girlsRows = gameScores.filter((s) => s.team === 'girls');

    if (boysRows.length === 0 || girlsRows.length === 0) {
      continue;
    }

    const rule = resolveTeamWinRule(game);
    const direction = resolveTimeDirection(game);

    const metricBoys = aggregateTeamMetric(boysRows, rule);
    const metricGirls = aggregateTeamMetric(girlsRows, rule);

    if (metricBoys === null || metricGirls === null) {
      continue;
    }

    const cmp = compareTeamMetrics(metricBoys, metricGirls, rule, direction);

    if (Math.abs(cmp) < EPS) {
      teams.boys.gameScores[game.id] = 0.5;
      teams.girls.gameScores[game.id] = 0.5;
      teams.boys.totalPoints += 0.5;
      teams.girls.totalPoints += 0.5;
    } else if (cmp > 0) {
      teams.boys.gameScores[game.id] = 1;
      teams.girls.gameScores[game.id] = 0;
      teams.boys.totalPoints += 1;
    } else {
      teams.girls.gameScores[game.id] = 1;
      teams.boys.gameScores[game.id] = 0;
      teams.girls.totalPoints += 1;
    }
  }

  return [teams.boys, teams.girls].sort((a, b) => b.totalPoints - a.totalPoints);
}

export function calculateLeaderboard(eventId: number): LeaderboardEntry[] {
  const users = getUsersByEvent(eventId);
  const games = getGamesByEvent(eventId);
  const scores = getScoresByEvent(eventId);

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

  for (const game of games) {
    const gameScoresRaw = scores.filter((s) => s.game_id === game.id);
    const timeDirection = resolveTimeDirection(game);
    const gameScores = getBestScoresPerUser(gameScoresRaw, game.type, timeDirection);

    if (game.type === 'score' || game.type === 'hybrid') {
      gameScores.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
    } else if (game.type === 'time') {
      gameScores.sort((a, b) => {
        const ta = a.time_ms ?? (timeDirection === 'lower_better' ? Infinity : -Infinity);
        const tb = b.time_ms ?? (timeDirection === 'lower_better' ? Infinity : -Infinity);
        if (ta === tb) return 0;
        return timeDirection === 'lower_better' ? ta - tb : tb - ta;
      });
    }

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

    if (gameScores.length > 0) {
      const firstScore = gameScores[0];
      let winningValue: number | null = null;

      if (game.type === 'score' || game.type === 'hybrid') {
        winningValue = firstScore.points ?? null;
      } else {
        winningValue = firstScore.time_ms ?? null;
      }

      if (winningValue !== null) {
        const winners: number[] = [];
        for (const score of gameScores) {
          let scoreValue: number | null;
          if (game.type === 'score' || game.type === 'hybrid') {
            scoreValue = score.points ?? null;
          } else {
            scoreValue = score.time_ms ?? null;
          }

          if (scoreValue === null) break;
          const tie =
            game.type === 'time'
              ? Math.abs((scoreValue as number) - winningValue) < EPS
              : scoreValue === winningValue;
          if (tie) {
            winners.push(score.user_id);
          } else {
            break;
          }
        }

        const pointsPerWinner = winners.length > 0 ? 1 / winners.length : 0;
        winners.forEach((userId) => {
          const entry = userMap.get(userId);
          if (entry) {
            entry.totalPoints += pointsPerWinner;
          }
        });
      }
    }
  }

  const leaderboard = Array.from(userMap.values());
  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

  leaderboard.forEach((entry, index) => {
    entry.overallRank = index + 1;
  });

  return leaderboard;
}

export function getGameLeaderboard(gameId: number) {
  const game = getGameById(gameId);
  if (!game) {
    return [];
  }

  const rows = getScoresByGame(gameId);
  const timeDirection = resolveTimeDirection(game);

  const byUser = new Map<number, { best: (typeof rows)[0]; count: number }>();
  for (const s of rows) {
    const existing = byUser.get(s.user_id);
    if (!existing) {
      byUser.set(s.user_id, { best: s, count: 1 });
    } else {
      existing.count += 1;
      let isBetter: boolean;
      if (game.type === 'score' || game.type === 'hybrid') {
        isBetter = (s.points ?? 0) > (existing.best.points ?? 0);
      } else {
        const sTime = s.time_ms ?? (timeDirection === 'lower_better' ? Infinity : -Infinity);
        const eTime = existing.best.time_ms ?? (timeDirection === 'lower_better' ? Infinity : -Infinity);
        isBetter = timeDirection === 'lower_better' ? sTime < eTime : sTime > eTime;
      }
      if (isBetter) existing.best = s;
    }
  }

  const result = Array.from(byUser.values()).map(({ best, count }) => ({
    ...best,
    entryCount: count,
  }));

  if (game.type === 'score' || game.type === 'hybrid') {
    return result.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  }
  if (game.type === 'time') {
    return result.sort((a, b) => {
      const ta = a.time_ms ?? (timeDirection === 'lower_better' ? Infinity : -Infinity);
      const tb = b.time_ms ?? (timeDirection === 'lower_better' ? Infinity : -Infinity);
      if (ta === tb) return 0;
      return timeDirection === 'lower_better' ? ta - tb : tb - ta;
    });
  }

  return result;
}
