'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initDefaultEventAndStore } from '@/lib/client-event';

// Decorative spring elements
const FloatingElement = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`absolute pointer-events-none select-none ${className}`}>
    {children}
  </div>
);

// Simple icons as SVG components for a cleaner look
const TrophyIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const GameIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

interface Game {
  id: number;
  name: string;
  type: string;
}

/** Keep one Speed Drawing row (lowest id) so duplicate DB rows don’t show twice on the dashboard. */
function dedupeGamesForDashboard(games: Game[]): Game[] {
  const speedDrawing = games.filter((g) => g.name.toLowerCase().includes('speed drawing'));
  if (speedDrawing.length <= 1) return games;
  const keepId = Math.min(...speedDrawing.map((g) => g.id));
  return games.filter((g) => {
    if (!g.name.toLowerCase().includes('speed drawing')) return true;
    return g.id === keepId;
  });
}

interface TeamLeaderboardEntry {
  team: 'boys' | 'girls';
  totalPoints: number;
  gameScores: Record<number, number>;
  memberCount: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [eventId, setEventId] = useState<number | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedEventId = localStorage.getItem('eventId');
    const storedUserId = localStorage.getItem('userId');

    if (!storedEventId || !storedUserId) {
      router.push('/');
      return;
    }

    setEventId(parseInt(storedEventId));
    loadData(parseInt(storedEventId));
  }, [router]);

  const loadData = async (eId: number) => {
    try {
      let id = eId;
      let gamesRes = await fetch(`/api/games?eventId=${id}`);
      if (gamesRes.status === 404) {
        id = await initDefaultEventAndStore();
        setEventId(id);
        gamesRes = await fetch(`/api/games?eventId=${id}`);
      }

      const leaderboardRes = await fetch(`/api/leaderboard?eventId=${id}&type=team`);

      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        setGames(gamesData);
      }

      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json();
        setTeamLeaderboard(leaderboardData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-warm-500 text-xl font-medium">loading... 🌸</div>
      </div>
    );
  }

  const boysTeam = teamLeaderboard.find(t => t.team === 'boys') || { team: 'boys' as const, totalPoints: 0, gameScores: {}, memberCount: 0 };
  const girlsTeam = teamLeaderboard.find(t => t.team === 'girls') || { team: 'girls' as const, totalPoints: 0, gameScores: {}, memberCount: 0 };
  const totalPoints = boysTeam.totalPoints + girlsTeam.totalPoints;
  const boysPercent = totalPoints > 0 ? (boysTeam.totalPoints / totalPoints) * 100 : 50;
  const girlsPercent = totalPoints > 0 ? (girlsTeam.totalPoints / totalPoints) * 100 : 50;

  const gamesForDisplay = dedupeGamesForDashboard(games);

  return (
    <div className="min-h-screen bg-cream-100 pb-24 relative overflow-hidden">
      {/* Decorative background elements - matching sign-in page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft gradient blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-peach-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-mint-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-10 w-64 h-64 bg-butter-200/40 rounded-full blur-3xl" />
        
        {/* Floating decorative elements */}
        <FloatingElement className="top-32 right-16 text-2xl animate-float-slow">🌷</FloatingElement>
        <FloatingElement className="bottom-32 left-20 text-2xl animate-float-reverse">🌼</FloatingElement>
        <FloatingElement className="top-1/3 right-10 text-xl animate-float">☁️</FloatingElement>
        <FloatingElement className="bottom-20 right-32 text-3xl animate-float-slow">🌿</FloatingElement>
        <FloatingElement className="bottom-1/3 left-8 text-xl animate-float">🍃</FloatingElement>
      </div>

      {/* Header */}
      <div className="relative px-6 pt-12 pb-6">
        <h1 className="text-3xl font-bold text-warm-700 mb-1">
          2026 friendlympics
        </h1>
        <p className="text-warm-500">may the best side brag forever</p>
      </div>

      <div className="px-4 space-y-6 relative">
        {/* Team Standings Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-6 shadow-soft-lg border border-cream-200">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">🏆</span>
            <h2 className="text-xl font-bold text-warm-700 lowercase">team standings</h2>
          </div>

          {/* Team Cards - Curved Split */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Team Boys */}
            <div className="bg-gradient-to-br from-sky-100 to-sky-200 border-2 border-sky-300/50 rounded-3xl p-5 relative overflow-hidden">
              <div className="absolute top-2 right-2 text-lg opacity-40">⭐</div>
              <div className="text-3xl mb-2">💙</div>
              <div className="font-bold text-warm-700 text-lg lowercase mb-1">team boys</div>
              <div className="text-warm-500 text-sm mb-3">{boysTeam.memberCount} friends</div>
              <div className="bg-white/60 rounded-2xl p-3 text-center">
                <div className="text-warm-500 text-xs lowercase mb-1">points</div>
                <div className="text-warm-700 font-bold text-3xl">{boysTeam.totalPoints}</div>
              </div>
            </div>

            {/* Team Girls */}
            <div className="bg-gradient-to-br from-peach-100 to-peach-200 border-2 border-peach-300/50 rounded-3xl p-5 relative overflow-hidden">
              <div className="absolute top-2 right-2 text-lg opacity-40">🌸</div>
              <div className="text-3xl mb-2">💗</div>
              <div className="font-bold text-warm-700 text-lg lowercase mb-1">team girls</div>
              <div className="text-warm-500 text-sm mb-3">{girlsTeam.memberCount} friends</div>
              <div className="bg-white/60 rounded-2xl p-3 text-center">
                <div className="text-warm-500 text-xs lowercase mb-1">points</div>
                <div className="text-warm-700 font-bold text-3xl">{girlsTeam.totalPoints}</div>
              </div>
            </div>
          </div>

          {/* Progress Bar - Curved */}
          <div className="relative h-5 bg-cream-200 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-sky-300 to-sky-400 transition-all duration-1000 ease-out rounded-r-full"
              style={{ width: `${boysPercent}%` }}
            />
            <div 
              className="absolute right-0 top-0 h-full bg-gradient-to-l from-peach-300 to-peach-400 transition-all duration-1000 ease-out rounded-l-full"
              style={{ width: `${girlsPercent}%` }}
            />
            {/* Center divider blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-sm">
              ✨
            </div>
          </div>

          {totalPoints > 0 && boysTeam.totalPoints !== girlsTeam.totalPoints && (
            <div className="mt-4 text-center">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                boysTeam.totalPoints > girlsTeam.totalPoints 
                  ? 'bg-sky-100 text-warm-700' 
                  : 'bg-peach-100 text-warm-700'
              }`}>
                {boysTeam.totalPoints > girlsTeam.totalPoints ? '💙' : '💗'}
                {boysTeam.totalPoints > girlsTeam.totalPoints ? 'team boys' : 'team girls'} is ahead! 🎉
              </span>
            </div>
          )}
        </div>

        {/* Games Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-6 shadow-soft border border-cream-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🎮</span>
            <h2 className="text-xl font-bold text-warm-700 lowercase">games</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {gamesForDisplay.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-warm-400">no games yet 🌱</div>
            ) : (
              gamesForDisplay.map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="group bg-cream-50 hover:bg-butter-50 rounded-2xl p-4 border-2 border-cream-200 hover:border-butter-300 transition-all hover:-translate-y-1 hover:shadow-soft"
                >
                  <h3 className="font-semibold text-warm-700 text-sm mb-2 lowercase">{game.name}</h3>
                  <div className="flex gap-1">
                    {game.type === 'score' && <span className="text-xs bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full lowercase">points</span>}
                    {game.type === 'time' && <span className="text-xs bg-mint-100 text-mint-600 px-2 py-0.5 rounded-full lowercase">time</span>}
                    {game.type === 'hybrid' && <span className="text-xs bg-lavender-100 text-lavender-500 px-2 py-0.5 rounded-full lowercase">hybrid</span>}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/host"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-soft border border-cream-200 hover:shadow-soft-lg hover:-translate-y-1 transition-all text-center group"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-sky-100 rounded-full flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
              <UsersIcon />
            </div>
            <span className="text-warm-700 font-semibold text-sm lowercase">host view</span>
          </Link>
          <Link
            href="/leaderboard"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-soft border border-cream-200 hover:shadow-soft-lg hover:-translate-y-1 transition-all text-center group"
          >
            <div className="w-12 h-12 mx-auto mb-3 bg-butter-100 rounded-full flex items-center justify-center text-butter-500 group-hover:scale-110 transition-transform">
              <ChartIcon />
            </div>
            <span className="text-warm-700 font-semibold text-sm lowercase">full stats</span>
          </Link>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-cream-100 to-transparent pointer-events-none" />
    </div>
  );
}
