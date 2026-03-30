'use client';

import { useCallback, useEffect, useState } from 'react';

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

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

export type GameScoreEntryProps = {
  eventId: number;
  gameId: number;
  gameType: string;
  onSaved?: () => void;
};

export function GameScoreEntry({ eventId, gameId, gameType, onSaved }: GameScoreEntryProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [gameScores, setGameScores] = useState<Score[]>([]);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingScoreId, setEditingScoreId] = useState<number | null>(null);

  const [newScore, setNewScore] = useState({
    userId: '',
    points: '',
    timeMs: '',
    notes: '',
  });
  const [scoreDraft, setScoreDraft] = useState({
    userId: '',
    points: '',
    timeSeconds: '',
    notes: '',
  });

  const loadUsers = useCallback(async () => {
    const res = await fetch(`/api/users?eventId=${eventId}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  }, [eventId]);

  const loadScores = useCallback(async () => {
    setScoresLoading(true);
    try {
      const res = await fetch(`/api/scores?gameId=${gameId}`);
      if (res.ok) {
        const data = await res.json();
        setGameScores(data);
      }
    } finally {
      setScoresLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  const notify = () => {
    onSaved?.();
    loadScores();
  };

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScore.userId) return;
    const uid = parseInt(newScore.userId, 10);
    if (!users.some((u) => u.id === uid)) return;

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          gameId,
          userId: uid,
          points: newScore.points ? parseFloat(newScore.points) : null,
          timeMs: newScore.timeMs ? parseFloat(newScore.timeMs) * 1000 : null,
          notes: newScore.notes || null,
        }),
      });

      if (res.ok) {
        setNewScore({ userId: '', points: '', timeMs: '', notes: '' });
        setShowAdd(false);
        notify();
      }
    } catch (error) {
      console.error('Failed to add score:', error);
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
    const uid = parseInt(scoreDraft.userId, 10);
    if (!users.some((u) => u.id === uid)) return;

    try {
      const res = await fetch('/api/scores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scoreId,
          userId: uid,
          points: scoreDraft.points ? parseFloat(scoreDraft.points) : null,
          timeMs: scoreDraft.timeSeconds ? parseFloat(scoreDraft.timeSeconds) * 1000 : null,
          notes: scoreDraft.notes || null,
        }),
      });

      if (res.ok) {
        setEditingScoreId(null);
        notify();
      }
    } catch (error) {
      console.error('Failed to update score:', error);
    }
  };

  const handleDeleteScore = async (scoreId: number) => {
    if (!confirm('Delete this score?')) return;
    try {
      const res = await fetch(`/api/scores?id=${scoreId}`, { method: 'DELETE' });
      if (res.ok) {
        notify();
      }
    } catch (error) {
      console.error('Failed to delete score:', error);
    }
  };

  const showPoints = gameType !== 'time';
  const showTime = gameType !== 'score';

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-soft border border-cream-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">✏️</span>
          <h2 className="text-lg font-bold text-warm-700 lowercase">log scores</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="btn-butter flex items-center gap-2 text-sm py-2 px-4"
        >
          <PlusIcon />
          <span className="lowercase">new score</span>
        </button>
      </div>

      <p className="text-sm text-warm-500 mb-4 lowercase">
        anyone can add or edit scores for any player. updates apply to the standings below.
      </p>

      {showAdd && (
        <form onSubmit={handleAddScore} className="p-4 bg-butter-50 rounded-2xl border border-butter-200 space-y-3 mb-6">
          <select
            value={newScore.userId}
            onChange={(e) => setNewScore({ ...newScore, userId: e.target.value })}
            className="input-spring text-sm"
            required
          >
            <option value="">select player...</option>
            <optgroup label="team boys 💙">
              {users
                .filter((u) => u.team === 'boys')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nickname || u.name}
                    {u.nickname && u.name !== u.nickname ? ` (${u.name})` : ''}
                  </option>
                ))}
            </optgroup>
            <optgroup label="team girls 💗">
              {users
                .filter((u) => u.team === 'girls')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nickname || u.name}
                    {u.nickname && u.name !== u.nickname ? ` (${u.name})` : ''}
                  </option>
                ))}
            </optgroup>
            {users.filter((u) => !u.team).length > 0 && (
              <optgroup label="no team">
                {users
                  .filter((u) => !u.team)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nickname || u.name}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>

          {users.length === 0 && (
            <p className="text-sm text-peach-600">add players in host view first.</p>
          )}

          {showPoints && (
            <input
              type="number"
              placeholder="points"
              value={newScore.points}
              onChange={(e) => setNewScore({ ...newScore, points: e.target.value })}
              className="input-spring text-sm"
              step="0.1"
            />
          )}

          {showTime && (
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

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 btn-butter text-sm py-2 disabled:opacity-50"
              disabled={!newScore.userId || users.length === 0}
            >
              add score
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setNewScore({ userId: '', points: '', timeMs: '', notes: '' });
              }}
              className="flex-1 btn-spring bg-cream-200 text-warm-600 text-sm py-2"
            >
              cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {!scoresLoading && users.length > 0 && (() => {
          const boysCount = users.filter((u) => u.team === 'boys').length;
          const girlsCount = users.filter((u) => u.team === 'girls').length;
          const maxSlots = Math.max(boysCount, girlsCount);
          const boysEntries = gameScores.filter((s) => s.team === 'boys').length;
          const girlsEntries = gameScores.filter((s) => s.team === 'girls').length;
          const smallerTeam = boysCount < girlsCount ? 'boys' : girlsCount < boysCount ? 'girls' : null;
          const boysSlots = smallerTeam === 'boys' ? maxSlots : boysCount;
          const girlsSlots = smallerTeam === 'girls' ? maxSlots : girlsCount;
          return (
            <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 space-y-2 mb-4">
              <h4 className="text-xs font-bold text-warm-500 uppercase tracking-wider">entries per team</h4>
              <div className="flex gap-4 text-sm">
                <div
                  className={`flex-1 p-2 rounded-xl ${
                    boysEntries >= boysSlots ? 'bg-sky-100 border border-sky-200' : 'bg-sky-50 border border-sky-200'
                  }`}
                >
                  <span className="font-semibold text-warm-700">💙 boys</span>
                  <span className="ml-2 text-warm-600">
                    {boysEntries}/{boysSlots}
                  </span>
                  {smallerTeam === 'boys' && boysSlots > boysCount && (
                    <span className="block text-xs text-sky-600 mt-0.5">
                      {boysEntries >= boysSlots
                        ? 'extra slot used ✓'
                        : `${boysSlots - boysCount} extra slot(s) available`}
                    </span>
                  )}
                </div>
                <div
                  className={`flex-1 p-2 rounded-xl ${
                    girlsEntries >= girlsSlots ? 'bg-peach-100 border border-peach-200' : 'bg-peach-50 border border-peach-200'
                  }`}
                >
                  <span className="font-semibold text-warm-700">💗 girls</span>
                  <span className="ml-2 text-warm-600">
                    {girlsEntries}/{girlsSlots}
                  </span>
                  {smallerTeam === 'girls' && girlsSlots > girlsCount && (
                    <span className="block text-xs text-peach-600 mt-0.5">
                      {girlsEntries >= girlsSlots
                        ? 'extra slot used ✓'
                        : `${girlsSlots - girlsCount} extra slot(s) available`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        <h3 className="text-sm font-bold text-warm-700 lowercase">all entries</h3>
        {scoresLoading && <p className="text-sm text-warm-400">loading scores...</p>}
        {!scoresLoading && gameScores.length === 0 && <p className="text-sm text-warm-400">no scores yet.</p>}
        {!scoresLoading &&
          gameScores.length > 0 &&
          gameScores.map((score) => {
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
                      <optgroup label="team boys 💙">
                        {users
                          .filter((u) => u.team === 'boys')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nickname || u.name}
                              {u.nickname && u.name !== u.nickname ? ` (${u.name})` : ''}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="team girls 💗">
                        {users
                          .filter((u) => u.team === 'girls')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nickname || u.name}
                              {u.nickname && u.name !== u.nickname ? ` (${u.name})` : ''}
                            </option>
                          ))}
                      </optgroup>
                      {users.filter((u) => !u.team).length > 0 && (
                        <optgroup label="no team">
                          {users
                            .filter((u) => !u.team)
                            .map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.nickname || u.name}
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                    {showPoints && (
                      <input
                        type="number"
                        placeholder="points"
                        value={scoreDraft.points}
                        onChange={(e) => setScoreDraft({ ...scoreDraft, points: e.target.value })}
                        className="input-spring text-sm"
                        step="0.1"
                      />
                    )}
                    {showTime && (
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
                        type="button"
                        onClick={() => handleSaveScore(score.id)}
                        className="flex-1 btn-butter text-sm py-2"
                      >
                        save
                      </button>
                      <button
                        type="button"
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
                        {score.nickname && score.name !== score.nickname ? (
                          <span className="text-warm-500 font-normal text-xs">({score.name})</span>
                        ) : null}
                      </div>
                      <div className="text-xs text-warm-400 lowercase">{score.notes || 'no notes'}</div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-warm-700">
                      {showPoints && <span className="font-semibold">{score.points ?? 0} pts</span>}
                      {showTime && score.time_ms && (
                        <span className="font-semibold">{(score.time_ms / 1000).toFixed(2)}s</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStartEditScore(score)}
                        className="text-butter-600 hover:text-butter-700 font-semibold lowercase"
                      >
                        edit
                      </button>
                      <button
                        type="button"
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
    </div>
  );
}
