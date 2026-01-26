import db from '../lib/db';
import { createEvent, createGame, createUser } from '../lib/data';

// Initialize a sample event for testing
const eventCode = 'FRIEND2024';
const eventName = 'Friendlympics 2024';
const startAt = new Date('2024-04-01T09:00:00').toISOString();
const endAt = new Date('2024-04-02T18:00:00').toISOString();

console.log('Creating sample event...');

try {
  // Create event
  const eventId = createEvent(eventName, eventCode, startAt, endAt);
  console.log(`✓ Event created with ID: ${eventId}`);
  console.log(`  Event Code: ${eventCode}`);

  // Create sample games
  const games = [
    { name: 'Charades', type: 'score' as const, rules: 'Act out the prompts! 60 seconds per round.' },
    { name: 'Guess the Song', type: 'score' as const, rules: 'Guess the song from the clue!' },
    { name: '100m Dash', type: 'time' as const, rules: 'Fastest time wins!' },
    { name: 'Puzzle Challenge', type: 'hybrid' as const, rules: 'Complete puzzles. Points for completion, time bonus!' },
  ];

  for (const game of games) {
    const gameId = createGame(eventId, game.name, game.type, game.rules);
    console.log(`✓ Game created: ${game.name} (ID: ${gameId})`);
  }

  console.log('\n✅ Sample event initialized!');
  console.log(`\nShare this code with participants: ${eventCode}`);
  console.log(`\nYou can now:\n1. Visit http://localhost:3000\n2. Enter code: ${eventCode}\n3. Create your profile and start competing!`);
} catch (error: any) {
  console.error('Error initializing event:', error.message);
  process.exit(1);
}
