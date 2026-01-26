import { NextRequest, NextResponse } from 'next/server';
import { createEvent, getEventByCode, createGame } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventCode, eventName, startAt, endAt, createSampleGames } = body;

    // Check if event already exists
    const existing = getEventByCode(eventCode || 'FRIEND2024');
    if (existing) {
      return NextResponse.json({ 
        error: 'Event already exists',
        event: existing 
      }, { status: 400 });
    }

    const code = eventCode || 'FRIEND2024';
    const name = eventName || 'Friendlympics 2024';
    const start = startAt || new Date().toISOString();
    const end = endAt || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    const eventId = createEvent(name, code, start, end);

    if (createSampleGames !== false) {
      // Create sample games
      const games = [
        { name: 'Charades', type: 'score' as const, rules: 'Act out the prompts! 60 seconds per round.' },
        { name: 'Guess the Song', type: 'score' as const, rules: 'Guess the song from the clue!' },
        { name: '100m Dash', type: 'time' as const, rules: 'Fastest time wins!' },
        { name: 'Puzzle Challenge', type: 'hybrid' as const, rules: 'Complete puzzles. Points for completion, time bonus!' },
      ];

      for (const game of games) {
        createGame(eventId, game.name, game.type, game.rules);
      }
    }

    return NextResponse.json({ 
      success: true,
      eventId,
      eventCode: code,
      message: 'Event created successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
