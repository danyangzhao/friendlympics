# Friendlympics

A web app for tracking scores and playing games during a multi-day competition event with friends.

## Features

- **Event Registration**: Simple code-based check-in (no email required)
- **Profile Creation**: Quick profile setup with name and optional nickname
- **Score Tracking**: Track points, time, or both for different game types
- **Live Leaderboard**: See who's winning each game and overall standings
- **In-App Games**: Built-in charades and guess-the-song games with randomized prompts
- **Host View**: Easy admin interface to add games and enter scores

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Creating Your First Event

### Quick Start

1. Visit `/init` in your browser to create your first event with sample games
2. Share the event code with participants
3. Participants join using the event code on the home page
4. Use the Host View (`/host`) to add more games or enter scores
5. Start tracking scores and playing games!

### Alternative: API Initialization

You can also initialize an event via API:

```bash
curl -X POST http://localhost:3000/api/init \
  -H "Content-Type: application/json" \
  -d '{"eventCode": "FRIEND2024", "eventName": "Friendlympics 2024"}'
```

## Game Types

- **Score**: Points-based games (higher is better)
- **Time**: Time-based games (lower is better)
- **Hybrid**: Both points and time matter

## In-App Games

Games with "charade" or "song" in the name can be played directly in the app:
- **Charades**: Randomized prompts with timer
- **Guess the Song**: Song clues with artist and title reveal

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- SQLite (better-sqlite3)
- Tailwind CSS

## Database

The SQLite database is automatically created in `data/friendlympics.db` on first run.
