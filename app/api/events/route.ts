import { NextRequest, NextResponse } from 'next/server';
import { createEvent, getEventByCode } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, eventCode, startAt, endAt } = body;

    if (!name || !eventCode || !startAt || !endAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const eventId = createEvent(name, eventCode, startAt, endAt);
    return NextResponse.json({ id: eventId, name, eventCode, startAt, endAt });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventCode = searchParams.get('code');

    if (!eventCode) {
      return NextResponse.json({ error: 'Event code required' }, { status: 400 });
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
