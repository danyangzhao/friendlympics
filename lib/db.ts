import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Vercel serverless (and similar) only allow writes under /tmp; creating ./data throws EROFS → 500 on every API route.
const isServerlessDeploy = Boolean(process.env.VERCEL);
const dbDir = process.env.DATA_DIR
  ? process.env.DATA_DIR
  : isServerlessDeploy
    ? '/tmp'
    : join(process.cwd(), 'data');
if (!isServerlessDeploy && !existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const dbPath = join(dbDir, 'friendlympics.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    event_code TEXT UNIQUE NOT NULL,
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    team TEXT CHECK(team IN ('boys', 'girls')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('score', 'time', 'hybrid')),
    rules TEXT,
    team_win_rule TEXT NOT NULL DEFAULT 'avg_points' CHECK(team_win_rule IN ('avg_points', 'sum_points', 'avg_time_ms', 'sum_time_ms')),
    time_direction TEXT NOT NULL DEFAULT 'lower_better' CHECK(time_direction IN ('lower_better', 'higher_better')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    points REAL DEFAULT 0,
    time_ms INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'paused')),
    data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_scores_event_game ON scores(event_id, game_id);
  CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);
  CREATE INDEX IF NOT EXISTS idx_users_event ON users(event_id);
`);

// Migration: Add team column if it doesn't exist
try {
  db.prepare('SELECT team FROM users LIMIT 1').get();
} catch (e) {
  // Column doesn't exist, add it
  db.exec('ALTER TABLE users ADD COLUMN team TEXT CHECK(team IN (\'boys\', \'girls\'))');
}

// Migration: games.team_win_rule
try {
  db.prepare('SELECT team_win_rule FROM games LIMIT 1').get();
} catch {
  db.exec(
    "ALTER TABLE games ADD COLUMN team_win_rule TEXT NOT NULL DEFAULT 'avg_points' CHECK(team_win_rule IN ('avg_points', 'sum_points', 'avg_time_ms', 'sum_time_ms'))"
  );
}

// Migration: games.time_direction
try {
  db.prepare('SELECT time_direction FROM games LIMIT 1').get();
} catch {
  db.exec(
    "ALTER TABLE games ADD COLUMN time_direction TEXT NOT NULL DEFAULT 'lower_better' CHECK(time_direction IN ('lower_better', 'higher_better'))"
  );
}

// Migration: events.status
try {
  db.prepare('SELECT status FROM events LIMIT 1').get();
} catch {
  db.exec(
    "ALTER TABLE events ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed'))"
  );
}

export default db;
