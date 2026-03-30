import { NextRequest, NextResponse } from 'next/server';
import { getGamesByEvent } from '@/lib/data';
import { getGameLeaderboard } from '@/lib/leaderboard';

/** Per-game top players for individual awards (same sort as game leaderboard). */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '3', 10) || 3, 20);

    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 });
    }

    const games = getGamesByEvent(parseInt(eventId, 10));
    const payload = games.map((g) => ({
      gameId: g.id,
      gameName: g.name,
      type: g.type,
      teamWinRule: g.team_win_rule,
      timeDirection: g.time_direction,
      topPlayers: getGameLeaderboard(g.id).slice(0, limit),
    }));

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
