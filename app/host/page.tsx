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

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

interface Game {
  id: number;
  name: string;
  type: string;
  rules?: string;
}

interface User {
  id: number;
  name: string;
  nickname?: string;
  team?: 'boys' | 'girls';
}

interface Score {
  id: number;
  game_id: number;
  user_id: number;
  name: string;
  nickname?: string;
  team?: 'boys' | 'girls';
  points?: number;
  time_ms?: number;
  notes?: string;
}

export default function HostPage() {
  const router = useRouter();
  const [eventId, setEventId] = useState<number | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [gameScores, setGameScores] = useState<Score[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddGame, setShowAddGame] = useState(false);
  const [showAddScore, setShowAddScore] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingScoreId, setEditingScoreId] = useState<number | null>(null);

  const [newGame, setNewGame] = useState({ name: '', type: 'score' as 'score' | 'time' | 'hybrid', rules: '' });
  const [newScore, setNewScore] = useState({
    userId: '' as string,
    points: '',
    timeMs: '',
    notes: '',
  });
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    nickname: '',
    team: '' as '' | 'boys' | 'girls',
  });
  const [gameDraft, setGameDraft] = useState({
    name: '',
    type: 'score' as 'score' | 'time' | 'hybrid',
    rules: '',
  });
  const [userDraft, setUserDraft] = useState({
    name: '',
    nickname: '',
    team: '' as '' | 'boys' | 'girls',
  });
  const [scoreDraft, setScoreDraft] = useState({
    userId: '' as string,
    points: '',
    timeSeconds: '',
    notes: '',
  });

  useEffect(() => {
    const storedEventId = localStorage.getItem('eventId');
    if (!storedEventId) {
      router.push('/');
      return;
    }

    const eId = parseInt(storedEventId);
    setEventId(eId);
    loadData(eId);
  }, [router]);

  useEffect(() => {
    if (selectedGame) {
      loadScoresForGame(selectedGame);
    } else {
      setGameScores([]);
    }
  }, [selectedGame]);

  const loadData = async (eId: number) => {
    try {
      const [gamesRes, usersRes] = await Promise.all([
        fetch(`/api/games?eventId=${eId}`),
        fetch(`/api/users?eventId=${eId}`),
      ]);

      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        setGames(gamesData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScoresForGame = async (gameId: number) => {
    setScoresLoading(true);
    try {
      const res = await fetch(`/api/scores?gameId=${gameId}`);
      if (res.ok) {
        const data = await res.json();
        setGameScores(data);
      }
    } catch (error) {
      console.error('Failed to load scores:', error);
    } finally {
      setScoresLoading(false);
    }
  };

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          name: newGame.name,
          type: newGame.type,
          rules: newGame.rules || null,
        }),
      });

      if (res.ok) {
        await loadData(eventId);
        setNewGame({ name: '', type: 'score', rules: '' });
        setShowAddGame(false);
      }
    } catch (error) {
      console.error('Failed to add game:', error);
    }
  };

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !selectedGame || !newScore.userId) return;

    const userIdNum = parseInt(newScore.userId, 10);
    if (isNaN(userIdNum)) return;

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          gameId: selectedGame,
          userId: userIdNum,
          points: newScore.points ? parseFloat(newScore.points) : null,
          timeMs: newScore.timeMs ? parseInt(newScore.timeMs) * 1000 : null,
          notes: newScore.notes || null,
        }),
      });

      if (res.ok) {
        setNewScore({ userId: '', points: '', timeMs: '', notes: '' });
        if (selectedGame) loadScoresForGame(selectedGame);
      }
    } catch (error) {
      console.error('Failed to add score:', error);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !newPlayer.name) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          name: newPlayer.name,
          nickname: newPlayer.nickname || null,
          team: newPlayer.team || null,
        }),
      });

      if (res.ok) {
        await loadData(eventId);
        setNewPlayer({ name: '', nickname: '', team: '' });
        setShowAddPlayer(false);
      }
    } catch (error) {
      console.error('Failed to add player:', error);
    }
  };

  const handleStartEditGame = (game: Game) => {
    setEditingGameId(game.id);
    setGameDraft({ name: game.name, type: game.type as any, rules: game.rules || '' });
  };

  const handleSaveGame = async (gameId: number) => {
    try {
      const res = await fetch('/api/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: gameId,
          name: gameDraft.name,
          type: gameDraft.type,
          rules: gameDraft.rules || null,
        }),
      });

      if (res.ok && eventId) {
        await loadData(eventId);
        setEditingGameId(null);
      }
    } catch (error) {
      console.error('Failed to update game:', error);
    }
  };

  const handleDeleteGame = async (gameId: number) => {
    if (!confirm('Delete this game and all related scores?')) return;
    try {
      const res = await fetch(`/api/games?id=${gameId}`, { method: 'DELETE' });
      if (res.ok && eventId) {
        await loadData(eventId);
        if (selectedGame === gameId) {
          setSelectedGame(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete game:', error);
    }
  };

  const handleStartEditUser = (user: User) => {
    setEditingUserId(user.id);
    setUserDraft({
      name: user.name,
      nickname: user.nickname || '',
      team: (user.team as any) || '',
    });
  };

  const handleSaveUser = async (userId: number) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          name: userDraft.name,
          nickname: userDraft.nickname || null,
          team: userDraft.team || null,
        }),
      });

      if (res.ok && eventId) {
        await loadData(eventId);
        setEditingUserId(null);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Delete this player and their scores?')) return;
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      if (res.ok && eventId) {
        await loadData(eventId);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleStartEditScore = (score: Score) => {
    setEditingScoreId(score.id);
    setScoreDraft({
      userId: String(score.user_id),
      points: score.points !== undefined && score.points !== null ? String(score.points) : '',
      timeSeconds: score.time_ms ? String(score.time_ms / 1000) : '',
      notes: score.notes || '',
    });
  };

  const handleSaveScore = async (scoreId: number) => {
    if (!scoreDraft.userId) return;
    const userIdNum = parseInt(scoreDraft.userId, 10);
    if (isNaN(userIdNum)) return;

    try {
      const res = await fetch('/api/scores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scoreId,
          userId: userIdNum,
          points: scoreDraft.points ? parseFloat(scoreDraft.points) : null,
          timeMs: scoreDraft.timeSeconds ? parseFloat(scoreDraft.timeSeconds) * 1000 : null,
          notes: scoreDraft.notes || null,
        }),
      });

      if (res.ok && selectedGame) {
        await loadScoresForGame(selectedGame);
        setEditingScoreId(null);
      }
    } catch (error) {
      console.error('Failed to update score:', error);
    }
  };

  const handleDeleteScore = async (scoreId: number) => {
    if (!confirm('Delete this score?')) return;
    try {
      const res = await fetch(`/api/scores?id=${scoreId}`, { method: 'DELETE' });
      if (res.ok && selectedGame) {
        await loadScoresForGame(selectedGame);
      }
    } catch (error) {
      console.error('Failed to delete score:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="text-warm-500 text-xl font-medium">loading... 🌸</div>
      </div>
    );
  }

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
            <span className="text-2xl">🎯</span>
            <h1 className="text-2xl font-bold text-warm-700 lowercase">host view</h1>
          </div>
        </div>
        <p className="text-warm-500 text-sm ml-10">manage games and scores</p>
      </div>

      <div className="px-4 space-y-6 relative">
        {/* Games Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft border border-cream-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎮</span>
              <h2 className="text-lg font-bold text-warm-700 lowercase">games</h2>
            </div>
            <button
              onClick={() => setShowAddGame(!showAddGame)}
              className="btn-lavender flex items-center gap-2 text-sm py-2 px-4"
            >
              <PlusIcon />
              <span className="lowercase">add game</span>
            </button>
          </div>

          {showAddGame && (
            <form onSubmit={handleAddGame} className="mb-4 p-4 bg-lavender-50 rounded-2xl border border-lavender-200 space-y-3">
              <input
                type="text"
                placeholder="game name"
                value={newGame.name}
                onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
                className="input-spring text-sm"
                required
              />
              <select
                value={newGame.type}
                onChange={(e) => setNewGame({ ...newGame, type: e.target.value as any })}
                className="input-spring text-sm"
              >
                <option value="score">points</option>
                <option value="time">time</option>
                <option value="hybrid">points + time</option>
              </select>
              <textarea
                placeholder="rules (optional)"
                value={newGame.rules}
                onChange={(e) => setNewGame({ ...newGame, rules: e.target.value })}
                className="input-spring text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 btn-lavender text-sm py-2">
                  create
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddGame(false)}
                  className="flex-1 btn-spring bg-cream-200 text-warm-600 text-sm py-2"
                >
                  cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {games.map((game) => (
              <div key={game.id} className="p-4 bg-cream-50 border border-cream-200 rounded-2xl hover:border-lavender-300 transition-all">
                {editingGameId === game.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={gameDraft.name}
                      onChange={(e) => setGameDraft({ ...gameDraft, name: e.target.value })}
                      className="input-spring text-sm"
                    />
                    <select
                      value={gameDraft.type}
                      onChange={(e) => setGameDraft({ ...gameDraft, type: e.target.value as any })}
                      className="input-spring text-sm"
                    >
                      <option value="score">points</option>
                      <option value="time">time</option>
                      <option value="hybrid">points + time</option>
                    </select>
                    <textarea
                      value={gameDraft.rules}
                      onChange={(e) => setGameDraft({ ...gameDraft, rules: e.target.value })}
                      className="input-spring text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveGame(game.id)}
                        className="flex-1 btn-lavender text-sm py-2"
                      >
                        save
                      </button>
                      <button
                        onClick={() => setEditingGameId(null)}
                        className="flex-1 btn-spring bg-cream-200 text-warm-600 text-sm py-2"
                      >
                        cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-warm-700 lowercase">{game.name}</h3>
                      <span className="text-xs text-warm-400 lowercase">{game.type}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <button
                        onClick={() => handleStartEditGame(game)}
                        className="text-lavender-500 hover:text-lavender-600 font-semibold lowercase"
                      >
                        edit
                      </button>
                      <button
                        onClick={() => handleDeleteGame(game.id)}
                        className="text-peach-500 hover:text-peach-600 font-semibold lowercase"
                      >
                        delete
                      </button>
                      <Link
                        href={`/games/${game.id}`}
                        className="text-sky-500 hover:text-sky-600 font-semibold lowercase"
                      >
                        view →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scores Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft border border-cream-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h2 className="text-lg font-bold text-warm-700 lowercase">add score</h2>
            </div>
            <button
              onClick={() => setShowAddScore(!showAddScore)}
              className="btn-butter flex items-center gap-2 text-sm py-2 px-4"
            >
              <PlusIcon />
              <span className="lowercase">new score</span>
            </button>
          </div>

          {showAddScore && (
            <form onSubmit={handleAddScore} className="p-4 bg-butter-50 rounded-2xl border border-butter-200 space-y-3">
              <select
                value={selectedGame || ''}
                onChange={(e) => setSelectedGame(parseInt(e.target.value))}
                className="input-spring text-sm"
                required
              >
                <option value="">select game...</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>

              {selectedGame && (
                <>
                  <select
                    value={newScore.userId}
                    onChange={(e) => setNewScore({ ...newScore, userId: e.target.value })}
                    className="input-spring text-sm"
                    required
                  >
                    <option value="">select player...</option>
                    {users.filter(u => u.team === 'boys').map((u) => (
                      <option key={u.id} value={u.id}>💙 {u.nickname || u.name} (boys)</option>
                    ))}
                    {users.filter(u => u.team === 'girls').map((u) => (
                      <option key={u.id} value={u.id}>💗 {u.nickname || u.name} (girls)</option>
                    ))}
                    {users.filter(u => !u.team).map((u) => (
                      <option key={u.id} value={u.id}>{u.nickname || u.name} (no team)</option>
                    ))}
                  </select>

                  {users.length === 0 && (
                    <p className="text-sm text-peach-600">
                      no players yet. add players to record scores.
                    </p>
                  )}

                  {games.find(g => g.id === selectedGame)?.type !== 'time' && (
                    <input
                      type="number"
                      placeholder="points"
                      value={newScore.points}
                      onChange={(e) => setNewScore({ ...newScore, points: e.target.value })}
                      className="input-spring text-sm"
                      step="0.1"
                    />
                  )}

                  {games.find(g => g.id === selectedGame)?.type !== 'score' && (
                    <input
                      type="number"
                      placeholder="time (seconds)"
                      value={newScore.timeMs}
                      onChange={(e) => setNewScore({ ...newScore, timeMs: e.target.value })}
                      className="input-spring text-sm"
                    />
                  )}

                  <textarea
                    placeholder="notes (optional)"
                    value={newScore.notes}
                    onChange={(e) => setNewScore({ ...newScore, notes: e.target.value })}
                    className="input-spring text-sm"
                    rows={2}
                  />
                </>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 btn-butter text-sm py-2 disabled:opacity-50"
                  disabled={!selectedGame || !newScore.userId || users.length === 0}
                >
                  add score
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddScore(false);
                    setSelectedGame(null);
                    setNewScore({ userId: '', points: '', timeMs: '', notes: '' });
                  }}
                  className="flex-1 btn-spring bg-cream-200 text-warm-600 text-sm py-2"
                >
                  cancel
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 space-y-3">
            {/* Score entry counts & extra-slot indicator for uneven teams */}
            {selectedGame && !scoresLoading && users.length > 0 && (() => {
              const boysCount = users.filter(u => u.team === 'boys').length;
              const girlsCount = users.filter(u => u.team === 'girls').length;
              const maxSlots = Math.max(boysCount, girlsCount);
              const boysEntries = gameScores.filter(s => s.team === 'boys').length;
              const girlsEntries = gameScores.filter(s => s.team === 'girls').length;
              const smallerTeam = boysCount < girlsCount ? 'boys' : girlsCount < boysCount ? 'girls' : null;
              const boysSlots = smallerTeam === 'boys' ? maxSlots : boysCount;
              const girlsSlots = smallerTeam === 'girls' ? maxSlots : girlsCount;
              return (
                <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 space-y-2 mb-4">
                  <h4 className="text-xs font-bold text-warm-500 uppercase tracking-wider">entries per team</h4>
                  <div className="flex gap-4 text-sm">
                    <div className={`flex-1 p-2 rounded-xl ${boysEntries >= boysSlots ? 'bg-sky-100 border border-sky-200' : 'bg-sky-50 border border-sky-200'}`}>
                      <span className="font-semibold text-warm-700">💙 boys</span>
                      <span className="ml-2 text-warm-600">{boysEntries}/{boysSlots}</span>
                      {smallerTeam === 'boys' && boysSlots > boysCount && (
                        <span className="block text-xs text-sky-600 mt-0.5">
                          {boysEntries >= boysSlots ? 'extra slot used ✓' : `${boysSlots - boysCount} extra slot(s) available`}
                        </span>
                      )}
                    </div>
                    <div className={`flex-1 p-2 rounded-xl ${girlsEntries >= girlsSlots ? 'bg-peach-100 border border-peach-200' : 'bg-peach-50 border border-peach-200'}`}>
                      <span className="font-semibold text-warm-700">💗 girls</span>
                      <span className="ml-2 text-warm-600">{girlsEntries}/{girlsSlots}</span>
                      {smallerTeam === 'girls' && girlsSlots > girlsCount && (
                        <span className="block text-xs text-peach-600 mt-0.5">
                          {girlsEntries >= girlsSlots ? 'extra slot used ✓' : `${girlsSlots - girlsCount} extra slot(s) available`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
            <h3 className="text-sm font-bold text-warm-700 lowercase">scores</h3>
            {!selectedGame && <p className="text-sm text-warm-400">select a game to view scores.</p>}
            {selectedGame && scoresLoading && <p className="text-sm text-warm-400">loading scores...</p>}
            {selectedGame && !scoresLoading && gameScores.length === 0 && (
              <p className="text-sm text-warm-400">no scores yet.</p>
            )}
            {selectedGame && !scoresLoading && gameScores.length > 0 && (
              <div className="space-y-2">
                {gameScores.map((score) => {
                  const selectedGameData = games.find(g => g.id === selectedGame);
                  const isEditing = editingScoreId === score.id;
                  return (
                    <div key={score.id} className="p-3 bg-cream-50 rounded-2xl border border-cream-200">
                      {isEditing ? (
                        <div className="space-y-3">
                          <select
                            value={scoreDraft.userId}
                            onChange={(e) => setScoreDraft({ ...scoreDraft, userId: e.target.value })}
                            className="input-spring text-sm"
                          >
                            <option value="">select player...</option>
                            {users.filter(u => u.team === 'boys').map((u) => (
                              <option key={u.id} value={u.id}>💙 {u.nickname || u.name} (boys)</option>
                            ))}
                            {users.filter(u => u.team === 'girls').map((u) => (
                              <option key={u.id} value={u.id}>💗 {u.nickname || u.name} (girls)</option>
                            ))}
                            {users.filter(u => !u.team).map((u) => (
                              <option key={u.id} value={u.id}>{u.nickname || u.name} (no team)</option>
                            ))}
                          </select>
                          {selectedGameData?.type !== 'time' && (
                            <input
                              type="number"
                              placeholder="points"
                              value={scoreDraft.points}
                              onChange={(e) => setScoreDraft({ ...scoreDraft, points: e.target.value })}
                              className="input-spring text-sm"
                              step="0.1"
                            />
                          )}
                          {selectedGameData?.type !== 'score' && (
                            <input
                              type="number"
                              placeholder="time (seconds)"
                              value={scoreDraft.timeSeconds}
                              onChange={(e) => setScoreDraft({ ...scoreDraft, timeSeconds: e.target.value })}
                              className="input-spring text-sm"
                            />
                          )}
                          <textarea
                            placeholder="notes (optional)"
                            value={scoreDraft.notes}
                            onChange={(e) => setScoreDraft({ ...scoreDraft, notes: e.target.value })}
                            className="input-spring text-sm"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveScore(score.id)}
                              className="flex-1 btn-butter text-sm py-2"
                            >
                              save
                            </button>
                            <button
                              onClick={() => setEditingScoreId(null)}
                              className="flex-1 btn-spring bg-cream-200 text-warm-600 text-sm py-2"
                            >
                              cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-warm-700">
                            <div className="font-semibold flex items-center gap-2">
                              {score.team === 'boys' && '💙 '}
                              {score.team === 'girls' && '💗 '}
                              {score.nickname || score.name}
                            </div>
                            <div className="text-xs text-warm-400 lowercase">
                              {score.notes || 'no notes'}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-warm-700">
                            {selectedGameData?.type !== 'time' && (
                              <span className="font-semibold">{score.points ?? 0} pts</span>
                            )}
                            {selectedGameData?.type !== 'score' && score.time_ms && (
                              <span className="font-semibold">{(score.time_ms / 1000).toFixed(2)}s</span>
                            )}
                            <button
                              onClick={() => handleStartEditScore(score)}
                              className="text-butter-600 hover:text-butter-700 font-semibold lowercase"
                            >
                              edit
                            </button>
                            <button
                              onClick={() => handleDeleteScore(score.id)}
                              className="text-peach-500 hover:text-peach-600 font-semibold lowercase"
                            >
                              delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Players Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft border border-cream-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">👥</span>
              <h2 className="text-lg font-bold text-warm-700 lowercase">players</h2>
            </div>
            <button
              onClick={() => setShowAddPlayer(!showAddPlayer)}
              className="btn-sky flex items-center gap-2 text-sm py-2 px-4"
            >
              <PlusIcon />
              <span className="lowercase">add player</span>
            </button>
          </div>

          {showAddPlayer && (
            <form onSubmit={handleAddPlayer} className="mb-4 p-4 bg-sky-50 rounded-2xl border border-sky-200 space-y-3">
              <input
                type="text"
                placeholder="player name"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                className="input-spring text-sm"
                required
              />
              <input
                type="text"
                placeholder="nickname (optional)"
                value={newPlayer.nickname}
                onChange={(e) => setNewPlayer({ ...newPlayer, nickname: e.target.value })}
                className="input-spring text-sm"
              />
              <select
                value={newPlayer.team}
                onChange={(e) => setNewPlayer({ ...newPlayer, team: e.target.value as 'boys' | 'girls' | '' })}
                className="input-spring text-sm"
              >
                <option value="">no team</option>
                <option value="boys">team boys 💙</option>
                <option value="girls">team girls 💗</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 btn-sky text-sm py-2">
                  add player
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPlayer(false)}
                  className="flex-1 btn-spring bg-cream-200 text-warm-600 text-sm py-2"
                >
                  cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className={`p-3 rounded-2xl border-2 ${
                user.team === 'boys' 
                  ? 'bg-sky-50 border-sky-200' 
                  : user.team === 'girls'
                  ? 'bg-peach-50 border-peach-200'
                  : 'bg-cream-50 border-cream-200'
              }`}>
                {editingUserId === user.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={userDraft.name}
                      onChange={(e) => setUserDraft({ ...userDraft, name: e.target.value })}
                      className="input-spring text-sm"
                    />
                    <input
                      type="text"
                      value={userDraft.nickname}
                      onChange={(e) => setUserDraft({ ...userDraft, nickname: e.target.value })}
                      className="input-spring text-sm"
                      placeholder="nickname"
                    />
                    <select
                      value={userDraft.team}
                      onChange={(e) => setUserDraft({ ...userDraft, team: e.target.value as 'boys' | 'girls' | '' })}
                      className="input-spring text-sm"
                    >
                      <option value="">no team</option>
                      <option value="boys">team boys 💙</option>
                      <option value="girls">team girls 💗</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveUser(user.id)}
                        className="flex-1 btn-sky text-sm py-1"
                      >
                        save
                      </button>
                      <button
                        onClick={() => setEditingUserId(null)}
                        className="flex-1 btn-spring bg-cream-200 text-warm-600 text-sm py-1"
                      >
                        cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {user.team === 'boys' && <span className="text-lg">💙</span>}
                      {user.team === 'girls' && <span className="text-lg">💗</span>}
                      <span className="font-semibold text-warm-700 text-sm">{user.nickname || user.name}</span>
                      {user.nickname && user.name !== user.nickname && (
                        <span className="text-xs text-warm-400">({user.name})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <button
                        onClick={() => handleStartEditUser(user)}
                        className="text-sky-500 hover:text-sky-600 font-semibold lowercase"
                      >
                        edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-peach-500 hover:text-peach-600 font-semibold lowercase"
                      >
                        delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
