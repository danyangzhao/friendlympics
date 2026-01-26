import { NextRequest, NextResponse } from 'next/server';
import { createScore, getScoresByGame, getScoresByEvent, updateScore, deleteScore } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, gameId, userId, points, timeMs, notes } = body;

    if (!eventId || !gameId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const scoreId = createScore(eventId, gameId, userId, points, timeMs, notes);
    return NextResponse.json({ id: scoreId, eventId, gameId, userId, points, timeMs, notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const eventId = searchParams.get('eventId');

    if (gameId) {
      const scores = getScoresByGame(parseInt(gameId));
      return NextResponse.json(scores);
    } else if (eventId) {
      const scores = getScoresByEvent(parseInt(eventId));
      return NextResponse.json(scores);
    } else {
      return NextResponse.json({ error: 'gameId or eventId required' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, points, timeMs, notes } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    updateScore(parseInt(id), parseInt(userId), points, timeMs, notes);
    return NextResponse.json({ id, userId, points, timeMs, notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Score ID required' }, { status: 400 });
    }

    deleteScore(parseInt(id));
    return NextResponse.json({ id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
