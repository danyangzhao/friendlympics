'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface Game {
  id: number;
  name: string;
  type: string;
}

interface Song {
  title: string;
  artist: string;
  clue: string;
}

interface User {
  id: number;
  name: string;
  nickname?: string;
  team?: 'boys' | 'girls';
}

export default function PlayGame() {
  const router = useRouter();
  const params = useParams();
  const gameId = parseInt(params.id as string);

  const [game, setGame] = useState<Game | null>(null);
  const [eventId, setEventId] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [gameType, setGameType] = useState<'charades' | 'song' | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [manualScore, setManualScore] = useState({
    team: '' as '' | 'boys' | 'girls',
    points: '',
    timeSeconds: '',
    notes: '',
  });
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [usedPrompts, setUsedPrompts] = useState<Set<number>>(new Set());
  const [usedSongs, setUsedSongs] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadGame();
    loadPrompts();
  }, [gameId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const loadGame = async () => {
    try {
      const storedEventId = localStorage.getItem('eventId');
      if (!storedEventId) {
        router.push('/');
        return;
      }

      const parsedEventId = parseInt(storedEventId);
      setEventId(parsedEventId);
      const res = await fetch(`/api/games?eventId=${parsedEventId}`);
      const games = await res.json();
      const gameData = games.find((g: Game) => g.id === gameId);
      
      if (gameData) {
        setGame(gameData);
        const name = gameData.name.toLowerCase();
        if (name.includes('charade')) {
          setGameType('charades');
        } else if (name.includes('song') || name.includes('guess')) {
          setGameType('song');
        }
      }

      await loadUsers(parsedEventId);
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  };

  const loadUsers = async (eId: number) => {
    try {
      const res = await fetch(`/api/users?eventId=${eId}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadPrompts = async () => {
    try {
      const res = await fetch('/api/prompts');
      const data = await res.json();
      setPrompts(data.charades || []);
      setSongs(data.songs || []);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  };

  const getRandomPrompt = () => {
    if (gameType === 'charades' && prompts.length > 0) {
      let available = prompts.map((_, i) => i).filter(i => !usedPrompts.has(i));
      if (available.length === 0) {
        available = prompts.map((_, i) => i);
        setUsedPrompts(new Set());
      }
      const index = available[Math.floor(Math.random() * available.length)];
      setUsedPrompts(new Set([...usedPrompts, index]));
      return prompts[index];
    } else if (gameType === 'song' && songs.length > 0) {
      let available = songs.map((_, i) => i).filter(i => !usedSongs.has(i));
      if (available.length === 0) {
        available = songs.map((_, i) => i);
        setUsedSongs(new Set());
      }
      const index = available[Math.floor(Math.random() * available.length)];
      setUsedSongs(new Set([...usedSongs, index]));
      return songs[index];
    }
    return null;
  };

  const startGame = () => {
    setIsRunning(true);
    setTimeLeft(60);
    setScore({ correct: 0, incorrect: 0 });
    nextPrompt();
  };

  const nextPrompt = () => {
    if (gameType === 'charades') {
      const prompt = getRandomPrompt();
      if (prompt) setCurrentPrompt(prompt as string);
    } else if (gameType === 'song') {
      const song = getRandomPrompt();
      if (song) setCurrentSong(song as Song);
    }
  };

  const handleCorrect = () => {
    setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    nextPrompt();
  };

  const handleIncorrect = () => {
    setScore((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
    nextPrompt();
  };

  const handleManualScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !game || !manualScore.team) return;

    const teamUser = users.find(user => user.team === manualScore.team);
    if (!teamUser) return;

    setIsSavingScore(true);
    try {
      const points = manualScore.points ? parseFloat(manualScore.points) : null;
      const timeSeconds = manualScore.timeSeconds ? parseFloat(manualScore.timeSeconds) : null;
      const timeMs = timeSeconds !== null ? Math.max(0, timeSeconds) * 1000 : null;

      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          gameId: game.id,
          userId: teamUser.id,
          points,
          timeMs,
          notes: manualScore.notes || null,
        }),
      });

      if (res.ok) {
        setManualScore((prev) => ({
          ...prev,
          points: '',
          timeSeconds: '',
          notes: '',
        }));
      }
    } catch (error) {
      console.error('Failed to save score:', error);
    } finally {
      setIsSavingScore(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!game || !gameType) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌿</div>
          <h1 className="text-xl font-bold text-warm-700 mb-4 lowercase">game not found or not playable</h1>
          <Link href="/dashboard" className="btn-sky lowercase">
            back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-butter-100 via-peach-50 to-lavender-100 pb-20 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-peach-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-mint-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-lavender-200/40 rounded-full blur-3xl" />
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 text-2xl animate-float">🌸</div>
        <div className="absolute top-32 right-20 text-xl animate-float-slow">✨</div>
        <div className="absolute bottom-40 left-20 text-2xl animate-float-reverse">🌷</div>
      </div>

      {/* Header */}
      <div className="relative bg-white/60 backdrop-blur-sm px-6 pt-12 pb-6">
        <div className="flex items-center gap-4">
          <Link href={`/games/${gameId}`} className="text-warm-500 hover:text-warm-700 transition p-2 -ml-2 rounded-xl hover:bg-white/50">
            <ArrowLeftIcon />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-warm-700 lowercase">{game.name}</h1>
            <p className="text-warm-500 text-sm">let's play! 🎮</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6 relative">
        {/* Ready to Play */}
        {!isRunning && timeLeft === 60 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-8 text-center border border-cream-200">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-warm-700 mb-4 lowercase">ready to play?</h2>
            <p className="text-warm-500 mb-6">
              {gameType === 'charades'
                ? 'act out the prompts! you have 60 seconds ⏱️'
                : 'guess the song from the clue! you have 60 seconds ⏱️'}
            </p>
            <button
              onClick={startGame}
              className="btn-butter text-xl px-10 py-4 lowercase"
            >
              start game 🚀
            </button>
          </div>
        )}

        {/* Game Running */}
        {isRunning && (
          <>
            {/* Timer & Score */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 text-center border border-cream-200">
              <div className={`text-6xl font-bold mb-4 ${timeLeft <= 10 ? 'text-peach-500 animate-pulse' : 'text-lavender-500'}`}>
                {formatTime(timeLeft)}
              </div>
              <div className="flex justify-center gap-8 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-mint-500">{score.correct}</div>
                  <div className="text-sm text-warm-400 lowercase">correct ✅</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-peach-400">{score.incorrect}</div>
                  <div className="text-sm text-warm-400 lowercase">skipped</div>
                </div>
              </div>
            </div>

            {/* Charades Prompt */}
            {gameType === 'charades' && currentPrompt && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft-xl p-10 text-center border-2 border-butter-200">
                <div className="text-4xl font-bold text-warm-700 mb-6">{currentPrompt}</div>
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={handleCorrect}
                    className="btn-mint text-lg flex items-center gap-2 px-8 py-4"
                  >
                    <CheckIcon />
                    correct!
                  </button>
                  <button
                    onClick={handleIncorrect}
                    className="btn-peach text-lg flex items-center gap-2 px-8 py-4"
                  >
                    <XIcon />
                    skip
                  </button>
                </div>
                <button
                  onClick={nextPrompt}
                  className="mt-4 text-lavender-500 hover:text-lavender-600 flex items-center gap-2 mx-auto lowercase font-medium"
                >
                  <RefreshIcon />
                  new prompt
                </button>
              </div>
            )}

            {/* Song Guessing */}
            {gameType === 'song' && currentSong && (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft-xl p-8 text-center border-2 border-sky-200">
                <div className="text-warm-500 mb-4 text-lg">{currentSong.clue}</div>
                <div className="text-2xl font-bold text-warm-700 mb-2">
                  {currentSong.title}
                </div>
                <div className="text-warm-500 mb-6">by {currentSong.artist}</div>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleCorrect}
                    className="btn-mint text-lg flex items-center gap-2 px-8 py-4"
                  >
                    <CheckIcon />
                    correct!
                  </button>
                  <button
                    onClick={handleIncorrect}
                    className="btn-peach text-lg flex items-center gap-2 px-8 py-4"
                  >
                    <XIcon />
                    skip
                  </button>
                </div>
                <button
                  onClick={nextPrompt}
                  className="mt-4 text-lavender-500 hover:text-lavender-600 flex items-center gap-2 mx-auto lowercase font-medium"
                >
                  <RefreshIcon />
                  new song
                </button>
              </div>
            )}
          </>
        )}

        {/* Game Over */}
        {!isRunning && timeLeft === 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-xl p-8 text-center border border-cream-200">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-warm-700 mb-4 lowercase">time's up!</h2>
            <div className="text-5xl font-bold text-lavender-500 mb-4">
              {score.correct} / {score.correct + score.incorrect}
            </div>
            <p className="text-warm-500 mb-6">
              you got {score.correct} correct out of {score.correct + score.incorrect} total! 
              {score.correct > 5 ? ' amazing! 🌟' : score.correct > 2 ? ' great job! 💪' : ' nice try! 🌱'}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={startGame}
                className="btn-butter lowercase"
              >
                play again 🔄
              </button>
              <Link
                href={`/games/${gameId}`}
                className="btn-spring bg-cream-200 text-warm-600 lowercase"
              >
                back to game
              </Link>
            </div>
          </div>
        )}

        {/* Manual Score Entry */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft p-6 border border-cream-200">
          <h2 className="text-lg font-bold text-warm-700 mb-4 lowercase flex items-center gap-2">
            <span>📝</span> manual score entry
          </h2>
          <form onSubmit={handleManualScoreSubmit} className="space-y-3">
            <select
              value={manualScore.team}
              onChange={(e) => setManualScore({ ...manualScore, team: e.target.value as 'boys' | 'girls' | '' })}
              className="input-spring text-sm"
              required
            >
              <option value="">select team...</option>
              <option value="boys">team boys 💙</option>
              <option value="girls">team girls 💗</option>
            </select>

            {manualScore.team && !users.find(user => user.team === manualScore.team) && (
              <p className="text-sm text-peach-600">
                no players found for this team. add a player to record scores.
              </p>
            )}

            {game.type !== 'time' && (
              <input
                type="number"
                placeholder="points"
                value={manualScore.points}
                onChange={(e) => setManualScore({ ...manualScore, points: e.target.value })}
                className="input-spring text-sm"
                step="0.1"
              />
            )}

            {game.type !== 'score' && (
              <input
                type="number"
                placeholder="time (seconds)"
                value={manualScore.timeSeconds}
                onChange={(e) => setManualScore({ ...manualScore, timeSeconds: e.target.value })}
                className="input-spring text-sm"
              />
            )}

            <textarea
              placeholder="notes (optional)"
              value={manualScore.notes}
              onChange={(e) => setManualScore({ ...manualScore, notes: e.target.value })}
              className="input-spring text-sm"
              rows={2}
            />

            <button
              type="submit"
              className="w-full btn-lavender lowercase disabled:opacity-50"
              disabled={isSavingScore || !manualScore.team || !users.find(user => user.team === manualScore.team)}
            >
              {isSavingScore ? 'saving...' : 'save score ✨'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
