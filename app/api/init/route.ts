import { NextRequest, NextResponse } from 'next/server';
import { createEvent, getEventByCode, ensureCanonicalGamesForEvent } from '@/lib/data';

const DEFAULT_EVENT_CODE = 'FRIENDLYMPICS';
const DEFAULT_EVENT_NAME = 'Friendlympics';

// GET: Auto-initialize the default event and sync canonical games from code
export async function GET() {
  try {
    let event = getEventByCode(DEFAULT_EVENT_CODE);

    if (!event) {
      const start = new Date().toISOString();
      const end = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      createEvent(DEFAULT_EVENT_NAME, DEFAULT_EVENT_CODE, start, end);
      event = getEventByCode(DEFAULT_EVENT_CODE);
    }

    ensureCanonicalGamesForEvent(event!.id);

    return NextResponse.json({
      success: true,
      eventId: event!.id,
      eventCode: event!.event_code,
      eventName: event!.name,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventCode, eventName, startAt, endAt, createSampleGames } = body;

    const existing = getEventByCode(eventCode || 'FRIEND2024');
    if (existing) {
      return NextResponse.json(
        {
          error: 'Event already exists',
          event: existing,
        },
        { status: 400 }
      );
    }

    const code = eventCode || 'FRIEND2024';
    const name = eventName || 'Friendlympics 2024';
    const start = startAt || new Date().toISOString();
    const end = endAt || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    const eventId = createEvent(name, code, start, end);

    if (createSampleGames !== false) {
      ensureCanonicalGamesForEvent(eventId);
    }

    return NextResponse.json({
      success: true,
      eventId,
      eventCode: code,
      message: 'Event created successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
