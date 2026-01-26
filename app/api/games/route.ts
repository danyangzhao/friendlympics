import { NextRequest, NextResponse } from 'next/server';
import { createGame, getGamesByEvent, updateGame, deleteGame } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, name, type, rules } = body;

    if (!eventId || !name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['score', 'time', 'hybrid'].includes(type)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    const gameId = createGame(eventId, name, type, rules);
    return NextResponse.json({ id: gameId, eventId, name, type, rules });
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

    const games = getGamesByEvent(parseInt(eventId));
    return NextResponse.json(games);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, type, rules } = body;

    if (!id || !name || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['score', 'time', 'hybrid'].includes(type)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    updateGame(parseInt(id), name, type, rules);
    return NextResponse.json({ id, name, type, rules });
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
