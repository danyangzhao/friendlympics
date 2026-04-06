import { NextRequest, NextResponse } from 'next/server';
import { getGamesByEvent, getScoresByEvent, getUsersByEvent } from '@/lib/data';
import { calculateTeamLeaderboard, calculateLeaderboard } from '@/lib/leaderboard';
import { computeAllAwards } from '@/lib/awards';
import {
  resolveTeamWinRule,
  resolveTimeDirection,
  aggregateTeamMetric,
  compareTeamMetrics,
} from '@/lib/scoring';

interface TimelinePoint {
  gameId: number;
  gameName: string;
  boys: number;
  girls: number;
}

function buildScoreTimeline(eventId: number): TimelinePoint[] {
  const scores = getScoresByEvent(eventId);
  const games = getGamesByEvent(eventId);
  const users = getUsersByEvent(eventId);

  const userTeamMap = new Map<number, string>();
  for (const u of users) {
    if (u.team) userTeamMap.set(u.id, u.team);
  }

  const gameFirstScore = new Map<number, string>();
  for (const s of scores) {
    if (!gameFirstScore.has(s.game_id)) {
      gameFirstScore.set(s.game_id, s.created_at);
    } else {
      const existing = gameFirstScore.get(s.game_id)!;
      if (s.created_at < existing) {
        gameFirstScore.set(s.game_id, s.created_at);
      }
    }
  }

  const gamesWithScores = games
    .filter((g) => gameFirstScore.has(g.id))
    .sort((a, b) => {
      const ta = gameFirstScore.get(a.id)!;
      const tb = gameFirstScore.get(b.id)!;
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });

  let boysCum = 0;
  let girlsCum = 0;
  const timeline: TimelinePoint[] = [];

  for (const game of gamesWithScores) {
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

    if (metricBoys === null || metricGirls === null) continue;

    const cmp = compareTeamMetrics(metricBoys, metricGirls, rule, direction);
    const EPS = 1e-9;

    if (Math.abs(cmp) < EPS) {
      boysCum += 0.5;
      girlsCum += 0.5;
    } else if (cmp > 0) {
      boysCum += 1;
    } else {
      girlsCum += 1;
    }

    timeline.push({
      gameId: game.id,
      gameName: game.name,
      boys: boysCum,
      girls: girlsCum,
    });
  }

  return timeline;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    const eid = parseInt(eventId, 10);
    const teamLeaderboard = calculateTeamLeaderboard(eid);
    const individualLeaderboard = calculateLeaderboard(eid);
    const timeline = buildScoreTimeline(eid);
    const awards = computeAllAwards(eid);
    const games = getGamesByEvent(eid);

    return NextResponse.json({
      teamLeaderboard,
      individualLeaderboard,
      timeline,
      awards,
      games,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
