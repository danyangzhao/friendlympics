import { calculateLeaderboard, getGameLeaderboard } from './leaderboard';
import { getGamesByEvent } from './data';
import { resolveTimeDirection } from './scoring';

export interface AwardWinner {
  userId: number;
  name: string;
  nickname?: string;
  avatar?: string;
  team?: string;
}

export interface Award {
  id: string;
  name: string;
  emoji: string;
  description: string;
  winner: AwardWinner | null;
  stat: string;
}

const PHYSICAL_KEYWORDS = ['relay', 'plank', 'wall sit', 'puzzle', 'beer pong', 'flip cup'];
const MENTAL_KEYWORDS = ['charades', 'song', 'trivia', 'memory', 'typer', 'drawing'];

function isPhysicalGame(name: string): boolean {
  const lower = name.toLowerCase();
  return PHYSICAL_KEYWORDS.some((kw) => lower.includes(kw));
}

function isMentalGame(name: string): boolean {
  const lower = name.toLowerCase();
  return MENTAL_KEYWORDS.some((kw) => lower.includes(kw));
}

function computeMVP(eventId: number): Award {
  const leaderboard = calculateLeaderboard(eventId);
  const top = leaderboard[0] ?? null;

  return {
    id: 'mvp',
    name: 'MVP',
    emoji: '👑',
    description: 'Most championship points across all games',
    winner: top
      ? { userId: top.userId, name: top.name, nickname: top.nickname, avatar: top.avatar }
      : null,
    stat: top ? `${top.totalPoints.toFixed(1)} pts` : '',
  };
}

function computeGameDominator(eventId: number): Award {
  const leaderboard = calculateLeaderboard(eventId);

  let bestUser: (typeof leaderboard)[0] | null = null;
  let bestWins = 0;

  for (const entry of leaderboard) {
    const wins = Object.values(entry.gameScores).filter((gs) => gs.rank === 1).length;
    if (wins > bestWins) {
      bestWins = wins;
      bestUser = entry;
    }
  }

  return {
    id: 'dominator',
    name: 'Game Dominator',
    emoji: '🔥',
    description: 'Most first-place finishes',
    winner: bestUser
      ? { userId: bestUser.userId, name: bestUser.name, nickname: bestUser.nickname, avatar: bestUser.avatar }
      : null,
    stat: bestUser ? `${bestWins} win${bestWins !== 1 ? 's' : ''}` : '',
  };
}

function computeClutchPlayer(eventId: number): Award {
  const games = getGamesByEvent(eventId);

  let clutchUser: AwardWinner | null = null;
  let smallestMargin = Infinity;
  let marginLabel = '';

  for (const game of games) {
    const lb = getGameLeaderboard(game.id);
    if (lb.length < 2) continue;

    const first = lb[0];
    const second = lb[1];
    const timeDir = resolveTimeDirection(game);

    let margin: number;
    let label: string;

    if (game.type === 'score' || game.type === 'hybrid') {
      margin = Math.abs((first.points ?? 0) - (second.points ?? 0));
      label = `won by ${margin % 1 === 0 ? margin : margin.toFixed(1)} pts`;
    } else {
      const t1 = first.time_ms ?? 0;
      const t2 = second.time_ms ?? 0;
      margin = Math.abs(t1 - t2);
      if (margin >= 1000) {
        label = `won by ${(margin / 1000).toFixed(1)}s`;
      } else {
        label = `won by ${margin}ms`;
      }
    }

    if (margin > 0 && margin < smallestMargin) {
      smallestMargin = margin;
      marginLabel = label;
      clutchUser = {
        userId: first.user_id,
        name: first.name,
        nickname: first.nickname,
        avatar: first.avatar,
        team: first.team,
      };
    }
  }

  return {
    id: 'clutch',
    name: 'Clutch Player',
    emoji: '🎯',
    description: 'Won a game by the thinnest margin',
    winner: clutchUser,
    stat: marginLabel,
  };
}

function computeCategoryAward(
  eventId: number,
  filterFn: (name: string) => boolean,
  awardMeta: { id: string; name: string; emoji: string; description: string }
): Award {
  const leaderboard = calculateLeaderboard(eventId);
  const games = getGamesByEvent(eventId);
  const categoryGameIds = games.filter((g) => filterFn(g.name)).map((g) => g.id);

  if (categoryGameIds.length === 0) {
    return { ...awardMeta, winner: null, stat: '' };
  }

  let bestUser: (typeof leaderboard)[0] | null = null;
  let bestAvgRank = Infinity;

  for (const entry of leaderboard) {
    const ranks: number[] = [];
    for (const gid of categoryGameIds) {
      const gs = entry.gameScores[gid];
      if (gs) ranks.push(gs.rank);
    }
    if (ranks.length < 2) continue;

    const avg = ranks.reduce((a, b) => a + b, 0) / ranks.length;
    if (avg < bestAvgRank) {
      bestAvgRank = avg;
      bestUser = entry;
    }
  }

  return {
    ...awardMeta,
    winner: bestUser
      ? { userId: bestUser.userId, name: bestUser.name, nickname: bestUser.nickname, avatar: bestUser.avatar }
      : null,
    stat: bestUser ? `avg rank ${bestAvgRank % 1 === 0 ? bestAvgRank : bestAvgRank.toFixed(1)}` : '',
  };
}

export function computeAllAwards(eventId: number): Award[] {
  const mvp = computeMVP(eventId);
  const dominator = computeGameDominator(eventId);
  const clutch = computeClutchPlayer(eventId);

  const ironWill = computeCategoryAward(eventId, isPhysicalGame, {
    id: 'iron',
    name: 'Iron Will',
    emoji: '💪',
    description: 'Best average rank in physical games',
  });

  const brainPower = computeCategoryAward(eventId, isMentalGame, {
    id: 'brain',
    name: 'Brain Power',
    emoji: '🧠',
    description: 'Best average rank in mental games',
  });

  return [mvp, dominator, clutch, ironWill, brainPower];
}
