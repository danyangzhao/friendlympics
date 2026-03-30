'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { defaultsForGameType } from '@/lib/scoring';
import { initDefaultEventAndStore } from '@/lib/client-event';

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
  team_win_rule: string;
  time_direction: string;
}

interface User {
  id: number;
  name: string;
  nickname?: string;
  team?: 'boys' | 'girls';
}

export default function HostPage() {
  const router = useRouter();
  const [eventId, setEventId] = useState<number | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGame, setShowAddGame] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const [newGame, setNewGame] = useState({
    name: '',
    type: 'score' as 'score' | 'time' | 'hybrid',
    rules: '',
    team_win_rule: 'avg_points',
    time_direction: 'lower_better',
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
    team_win_rule: 'avg_points',
    time_direction: 'lower_better',
  });
  const [userDraft, setUserDraft] = useState({
    name: '',
    nickname: '',
    team: '' as '' | 'boys' | 'girls',
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

  const loadData = async (eId: number) => {
    try {
      let id = eId;
      let gamesRes = await fetch(`/api/games?eventId=${id}`);
      if (gamesRes.status === 404) {
        id = await initDefaultEventAndStore();
        setEventId(id);
        gamesRes = await fetch(`/api/games?eventId=${id}`);
      }

      const usersRes = await fetch(`/api/users?eventId=${id}`);

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
          teamWinRule: newGame.team_win_rule,
          timeDirection: newGame.time_direction,
        }),
      });

      if (res.ok) {
        await loadData(eventId);
        const d = defaultsForGameType('score');
        setNewGame({ name: '', type: 'score', rules: '', team_win_rule: d.team_win_rule, time_direction: d.time_direction });
        setShowAddGame(false);
      }
    } catch (error) {
      console.error('Failed to add game:', error);
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
    const t = game.type as 'score' | 'time' | 'hybrid';
    const d = defaultsForGameType(t);
    setGameDraft({
      name: game.name,
      type: t,
      rules: game.rules || '',
      team_win_rule: game.team_win_rule || d.team_win_rule,
      time_direction: game.time_direction || d.time_direction,
    });
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
          teamWinRule: gameDraft.team_win_rule,
          timeDirection: gameDraft.time_direction,
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
        <p className="text-warm-500 text-sm ml-10">manage games and players — scores are logged on each game&apos;s page</p>
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
                onChange={(e) => {
                  const type = e.target.value as 'score' | 'time' | 'hybrid';
                  const d = defaultsForGameType(type);
                  setNewGame({ ...newGame, type, team_win_rule: d.team_win_rule, time_direction: d.time_direction });
                }}
                className="input-spring text-sm"
              >
                <option value="score">points</option>
                <option value="time">time</option>
                <option value="hybrid">points + time</option>
              </select>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={newGame.team_win_rule}
                  onChange={(e) => setNewGame({ ...newGame, team_win_rule: e.target.value })}
                  className="input-spring text-sm"
                  title="How team winner is computed"
                >
                  <option value="avg_points">team: avg points</option>
                  <option value="sum_points">team: sum points</option>
                  <option value="avg_time_ms">team: avg time</option>
                  <option value="sum_time_ms">team: sum time (e.g. relay)</option>
                </select>
                <select
                  value={newGame.time_direction}
                  onChange={(e) => setNewGame({ ...newGame, time_direction: e.target.value })}
                  className="input-spring text-sm"
                  title="Lower time wins vs longer time wins"
                >
                  <option value="lower_better">time: lower is better (races)</option>
                  <option value="higher_better">time: higher is better (holds)</option>
                </select>
              </div>
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
                      onChange={(e) => {
                        const type = e.target.value as 'score' | 'time' | 'hybrid';
                        const d = defaultsForGameType(type);
                        setGameDraft({ ...gameDraft, type, team_win_rule: d.team_win_rule, time_direction: d.time_direction });
                      }}
                      className="input-spring text-sm"
                    >
                      <option value="score">points</option>
                      <option value="time">time</option>
                      <option value="hybrid">points + time</option>
                    </select>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={gameDraft.team_win_rule}
                        onChange={(e) => setGameDraft({ ...gameDraft, team_win_rule: e.target.value })}
                        className="input-spring text-sm"
                      >
                        <option value="avg_points">team: avg points</option>
                        <option value="sum_points">team: sum points</option>
                        <option value="avg_time_ms">team: avg time</option>
                        <option value="sum_time_ms">team: sum time</option>
                      </select>
                      <select
                        value={gameDraft.time_direction}
                        onChange={(e) => setGameDraft({ ...gameDraft, time_direction: e.target.value })}
                        className="input-spring text-sm"
                      >
                        <option value="lower_better">time: lower better</option>
                        <option value="higher_better">time: higher better</option>
                      </select>
                    </div>
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
                      <span className="text-xs text-warm-400 lowercase">
                        {game.type} · {game.team_win_rule ?? 'avg_points'} · {game.time_direction ?? 'lower_better'}
                      </span>
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
