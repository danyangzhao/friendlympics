import { NextRequest, NextResponse } from 'next/server';
import {
  createGame,
  getGamesByEvent,
  getEventById,
  updateGame,
  deleteGame,
  ensureCanonicalGamesForEvent,
} from '@/lib/data';
import type { TeamWinRule, TimeDirection } from '@/lib/scoring';
import { defaultsForGameType } from '@/lib/scoring';

const RULES = ['avg_points', 'sum_points', 'avg_time_ms', 'sum_time_ms'] as const;
const DIRS = ['lower_better', 'higher_better'] as const;

function parseTeamWinRule(v: unknown): TeamWinRule | undefined {
  if (typeof v !== 'string') return undefined;
  return RULES.includes(v as TeamWinRule) ? (v as TeamWinRule) : undefined;
}

function parseTimeDirection(v: unknown): TimeDirection | undefined {
  if (typeof v !== 'string') return undefined;
  return DIRS.includes(v as TimeDirection) ? (v as TimeDirection) : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, name, type, rules, teamWinRule, timeDirection } = body;

    if (!eventId || !name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['score', 'time', 'hybrid'].includes(type)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    const eid = typeof eventId === 'number' ? eventId : parseInt(String(eventId), 10);
    if (Number.isNaN(eid) || !getEventById(eid)) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const def = defaultsForGameType(type);
    const tw = parseTeamWinRule(teamWinRule) ?? def.team_win_rule;
    const td = parseTimeDirection(timeDirection) ?? def.time_direction;

    const gameId = createGame(eid, name, type, rules, tw, td);
    return NextResponse.json({ id: gameId, eventId: eid, name, type, rules, teamWinRule: tw, timeDirection: td });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    const id = parseInt(eventId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    if (!getEventById(id)) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Merge canonical games from code so dashboard always lists the full standard set
    ensureCanonicalGamesForEvent(id);
    const games = getGamesByEvent(id);
    return NextResponse.json(games);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, type, rules, teamWinRule, timeDirection } = body;

    if (!id || !name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['score', 'time', 'hybrid'].includes(type)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    const def = defaultsForGameType(type);
    const tw = parseTeamWinRule(teamWinRule) ?? def.team_win_rule;
    const td = parseTimeDirection(timeDirection) ?? def.time_direction;

    updateGame(parseInt(id), name, type, rules, tw, td);
    return NextResponse.json({ id, name, type, rules, teamWinRule: tw, timeDirection: td });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Game ID required' }, { status: 400 });
    }

    deleteGame(parseInt(id));
    return NextResponse.json({ id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
