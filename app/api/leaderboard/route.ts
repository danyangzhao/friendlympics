import { NextRequest, NextResponse } from 'next/server';
import { calculateLeaderboard, getGameLeaderboard, calculateTeamLeaderboard } from '@/lib/leaderboard';
import { getGameById } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const gameId = searchParams.get('gameId');
    const type = searchParams.get('type'); // 'team' or 'individual'

    if (gameId) {
      const game = getGameById(parseInt(gameId));
      if (!game) {
        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
      }
      const leaderboard = getGameLeaderboard(parseInt(gameId));
      return NextResponse.json(leaderboard);
    } else if (eventId) {
      if (type === 'team') {
        const leaderboard = calculateTeamLeaderboard(parseInt(eventId));
        return NextResponse.json(leaderboard);
      } else {
        const leaderboard = calculateLeaderboard(parseInt(eventId));
        return NextResponse.json(leaderboard);
      }
    } else {
      return NextResponse.json({ error: 'eventId or gameId required' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
