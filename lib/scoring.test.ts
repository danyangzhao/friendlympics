import { describe, it, expect } from 'vitest';
import {
  aggregateTeamMetric,
  compareTeamMetrics,
  defaultsForGameType,
  resolveTeamWinRule,
} from './scoring';

describe('defaultsForGameType', () => {
  it('maps score to avg_points', () => {
    expect(defaultsForGameType('score').team_win_rule).toBe('avg_points');
  });
  it('maps time to avg_time_ms', () => {
    expect(defaultsForGameType('time').team_win_rule).toBe('avg_time_ms');
  });
});

describe('aggregateTeamMetric', () => {
  it('averages points', () => {
    expect(aggregateTeamMetric([{ points: 10 }, { points: 20 }], 'avg_points')).toBe(15);
  });
  it('sums relay legs', () => {
    expect(
      aggregateTeamMetric([{ time_ms: 60000 }, { time_ms: 62000 }, { time_ms: 58000 }], 'sum_time_ms')
    ).toBe(180000);
  });
  it('averages time for plank-style', () => {
    expect(aggregateTeamMetric([{ time_ms: 120000 }, { time_ms: 90000 }], 'avg_time_ms')).toBe(105000);
  });
});

describe('compareTeamMetrics', () => {
  it('relay: lower total wins', () => {
    expect(compareTeamMetrics(180000, 200000, 'sum_time_ms', 'lower_better')).toBeGreaterThan(0);
  });
  it('plank avg: longer wins', () => {
    expect(compareTeamMetrics(120000, 90000, 'avg_time_ms', 'higher_better')).toBeGreaterThan(0);
  });
  it('trivia: higher avg points wins', () => {
    expect(compareTeamMetrics(5, 3, 'avg_points', 'lower_better')).toBeGreaterThan(0);
  });
});

describe('resolveTeamWinRule', () => {
  it('falls back from missing column', () => {
    expect(resolveTeamWinRule({ type: 'score' })).toBe('avg_points');
  });
});
