import { NextRequest, NextResponse } from 'next/server';
import { createEvent, getEventByCode, createGame } from '@/lib/data';
import type { TeamWinRule, TimeDirection } from '@/lib/scoring';

const DEFAULT_EVENT_CODE = 'FRIENDLYMPICS';
const DEFAULT_EVENT_NAME = 'Friendlympics';

type SampleGame = {
  name: string;
  type: 'score' | 'time' | 'hybrid';
  rules: string;
  team_win_rule: TeamWinRule;
  time_direction: TimeDirection;
};

const SAMPLE_GAMES: SampleGame[] = [
  {
    name: 'Charades',
    type: 'score',
    rules: "Act out the prompts! 60 seconds per round. Your team guesses what you're acting.",
    team_win_rule: 'avg_points',
    time_direction: 'lower_better',
  },
  {
    name: 'Guess the Song',
    type: 'score',
    rules: 'Listen to the clue and guess the song! 60 seconds per round.',
    team_win_rule: 'avg_points',
    time_direction: 'lower_better',
  },
  {
    name: 'Fastest Typer',
    type: 'hybrid',
    rules: 'Type the displayed text as fast and accurately as possible. Score = WPM with accuracy bonus.',
    team_win_rule: 'avg_points',
    time_direction: 'lower_better',
  },
  {
    name: 'Trivia Quiz',
    type: 'score',
    rules: 'Answer trivia questions! First team to buzz in gets to answer. +1 point for correct answers.',
    team_win_rule: 'avg_points',
    time_direction: 'lower_better',
  },
  {
    name: 'Memory Match',
    type: 'hybrid',
    rules: 'Flip cards to find matching pairs. Score based on moves and time - fewer moves = higher score!',
    team_win_rule: 'avg_points',
    time_direction: 'lower_better',
  },
  {
    name: 'Speed Drawing',
    type: 'score',
    rules: "Draw each word as fast as you can! The app shows 25 random words per round. Host enters team scores when you're done.",
    team_win_rule: 'avg_points',
    time_direction: 'lower_better',
  },
  {
    name: 'Eggs in a Carton',
    type: 'time',
    rules: "Bounce ping pong balls into an egg carton — fill the carton as fast as you can! Shortest time wins. Host enters each team's time in the app.",
    team_win_rule: 'avg_time_ms',
    time_direction: 'lower_better',
  },
  {
    name: '4x400 Meter Relay',
    type: 'time',
    rules: 'Each team member runs 400m. Fastest combined team time wins!',
    team_win_rule: 'sum_time_ms',
    time_direction: 'lower_better',
  },
  {
    name: 'Plank + Wall Sit Relay',
    type: 'time',
    rules: 'Team endurance challenge! Combined time holding plank and wall sit positions.',
    team_win_rule: 'avg_time_ms',
    time_direction: 'higher_better',
  },
  {
    name: '500-Piece Puzzle',
    type: 'time',
    rules: 'Race to complete a 500-piece puzzle. Fastest team wins!',
    team_win_rule: 'avg_time_ms',
    time_direction: 'lower_better',
  },
  {
    name: 'Beer Pong',
    type: 'score',
    rules: 'Classic beer pong tournament. Points = number of games won.',
    team_win_rule: 'avg_points',
    time_direction: 'lower_better',
  },
  {
    name: 'Flip Cup Relay',
    type: 'time',
    rules: 'Team relay - drink and flip your cup! Fastest team to flip all cups wins.',
    team_win_rule: 'avg_time_ms',
    time_direction: 'lower_better',
  },
];

export async function GET() {
  try {
    let event = getEventByCode(DEFAULT_EVENT_CODE);

    if (!event) {
      const start = new Date().toISOString();
      const end = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const eventId = createEvent(DEFAULT_EVENT_NAME, DEFAULT_EVENT_CODE, start, end);

      for (const game of SAMPLE_GAMES) {
        createGame(eventId, game.name, game.type, game.rules, game.team_win_rule, game.time_direction);
      }

      event = getEventByCode(DEFAULT_EVENT_CODE);
    }

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
      for (const game of SAMPLE_GAMES) {
        createGame(eventId, game.name, game.type, game.rules, game.team_win_rule, game.time_direction);
      }
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
