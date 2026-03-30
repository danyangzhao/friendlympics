import db from './db';
import type { TeamWinRule, TimeDirection } from './scoring';
import { defaultsForGameType } from './scoring';
import { CANONICAL_GAMES } from './default-games';

// Event operations
export function createEvent(name: string, eventCode: string, startAt: string, endAt: string) {
  const stmt = db.prepare('INSERT INTO events (name, event_code, start_at, end_at) VALUES (?, ?, ?, ?)');
  const result = stmt.run(name, eventCode, startAt, endAt);
  return result.lastInsertRowid as number;
}

export function getEventByCode(eventCode: string) {
  const stmt = db.prepare('SELECT * FROM events WHERE event_code = ?');
  return stmt.get(eventCode) as any;
}

export function getEventById(id: number) {
  const stmt = db.prepare('SELECT * FROM events WHERE id = ?');
  return stmt.get(id) as any;
}

// User operations
export function createUser(eventId: number, name: string, nickname?: string, avatar?: string, team?: 'boys' | 'girls') {
  const stmt = db.prepare('INSERT INTO users (event_id, name, nickname, avatar, team) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(eventId, name, nickname || null, avatar || null, team || null);
  return result.lastInsertRowid as number;
}

export function getUserById(id: number) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as any;
}

export function getUsersByEvent(eventId: number) {
  const stmt = db.prepare('SELECT * FROM users WHERE event_id = ? ORDER BY created_at ASC');
  return stmt.all(eventId) as any[];
}

// Game operations
export function createGame(
  eventId: number,
  name: string,
  type: 'score' | 'time' | 'hybrid',
  rules?: string,
  teamWinRule?: TeamWinRule,
  timeDirection?: TimeDirection
) {
  const def = defaultsForGameType(type);
  const tw = teamWinRule ?? def.team_win_rule;
  const td = timeDirection ?? def.time_direction;
  const stmt = db.prepare(
    'INSERT INTO games (event_id, name, type, rules, team_win_rule, time_direction) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(eventId, name, type, rules || null, tw, td);
  return result.lastInsertRowid as number;
}

export function getGameById(id: number) {
  const stmt = db.prepare('SELECT * FROM games WHERE id = ?');
  return stmt.get(id) as any;
}

export function getGamesByEvent(eventId: number) {
  const stmt = db.prepare('SELECT * FROM games WHERE event_id = ? ORDER BY created_at ASC');
  return stmt.all(eventId) as any[];
}

export function updateGame(
  id: number,
  name: string,
  type: 'score' | 'time' | 'hybrid',
  rules: string | undefined,
  teamWinRule: TeamWinRule,
  timeDirection: TimeDirection
) {
  const stmt = db.prepare(
    'UPDATE games SET name = ?, type = ?, rules = ?, team_win_rule = ?, time_direction = ? WHERE id = ?'
  );
  stmt.run(name, type, rules || null, teamWinRule, timeDirection, id);
}

export function deleteGame(id: number) {
  const stmt = db.prepare('DELETE FROM games WHERE id = ?');
  stmt.run(id);
}

/** Inserts missing canonical games and updates type/rules/scoring for matching names. Leaves other games unchanged. */
export function ensureCanonicalGamesForEvent(eventId: number) {
  const existing = getGamesByEvent(eventId);
  for (const game of CANONICAL_GAMES) {
    const row = existing.find((g) => g.name === game.name);
    if (row) {
      updateGame(row.id, game.name, game.type, game.rules, game.team_win_rule, game.time_direction);
    } else {
      createGame(eventId, game.name, game.type, game.rules, game.team_win_rule, game.time_direction);
    }
  }
}

// Score operations
export function createScore(
  eventId: number,
  gameId: number,
  userId: number,
  points?: number,
  timeMs?: number,
  notes?: string
) {
  const stmt = db.prepare(
    'INSERT INTO scores (event_id, game_id, user_id, points, time_ms, notes) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
    eventId,
    gameId,
    userId,
    points ?? null,
    timeMs ?? null,
    notes || null
  );
  return result.lastInsertRowid as number;
}

export function getScoresByGame(gameId: number) {
  const stmt = db.prepare(`
    SELECT s.*, u.name, u.nickname, u.avatar, u.team
    FROM scores s
    JOIN users u ON s.user_id = u.id
    WHERE s.game_id = ?
    ORDER BY s.id ASC
  `);
  return stmt.all(gameId) as any[];
}

export function getScoresByEvent(eventId: number) {
  const stmt = db.prepare(`
    SELECT s.*, u.name, u.nickname, u.avatar, u.team, g.name as game_name, g.type as game_type
    FROM scores s
    JOIN users u ON s.user_id = u.id
    JOIN games g ON s.game_id = g.id
    WHERE s.event_id = ?
    ORDER BY s.created_at DESC
  `);
  return stmt.all(eventId) as any[];
}

export function updateScore(id: number, userId: number, points?: number, timeMs?: number, notes?: string) {
  const stmt = db.prepare('UPDATE scores SET user_id = ?, points = ?, time_ms = ?, notes = ? WHERE id = ?');
  stmt.run(userId, points ?? null, timeMs ?? null, notes || null, id);
}

export function deleteScore(id: number) {
  const stmt = db.prepare('DELETE FROM scores WHERE id = ?');
  stmt.run(id);
}

// Game session operations
export function createGameSession(eventId: number, gameId: number, status: 'active' | 'completed' | 'paused', data?: any) {
  const stmt = db.prepare('INSERT INTO game_sessions (event_id, game_id, status, data) VALUES (?, ?, ?, ?)');
  const result = stmt.run(eventId, gameId, status, data ? JSON.stringify(data) : null);
  return result.lastInsertRowid as number;
}

export function getActiveGameSession(eventId: number, gameId: number) {
  const stmt = db.prepare('SELECT * FROM game_sessions WHERE event_id = ? AND game_id = ? AND status = ?');
  return stmt.get(eventId, gameId, 'active') as any;
}

export function updateGameSession(id: number, status: 'active' | 'completed' | 'paused', data?: any) {
  const stmt = db.prepare('UPDATE game_sessions SET status = ?, data = ? WHERE id = ?');
  stmt.run(status, data ? JSON.stringify(data) : null, id);
}

// User operations continued
export function updateUser(id: number, name: string, nickname?: string, team?: 'boys' | 'girls') {
  const stmt = db.prepare('UPDATE users SET name = ?, nickname = ?, team = ? WHERE id = ?');
  stmt.run(name, nickname || null, team || null, id);
}

export function deleteUser(id: number) {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  stmt.run(id);
}
