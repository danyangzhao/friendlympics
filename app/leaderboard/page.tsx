'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Decorative spring elements
const FloatingElement = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`absolute pointer-events-none select-none ${className}`}>
    {children}
  </div>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

interface TeamLeaderboardEntry {
  team: 'boys' | 'girls';
  totalPoints: number;
  gameScores: Record<number, number>;
  memberCount: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedEventId = localStorage.getItem('eventId');
    if (!storedEventId) {
      router.push('/');
      return;
    }

    loadLeaderboard(parseInt(storedEventId));
  }, [router]);

  const loadLeaderboard = async (eventId: number) => {
    try {
      const res = await fetch(`/api/leaderboard?eventId=${eventId}&type=team`);
      if (res.ok) {
        const data = await res.json();
        setTeamLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
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
  const leader = boysTeam.totalPoints > girlsTeam.totalPoints ? 'boys' : girlsTeam.totalPoints > boysTeam.totalPoints ? 'girls' : 'tie';

  return (
    <div className="min-h-screen bg-cream-100 pb-20 relative overflow-hidden">
      {/* Decorative background elements - matching sign-in page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft gradient blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-peach-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-mint-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-10 w-64 h-64 bg-butter-200/40 rounded-full blur-3xl" />
        
        {/* Floating decorative elements */}
        <FloatingElement className="top-16 left-10 text-3xl animate-float">🌸</FloatingElement>
        <FloatingElement className="top-32 right-16 text-2xl animate-float-slow">🌷</FloatingElement>
        <FloatingElement className="bottom-32 left-20 text-2xl animate-float-reverse">🌼</FloatingElement>
        <FloatingElement className="top-1/3 right-10 text-xl animate-float">☁️</FloatingElement>
        <FloatingElement className="bottom-20 right-32 text-3xl animate-float-slow">🌿</FloatingElement>
        <FloatingElement className="top-20 left-1/3 text-xl animate-float-reverse">✨</FloatingElement>
        <FloatingElement className="bottom-1/3 left-8 text-xl animate-float">🍃</FloatingElement>
      </div>

      {/* Header */}
      <div className="relative px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/dashboard" className="text-warm-500 hover:text-warm-700 transition p-2 -ml-2 rounded-xl hover:bg-cream-200">
            <ArrowLeftIcon />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <h1 className="text-2xl font-bold text-warm-700 lowercase">team leaderboard</h1>
          </div>
        </div>
        <p className="text-warm-500 text-sm ml-10">points = game wins (1 point per win, 0.5 for ties)</p>
      </div>

      <div className="px-4 space-y-6 relative">
        {/* Leader Banner */}
        {leader !== 'tie' && (
          <div className={`rounded-3xl p-5 text-center ${
            leader === 'boys' 
              ? 'bg-gradient-to-r from-sky-200 to-sky-100 border-2 border-sky-300' 
              : 'bg-gradient-to-r from-peach-200 to-peach-100 border-2 border-peach-300'
          }`}>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">{leader === 'boys' ? '💙' : '💗'}</span>
              <span className="text-warm-700 font-bold text-xl lowercase">
                team {leader} is winning!
              </span>
              <span className="text-2xl">🎉</span>
            </div>
          </div>
        )}

        {/* Team Cards */}
        <div className="space-y-4">
          {/* Team Boys */}
          <div className={`bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft-lg border-2 transition-all ${
            leader === 'boys' 
              ? 'border-sky-400 shadow-glow-sky' 
              : 'border-cream-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl">💙</div>
                <div>
                  <div className="font-bold text-warm-700 text-2xl lowercase">team boys</div>
                  <div className="text-warm-500 text-sm">{boysTeam.memberCount} friends</div>
                </div>
              </div>
              {leader === 'boys' && (
                <div className="bg-butter-200 rounded-full p-3">
                  <span className="text-2xl">🏆</span>
                </div>
              )}
            </div>
            <div className="bg-sky-50 rounded-2xl p-5 border border-sky-200">
              <div className="text-warm-500 text-xs uppercase tracking-wider mb-2">game wins</div>
              <div className="text-warm-700 font-bold text-5xl">{boysTeam.totalPoints}</div>
            </div>
          </div>

          {/* Team Girls */}
          <div className={`bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft-lg border-2 transition-all ${
            leader === 'girls' 
              ? 'border-peach-400 shadow-glow-peach' 
              : 'border-cream-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl">💗</div>
                <div>
                  <div className="font-bold text-warm-700 text-2xl lowercase">team girls</div>
                  <div className="text-warm-500 text-sm">{girlsTeam.memberCount} friends</div>
                </div>
              </div>
              {leader === 'girls' && (
                <div className="bg-butter-200 rounded-full p-3">
                  <span className="text-2xl">🏆</span>
                </div>
              )}
            </div>
            <div className="bg-peach-50 rounded-2xl p-5 border border-peach-200">
              <div className="text-warm-500 text-xs uppercase tracking-wider mb-2">game wins</div>
              <div className="text-warm-700 font-bold text-5xl">{girlsTeam.totalPoints}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft border border-cream-200">
          <h3 className="text-warm-700 font-semibold mb-4 lowercase flex items-center gap-2">
            <span>📊</span> score comparison
          </h3>
          <div className="relative h-8 bg-cream-200 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-sky-300 to-sky-400 transition-all duration-1000 ease-out flex items-center justify-end pr-3"
              style={{ width: `${boysPercent}%` }}
            >
              {boysTeam.totalPoints > 0 && (
                <span className="text-warm-700 font-bold text-sm">{boysTeam.totalPoints}</span>
              )}
            </div>
            <div 
              className="absolute right-0 top-0 h-full bg-gradient-to-l from-peach-300 to-peach-400 transition-all duration-1000 ease-out flex items-center justify-start pl-3"
              style={{ width: `${girlsPercent}%` }}
            >
              {girlsTeam.totalPoints > 0 && (
                <span className="text-warm-700 font-bold text-sm">{girlsTeam.totalPoints}</span>
              )}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex justify-between mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-sky-300 rounded-full" />
              <span className="text-warm-600 lowercase">team boys</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-warm-600 lowercase">team girls</span>
              <div className="w-4 h-4 bg-peach-300 rounded-full" />
            </div>
          </div>
        </div>

        {/* Fun message */}
        <div className="text-center py-4">
          <p className="text-warm-400 text-sm">friendship on pause. game faces on.</p>
        </div>
      </div>
    </div>
  );
}
