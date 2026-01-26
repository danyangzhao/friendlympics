import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUsersByEvent, updateUser, deleteUser } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, name, nickname, avatar, team } = body;

    if (!eventId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userId = createUser(eventId, name, nickname, avatar, team);
    return NextResponse.json({ id: userId, eventId, name, nickname, avatar, team });
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

    const users = getUsersByEvent(parseInt(eventId));
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, nickname, team } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    updateUser(parseInt(id), name, nickname, team);
    return NextResponse.json({ id, name, nickname, team });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    deleteUser(parseInt(id));
    return NextResponse.json({ id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
