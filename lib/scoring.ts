export type TeamWinRule = 'avg_points' | 'sum_points' | 'avg_time_ms' | 'sum_time_ms';
export type TimeDirection = 'lower_better' | 'higher_better';
export type GameType = 'score' | 'time' | 'hybrid';

export function defaultsForGameType(type: GameType): { team_win_rule: TeamWinRule; time_direction: TimeDirection } {
  switch (type) {
    case 'score':
      return { team_win_rule: 'avg_points', time_direction: 'lower_better' };
    case 'time':
      return { team_win_rule: 'avg_time_ms', time_direction: 'lower_better' };
    case 'hybrid':
      return { team_win_rule: 'avg_points', time_direction: 'lower_better' };
  }
}

export function resolveTeamWinRule(game: {
  team_win_rule?: string | null;
  type: string;
}): TeamWinRule {
  const r = game.team_win_rule as TeamWinRule | undefined;
  if (r === 'avg_points' || r === 'sum_points' || r === 'avg_time_ms' || r === 'sum_time_ms') {
    return r;
  }
  return defaultsForGameType(game.type as GameType).team_win_rule;
}

export function resolveTimeDirection(game: { time_direction?: string | null }): TimeDirection {
  return game.time_direction === 'higher_better' ? 'higher_better' : 'lower_better';
}

export type ScoreRow = {
  points?: number | null;
  time_ms?: number | null;
};

export function aggregateTeamMetric(rows: ScoreRow[], rule: TeamWinRule): number | null {
  if (rows.length === 0) return null;

  switch (rule) {
    case 'avg_points': {
      const sum = rows.reduce((a, s) => a + (s.points ?? 0), 0);
      return sum / rows.length;
    }
    case 'sum_points': {
      return rows.reduce((a, s) => a + (s.points ?? 0), 0);
    }
    case 'avg_time_ms': {
      const withTime = rows.filter((s) => s.time_ms != null && s.time_ms !== undefined);
      if (withTime.length === 0) return null;
      const sum = withTime.reduce((a, s) => a + (s.time_ms as number), 0);
      return sum / withTime.length;
    }
    case 'sum_time_ms': {
      const withTime = rows.filter((s) => s.time_ms != null && s.time_ms !== undefined);
      if (withTime.length === 0) return null;
      return withTime.reduce((a, s) => a + (s.time_ms as number), 0);
    }
    default:
      return null;
  }
}

export function teamTimeHigherIsBetter(rule: TeamWinRule, direction: TimeDirection): boolean {
  const isTime = rule === 'avg_time_ms' || rule === 'sum_time_ms';
  if (!isTime) return true;
  return direction === 'higher_better';
}

export function compareTeamMetrics(
  metricA: number,
  metricB: number,
  rule: TeamWinRule,
  direction: TimeDirection
): number {
  const higherWins = teamTimeHigherIsBetter(rule, direction);
  if (higherWins) {
    return metricA - metricB;
  }
  return metricB - metricA;
}
