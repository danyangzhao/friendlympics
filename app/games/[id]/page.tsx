'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

interface Game {
  id: number;
  name: string;
  type: string;
  rules?: string;
}

interface Score {
  id: number;
  user_id: number;
  name: string;
  nickname?: string;
  points?: number;
  time_ms?: number;
  rank?: number;
}

export default function GameDetail() {
  const router = useRouter();
  const params = useParams();
  const gameId = parseInt(params.id as string);

  const [game, setGame] = useState<Game | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGameData();
  }, [gameId]);

  const loadGameData = async () => {
    try {
      const [gameRes, scoresRes] = await Promise.all([
        fetch(`/api/games?eventId=${localStorage.getItem('eventId')}`).then(res => res.json()),
        fetch(`/api/scores?gameId=${gameId}`).then(res => res.json()),
      ]);

      const gameData = gameRes.find((g: Game) => g.id === gameId);
      setGame(gameData || null);

      // Get game type for sorting
      if (gameData) {
        const leaderboardRes = await fetch(`/api/leaderboard?gameId=${gameId}`);
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          setScores(leaderboardData);
        } else {
          setScores(scoresRes);
        }
      } else {
        setScores(scoresRes);
      }
    } catch (error) {
      console.error('Failed to load game data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const isPlayableGame = game?.name.toLowerCase().includes('charade') || 
                         game?.name.toLowerCase().includes('song') ||
                         game?.name.toLowerCase().includes('guess') ||
                         game?.name.toLowerCase().includes('typer') ||
                         game?.name.toLowerCase().includes('typing') ||
                         game?.name.toLowerCase().includes('trivia') ||
                         game?.name.toLowerCase().includes('quiz') ||
                         game?.name.toLowerCase().includes('memory') ||
                         game?.name.toLowerCase().includes('match');

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-warm-500 text-xl font-medium">loading... 🌸</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌿</div>
          <h1 className="text-xl font-bold text-warm-700 mb-4 lowercase">game not found</h1>
          <Link href="/dashboard" className="btn-sky lowercase">
            back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 pb-20 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-lavender-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-peach-200/30 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative bg-gradient-to-br from-lavender-100 to-sky-100 px-6 pt-12 pb-8 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard" className="text-warm-500 hover:text-warm-700 transition p-2 -ml-2 rounded-xl hover:bg-white/50">
            <ArrowLeftIcon />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-warm-700 lowercase">{game.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {game.type === 'score' && <span className="text-xs bg-sky-200 text-sky-700 px-3 py-1 rounded-full lowercase">points</span>}
              {game.type === 'time' && <span className="text-xs bg-mint-200 text-mint-700 px-3 py-1 rounded-full lowercase">time</span>}
              {game.type === 'hybrid' && <span className="text-xs bg-lavender-200 text-lavender-600 px-3 py-1 rounded-full lowercase">points + time</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6 relative">
        {/* Play Button */}
        {isPlayableGame && (
          <Link
            href={`/games/${gameId}/play`}
            className="block bg-gradient-to-br from-butter-200 to-peach-200 border-2 border-butter-300 rounded-3xl p-6 shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-1 transition-all text-center"
          >
            <div className="text-butter-600 mx-auto mb-2">
              <PlayIcon />
            </div>
            <h2 className="text-xl font-bold text-warm-700 mb-1 lowercase">play now</h2>
            <p className="text-warm-500 text-sm">start playing in the app ✨</p>
          </Link>
        )}

        {/* Rules */}
        {game.rules && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft border border-cream-200">
            <h2 className="text-lg font-bold text-warm-700 mb-3 lowercase flex items-center gap-2">
              <span>📋</span> rules
            </h2>
            <p className="text-warm-600 whitespace-pre-wrap leading-relaxed">{game.rules}</p>
          </div>
        )}

        {/* Scores */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft border border-cream-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🏆</span>
            <h2 className="text-lg font-bold text-warm-700 lowercase">scores</h2>
          </div>
          {scores.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🌱</div>
              <p className="text-warm-400">no scores yet. be the first!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((score, index) => (
                <div
                  key={score.id}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                    index === 0 
                      ? 'bg-butter-100 border-2 border-butter-300' 
                      : index === 1 
                      ? 'bg-cream-100 border-2 border-cream-300'
                      : index === 2
                      ? 'bg-peach-50 border-2 border-peach-200'
                      : 'bg-cream-50 border border-cream-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg w-8 text-center">
                      {getMedalEmoji(index)}
                    </span>
                    <span className="font-semibold text-warm-700">{score.nickname || score.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {game.type !== 'time' && score.points !== null && (
                      <div className="flex items-center gap-1 text-sky-600">
                        <StarIcon />
                        <span className="font-bold">{score.points}</span>
                      </div>
                    )}
                    {(game.type === 'time' || game.type === 'hybrid') && score.time_ms && (
                      <div className="flex items-center gap-1 text-mint-600">
                        <ClockIcon />
                        <span className="font-bold">{formatTime(score.time_ms)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
