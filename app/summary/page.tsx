'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

interface TimelinePoint {
  gameId: number;
  gameName: string;
  boys: number;
  girls: number;
}

interface TeamLeaderboardEntry {
  team: 'boys' | 'girls';
  totalPoints: number;
  gameScores: Record<number, number>;
  memberCount: number;
}

interface AwardWinner {
  userId: number;
  name: string;
  nickname?: string;
  avatar?: string;
  team?: string;
}

interface Award {
  id: string;
  name: string;
  emoji: string;
  description: string;
  winner: AwardWinner | null;
  stat: string;
}

interface SummaryData {
  teamLeaderboard: TeamLeaderboardEntry[];
  timeline: TimelinePoint[];
  awards: Award[];
}

// ── Animated Line Chart ──────────────────────────────────────────

function ScoreRaceChart({ timeline }: { timeline: TimelinePoint[] }) {
  const [animatedIndex, setAnimatedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timeline.length === 0) return;
    const delay = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setAnimatedIndex(i);
        i++;
        if (i >= timeline.length) clearInterval(interval);
      }, 600);
      return () => clearInterval(interval);
    }, 400);
    return () => clearTimeout(delay);
  }, [timeline.length]);

  if (timeline.length === 0) {
    return (
      <div className="text-center py-8 text-warm-400">no completed games yet</div>
    );
  }

  const maxScore = Math.max(
    ...timeline.map((p) => Math.max(p.boys, p.girls)),
    1
  );

  const padding = { top: 24, right: 20, bottom: 56, left: 36 };
  const chartWidth = Math.max(timeline.length * 72, 300);
  const chartHeight = 200;
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;

  const xStep = timeline.length > 1 ? plotW / (timeline.length - 1) : plotW / 2;

  function toX(i: number) {
    return padding.left + (timeline.length > 1 ? i * xStep : plotW / 2);
  }
  function toY(val: number) {
    return padding.top + plotH - (val / maxScore) * plotH;
  }

  function buildPath(team: 'boys' | 'girls') {
    return timeline
      .map((p, i) => {
        const x = toX(i);
        const y = toY(team === 'boys' ? p.boys : p.girls);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }

  const boysPath = buildPath('boys');
  const girlsPath = buildPath('girls');

  const yTicks: number[] = [];
  for (let v = 0; v <= maxScore; v++) {
    yTicks.push(v);
  }

  return (
    <div ref={containerRef} className="overflow-x-auto -mx-2 px-2">
      <svg
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="block"
      >
        {/* Y-axis grid lines */}
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={padding.left}
              y1={toY(v)}
              x2={chartWidth - padding.right}
              y2={toY(v)}
              stroke="#e6e5e0"
              strokeWidth={1}
              strokeDasharray={v === 0 ? undefined : '4 4'}
            />
            <text
              x={padding.left - 8}
              y={toY(v) + 4}
              textAnchor="end"
              className="fill-warm-400 text-[10px]"
            >
              {v}
            </text>
          </g>
        ))}

        {/* X-axis game labels */}
        {timeline.map((p, i) => {
          const x = toX(i);
          const label = p.gameName.length > 10
            ? p.gameName.slice(0, 9) + '…'
            : p.gameName;
          return (
            <text
              key={p.gameId}
              x={x}
              y={chartHeight - 8}
              textAnchor="middle"
              className={`fill-warm-400 text-[9px] transition-opacity duration-500 ${
                i <= animatedIndex ? 'opacity-100' : 'opacity-0'
              }`}
              transform={`rotate(-20, ${x}, ${chartHeight - 8})`}
            >
              {label}
            </text>
          );
        })}

        {/* Boys line */}
        <path
          d={boysPath}
          fill="none"
          stroke="#7dd3fc"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${plotW * 4}`}
          strokeDashoffset={
            animatedIndex < 0
              ? plotW * 4
              : plotW * 4 - ((animatedIndex + 1) / timeline.length) * plotW * 4
          }
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />

        {/* Girls line */}
        <path
          d={girlsPath}
          fill="none"
          stroke="#fdba74"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${plotW * 4}`}
          strokeDashoffset={
            animatedIndex < 0
              ? plotW * 4
              : plotW * 4 - ((animatedIndex + 1) / timeline.length) * plotW * 4
          }
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />

        {/* Dots & score labels */}
        {timeline.map((p, i) => {
          if (i > animatedIndex) return null;
          const bx = toX(i);
          const by = toY(p.boys);
          const gx = toX(i);
          const gy = toY(p.girls);
          return (
            <g key={p.gameId}>
              {/* Boys dot */}
              <circle
                cx={bx}
                cy={by}
                r={5}
                fill="#7dd3fc"
                stroke="white"
                strokeWidth={2}
                className="animate-[pop_0.3s_ease-out]"
              />
              <text
                x={bx}
                y={by - 10}
                textAnchor="middle"
                className="fill-sky-500 text-[10px] font-bold"
              >
                {p.boys}
              </text>
              {/* Girls dot */}
              <circle
                cx={gx}
                cy={gy}
                r={5}
                fill="#fdba74"
                stroke="white"
                strokeWidth={2}
                className="animate-[pop_0.3s_ease-out]"
              />
              <text
                x={gx}
                y={gy > by ? gy + 16 : gy - 10}
                textAnchor="middle"
                className="fill-orange-400 text-[10px] font-bold"
              >
                {p.girls}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-300" />
          <span className="text-warm-500 lowercase">team boys</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-300" />
          <span className="text-warm-500 lowercase">team girls</span>
        </div>
      </div>
    </div>
  );
}

// ── Award Card ───────────────────────────────────────────────────

function AwardCard({ award }: { award: Award }) {
  if (!award.winner) return null;

  const teamColor =
    award.winner.team === 'boys'
      ? 'border-sky-300 bg-sky-50'
      : award.winner.team === 'girls'
        ? 'border-peach-300 bg-peach-50'
        : 'border-cream-300 bg-cream-50';

  return (
    <div
      className={`rounded-2xl border-2 p-4 ${teamColor} transition-all hover:-translate-y-0.5 hover:shadow-soft`}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{award.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-warm-700 lowercase">{award.name}</div>
          <div className="text-warm-500 text-xs lowercase">{award.description}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between bg-white/60 rounded-xl px-3 py-2">
        <span className="font-semibold text-warm-700 truncate">
          {award.winner.nickname || award.winner.name}
        </span>
        <span className="text-warm-500 text-sm font-medium whitespace-nowrap ml-2">
          {award.stat}
        </span>
      </div>
    </div>
  );
}

// ── Main Summary Page ────────────────────────────────────────────

export default function SummaryPage() {
  const router = useRouter();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedEventId = localStorage.getItem('eventId');
    if (!storedEventId) {
      router.push('/');
      return;
    }
    loadSummary(parseInt(storedEventId));
  }, [router]);

  const loadSummary = async (eventId: number) => {
    try {
      const res = await fetch(`/api/summary?eventId=${eventId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-warm-500 text-xl font-medium">loading summary... 🎉</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-warm-500 text-xl font-medium">could not load summary</div>
      </div>
    );
  }

  const boysTeam = data.teamLeaderboard.find((t) => t.team === 'boys') || {
    team: 'boys' as const,
    totalPoints: 0,
    gameScores: {},
    memberCount: 0,
  };
  const girlsTeam = data.teamLeaderboard.find((t) => t.team === 'girls') || {
    team: 'girls' as const,
    totalPoints: 0,
    gameScores: {},
    memberCount: 0,
  };

  const winner =
    boysTeam.totalPoints > girlsTeam.totalPoints
      ? 'boys'
      : girlsTeam.totalPoints > boysTeam.totalPoints
        ? 'girls'
        : 'tie';

  const awardsWithWinners = data.awards.filter((a) => a.winner !== null);

  return (
    <div className="min-h-screen bg-cream-100 pb-24 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-peach-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-mint-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-10 w-64 h-64 bg-butter-200/40 rounded-full blur-3xl" />

        <FloatingElement className="top-16 left-10 text-3xl animate-float">🏆</FloatingElement>
        <FloatingElement className="top-32 right-16 text-2xl animate-float-slow">🎊</FloatingElement>
        <FloatingElement className="bottom-32 left-20 text-2xl animate-float-reverse">⭐</FloatingElement>
        <FloatingElement className="top-1/3 right-10 text-xl animate-float">🥇</FloatingElement>
        <FloatingElement className="bottom-20 right-32 text-3xl animate-float-slow">🎉</FloatingElement>
        <FloatingElement className="bottom-1/3 left-8 text-xl animate-float">✨</FloatingElement>
      </div>

      {/* Header */}
      <div className="relative px-6 pt-12 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/dashboard"
            className="text-warm-500 hover:text-warm-700 transition p-2 -ml-2 rounded-xl hover:bg-cream-200"
          >
            <ArrowLeftIcon />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h1 className="text-2xl font-bold text-warm-700 lowercase">event summary</h1>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 relative">
        {/* ── Winner Banner ── */}
        <div
          className={`rounded-3xl p-6 text-center border-2 ${
            winner === 'boys'
              ? 'bg-gradient-to-r from-sky-200 to-sky-100 border-sky-300'
              : winner === 'girls'
                ? 'bg-gradient-to-r from-peach-200 to-peach-100 border-peach-300'
                : 'bg-gradient-to-r from-butter-200 to-butter-100 border-butter-300'
          }`}
        >
          <div className="text-4xl mb-2">
            {winner === 'tie' ? '🤝' : '🏆'}
          </div>
          <h2 className="text-2xl font-bold text-warm-700 lowercase mb-1">
            {winner === 'tie'
              ? "it's a tie!"
              : `team ${winner} wins!`}
          </h2>
          <div className="text-warm-600 text-lg font-semibold">
            <span className={winner === 'boys' ? 'text-sky-600' : 'text-warm-500'}>
              💙 {boysTeam.totalPoints}
            </span>
            <span className="mx-3 text-warm-400">—</span>
            <span className={winner === 'girls' ? 'text-orange-500' : 'text-warm-500'}>
              {girlsTeam.totalPoints} 💗
            </span>
          </div>
        </div>

        {/* ── Score Race Chart ── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft-lg border border-cream-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📈</span>
            <h2 className="text-xl font-bold text-warm-700 lowercase">the score race</h2>
          </div>
          <ScoreRaceChart timeline={data.timeline} />
        </div>

        {/* ── Individual Awards ── */}
        {awardsWithWinners.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft border border-cream-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🏅</span>
              <h2 className="text-xl font-bold text-warm-700 lowercase">individual awards</h2>
            </div>
            <div className="space-y-3">
              {awardsWithWinners.map((award) => (
                <AwardCard key={award.id} award={award} />
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="text-center py-6">
          <p className="text-warm-400 text-sm mb-4">
            gg everyone. friendship restored. 💛
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cream-200 text-warm-600 font-medium hover:bg-cream-300 transition-all"
          >
            <ArrowLeftIcon />
            back to dashboard
          </Link>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-cream-100 to-transparent pointer-events-none" />
    </div>
  );
}
