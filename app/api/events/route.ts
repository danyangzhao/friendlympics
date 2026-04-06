import { NextRequest, NextResponse } from 'next/server';
import { createEvent, ensureCanonicalGamesForEvent, getEventByCode, getEventById, updateEventStatus } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, eventCode, startAt, endAt } = body;

    if (!name || !eventCode || !startAt || !endAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const eventId = createEvent(name, eventCode, startAt, endAt);
    ensureCanonicalGamesForEvent(eventId);
    return NextResponse.json({ id: eventId, name, eventCode, startAt, endAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    if (status !== 'active' && status !== 'completed') {
      return NextResponse.json({ error: 'status must be "active" or "completed"' }, { status: 400 });
    }

    const event = getEventById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    updateEventStatus(id, status);
    return NextResponse.json({ ...event, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventCode = searchParams.get('code');
    const eventIdParam = searchParams.get('id');

    if (eventIdParam) {
      const event = getEventById(parseInt(eventIdParam, 10));
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      return NextResponse.json(event);
    }

    if (!eventCode) {
      return NextResponse.json({ error: 'Event code or id required' }, { status: 400 });
    }

    const event = getEventByCode(eventCode);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
