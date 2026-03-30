import { NextRequest, NextResponse } from 'next/server';
import { createEvent, getEventByCode, createGame } from '@/lib/data';

const DEFAULT_EVENT_CODE = 'FRIENDLYMPICS';
const DEFAULT_EVENT_NAME = 'Friendlympics';

// Sample games to create for new events
const SAMPLE_GAMES = [
  // Interactive In-App Games (detected by keywords in name)
  { name: 'Charades', type: 'score' as const, rules: 'Act out the prompts! 60 seconds per round. Your team guesses what you\'re acting.' },
  { name: 'Guess the Song', type: 'score' as const, rules: 'Listen to the clue and guess the song! 60 seconds per round.' },
  { name: 'Fastest Typer', type: 'hybrid' as const, rules: 'Type the displayed text as fast and accurately as possible. Score = WPM with accuracy bonus.' },
  { name: 'Trivia Quiz', type: 'score' as const, rules: 'Answer trivia questions! First team to buzz in gets to answer. +1 point for correct answers.' },
  { name: 'Memory Match', type: 'hybrid' as const, rules: 'Flip cards to find matching pairs. Score based on moves and time - fewer moves = higher score!' },
  { name: 'Speed Drawing', type: 'score' as const, rules: 'Draw each word as fast as you can! The app shows 25 random words per round. Host enters team scores when you\'re done.' },
  
  // Manual Score Entry Games (host records scores after physical activity)
  { name: 'Eggs in a Carton', type: 'time' as const, rules: 'Bounce ping pong balls into an egg carton — fill the carton as fast as you can! Shortest time wins. Host enters each team\'s time in the app.' },
  { name: '4x400 Meter Relay', type: 'time' as const, rules: 'Each team member runs 400m. Fastest combined team time wins!' },
  { name: 'Plank + Wall Sit Relay', type: 'time' as const, rules: 'Team endurance challenge! Combined time holding plank and wall sit positions.' },
  { name: '500-Piece Puzzle', type: 'time' as const, rules: 'Race to complete a 500-piece puzzle. Fastest team wins!' },
  { name: 'Beer Pong', type: 'score' as const, rules: 'Classic beer pong tournament. Points = number of games won.' },
  { name: 'Flip Cup Relay', type: 'time' as const, rules: 'Team relay - drink and flip your cup! Fastest team to flip all cups wins.' },
];

// GET: Auto-initialize and return the default event
export async function GET() {
  try {
    // Check if default event exists
    let event = getEventByCode(DEFAULT_EVENT_CODE);
    
    if (!event) {
      // Create the default event
      const start = new Date().toISOString();
      const end = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year from now
      
      const eventId = createEvent(DEFAULT_EVENT_NAME, DEFAULT_EVENT_CODE, start, end);
      
      // Create sample games
      for (const game of SAMPLE_GAMES) {
        createGame(eventId, game.name, game.type, game.rules);
      }
      
      event = getEventByCode(DEFAULT_EVENT_CODE);
    }
    
    return NextResponse.json({
      success: true,
      eventId: event.id,
      eventCode: event.event_code,
      eventName: event.name,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
      for (const game of SAMPLE_GAMES) {
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
