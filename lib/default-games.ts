import type { TeamWinRule, TimeDirection } from './scoring';

export type CanonicalGameDefinition = {
  name: string;
  type: 'score' | 'time' | 'hybrid';
  rules: string;
  team_win_rule: TeamWinRule;
  time_direction: TimeDirection;
};

/** Single source of truth for standard games; synced into SQLite per event via ensureCanonicalGamesForEvent */
export const CANONICAL_GAMES: readonly CanonicalGameDefinition[] = [
  // Interactive In-App Games (detected by keywords in name)
  {
    name: 'Charades',
    type: 'score',
    rules:
      "Act out the prompts! 60 seconds per round. Your team guesses what you're acting. You may only skip 1 time.",
    team_win_rule: 'sum_points',
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
    rules:
      'Type the shown text as fast and accurately as you can. Each run saves WPM as points and completion time; accuracy is stored in notes. Team standings use average WPM across players (higher is better).',
    team_win_rule: 'avg_points',
    time_direction: 'lower_better',
  },
  {
    name: 'Trivia Quiz',
    type: 'score',
    rules:
      'Answer trivia questions! First team to buzz in gets to answer. +1 point for correct answers.',
    team_win_rule: 'sum_points',
    time_direction: 'lower_better',
  },
  {
    name: 'Memory Match',
    type: 'hybrid',
    rules:
      'Flip cards to find matching pairs. Score based on moves and time - fewer moves = higher score!',
    team_win_rule: 'sum_points',
    time_direction: 'lower_better',
  },
  {
    name: 'Speed Drawing',
    type: 'score',
    rules:
      "Draw each word as fast as you can! The app shows 25 random words per round. Host enters team scores when you're done.",
    team_win_rule: 'sum_points',
    time_direction: 'lower_better',
  },

  // Manual Score Entry Games (host records scores after physical activity)
  {
    name: '4x400 Meter Relay',
    type: 'time',
    rules: 'Each team member runs 400m. Fastest combined team time wins!',
    team_win_rule: 'sum_time_ms',
    time_direction: 'lower_better',
  },
  {
    name: 'plank-off',
    type: 'time',
    rules:
      "Team endurance challenge! We will record every individual's time for overall hold of a plank. We will take the average score across the team. Highest average time wins!",
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
    team_win_rule: 'sum_points',
    time_direction: 'lower_better',
  },
  {
    name: 'Flip Cup Relay',
    type: 'score',
    rules:
      'Team relay - drink and flip your cup! Points = successful flips or relay wins.',
    team_win_rule: 'sum_points',
    time_direction: 'lower_better',
  },
  {
    name: 'Eggs in the Carton',
    type: 'score',
    rules:
      'Bounce ping pong balls into an egg carton! Each ball that lands in a slot scores a point. Highest score wins.',
    team_win_rule: 'sum_points',
    time_direction: 'lower_better',
  },
];
