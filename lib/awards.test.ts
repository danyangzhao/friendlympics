import { describe, it, expect, beforeEach } from 'vitest';
import db from './db';
import { createEvent, createUser, createScore, updateEventStatus, getEventById } from './data';
import { ensureCanonicalGamesForEvent, getGamesByEvent } from './data';
import { computeAllAwards } from './awards';

function resetDb() {
  db.exec('DELETE FROM scores');
  db.exec('DELETE FROM game_sessions');
  db.exec('DELETE FROM games');
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM events');
}

describe('updateEventStatus', () => {
  beforeEach(resetDb);

  it('sets event status to completed', () => {
    const eventId = createEvent('Test', 'TEST1', new Date().toISOString(), new Date().toISOString());
    updateEventStatus(eventId, 'completed');
    const event = getEventById(eventId);
    expect(event.status).toBe('completed');
  });

  it('sets event status back to active', () => {
    const eventId = createEvent('Test', 'TEST2', new Date().toISOString(), new Date().toISOString());
    updateEventStatus(eventId, 'completed');
    updateEventStatus(eventId, 'active');
    const event = getEventById(eventId);
    expect(event.status).toBe('active');
  });
});

describe('computeAllAwards', () => {
  let eventId: number;
  let games: any[];

  beforeEach(() => {
    resetDb();
    eventId = createEvent('Awards Test', 'AWARDS1', new Date().toISOString(), new Date().toISOString());
    ensureCanonicalGamesForEvent(eventId);
    games = getGamesByEvent(eventId);
  });

  it('returns 5 awards', () => {
    const awards = computeAllAwards(eventId);
    expect(awards).toHaveLength(5);
    expect(awards.map((a) => a.id)).toEqual(['mvp', 'dominator', 'clutch', 'iron', 'brain']);
  });

  it('returns null winners when no scores exist', () => {
    const awards = computeAllAwards(eventId);
    for (const a of awards) {
      expect(a.winner).toBeNull();
    }
  });

  it('computes MVP correctly', () => {
    const alice = createUser(eventId, 'Alice', undefined, undefined, 'girls');
    const bob = createUser(eventId, 'Bob', undefined, undefined, 'boys');

    const charades = games.find((g) => g.name === 'Charades')!;
    const trivia = games.find((g) => g.name === 'Trivia Quiz')!;

    createScore(eventId, charades.id, alice, 10);
    createScore(eventId, charades.id, bob, 5);
    createScore(eventId, trivia.id, alice, 8);
    createScore(eventId, trivia.id, bob, 12);

    const awards = computeAllAwards(eventId);
    const mvp = awards.find((a) => a.id === 'mvp')!;
    // Both won 1 game each, so they tie at 0.5 each — alice sorted first alphabetically is first in leaderboard
    expect(mvp.winner).not.toBeNull();
    expect(mvp.winner!.name).toBe('Alice');
  });

  it('computes Game Dominator correctly', () => {
    const alice = createUser(eventId, 'Alice', undefined, undefined, 'girls');
    const bob = createUser(eventId, 'Bob', undefined, undefined, 'boys');

    const charades = games.find((g) => g.name === 'Charades')!;
    const trivia = games.find((g) => g.name === 'Trivia Quiz')!;
    const memory = games.find((g) => g.name === 'Memory Match')!;

    createScore(eventId, charades.id, alice, 10);
    createScore(eventId, charades.id, bob, 5);
    createScore(eventId, trivia.id, alice, 8);
    createScore(eventId, trivia.id, bob, 3);
    createScore(eventId, memory.id, alice, 900);
    createScore(eventId, memory.id, bob, 950);

    const awards = computeAllAwards(eventId);
    const dominator = awards.find((a) => a.id === 'dominator')!;
    expect(dominator.winner).not.toBeNull();
    expect(dominator.winner!.name).toBe('Alice');
    expect(dominator.stat).toBe('2 wins');
  });

  it('computes Clutch Player correctly', () => {
    const alice = createUser(eventId, 'Alice', undefined, undefined, 'girls');
    const bob = createUser(eventId, 'Bob', undefined, undefined, 'boys');

    const charades = games.find((g) => g.name === 'Charades')!;
    const trivia = games.find((g) => g.name === 'Trivia Quiz')!;

    createScore(eventId, charades.id, alice, 10);
    createScore(eventId, charades.id, bob, 9);
    createScore(eventId, trivia.id, alice, 3);
    createScore(eventId, trivia.id, bob, 10);

    const awards = computeAllAwards(eventId);
    const clutch = awards.find((a) => a.id === 'clutch')!;
    expect(clutch.winner).not.toBeNull();
    expect(clutch.winner!.name).toBe('Alice');
    expect(clutch.stat).toBe('won by 1 pts');
  });
});
