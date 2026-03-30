import { createEvent, ensureCanonicalGamesForEvent } from '../lib/data';

// Initialize a sample event for testing
const eventCode = 'FRIEND2024';
const eventName = 'Friendlympics 2024';
const startAt = new Date('2024-04-01T09:00:00').toISOString();
const endAt = new Date('2024-04-02T18:00:00').toISOString();

console.log('Creating sample event...');

try {
  const eventId = createEvent(eventName, eventCode, startAt, endAt);
  console.log(`✓ Event created with ID: ${eventId}`);
  console.log(`  Event Code: ${eventCode}`);

  ensureCanonicalGamesForEvent(eventId);
  console.log('✓ Canonical games synced for this event');

  console.log('\n✅ Sample event initialized!');
  console.log(`\nShare this code with participants: ${eventCode}`);
  console.log(
    `\nYou can now:\n1. Visit http://localhost:3000\n2. Enter code: ${eventCode}\n3. Create your profile and start competing!`
  );
} catch (error: any) {
  console.error('Error initializing event:', error.message);
  process.exit(1);
}
