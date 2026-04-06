'use client';

import { useCallback, useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  nickname?: string;
  team?: 'boys' | 'girls';
}

export type GameScoreEntryProps = {
  eventId: number;
  gameId: number;
  gameType: string;
  gameName?: string;
  onSaved?: () => void;
};

export function GameScoreEntry({ eventId, gameId, gameType, gameName, onSaved }: GameScoreEntryProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [newScore, setNewScore] = useState({
    userId: '',
    points: '',
    timeMs: '',
  });

  // Beer Pong 2v2 state
  const isBeerPong = (gameName?.toLowerCase() || '').includes('beer pong') || (gameName?.toLowerCase() || '').includes('pong');
  const [bpBoys, setBpBoys] = useState<number[]>([]);
  const [bpGirls, setBpGirls] = useState<number[]>([]);
  const [bpRounds, setBpRounds] = useState<Array<'boys' | 'girls'>>([]);
  const [bpPhase, setBpPhase] = useState<'select' | 'playing' | 'done'>('select');
  const [bpSaving, setBpSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    const res = await fetch(`/api/users?eventId=${eventId}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  }, [eventId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
        }),
      });

      if (res.ok) {
        setNewScore({ userId: '', points: '', timeMs: '' });
        onSaved?.();
      }
    } catch (error) {
      console.error('Failed to add score:', error);
    }
  };

  const handleSaveBeerPong = async () => {
    if (bpRounds.length === 0) return;
    const boysWins = bpRounds.filter(r => r === 'boys').length;
    const girlsWins = bpRounds.filter(r => r === 'girls').length;

    setBpSaving(true);
    try {
      for (const userId of [...bpBoys, ...bpGirls]) {
        const user = users.find(u => u.id === userId);
        const wins = user?.team === 'boys' ? boysWins : girlsWins;
        await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            gameId,
            userId,
            points: wins,
            notes: `Beer Pong 2v2 — ${boysWins} boys vs ${girlsWins} girls (${bpRounds.length} rounds)`,
          }),
        });
      }
      setBpPhase('done');
      onSaved?.();
    } catch (error) {
      console.error('Failed to save beer pong scores:', error);
    } finally {
      setBpSaving(false);
    }
  };

  const showPoints = gameType !== 'time';
  const showTime = gameType !== 'score';

  if (isBeerPong) {
    const boysUsers = users.filter(u => u.team === 'boys');
    const girlsUsers = users.filter(u => u.team === 'girls');
    const boysWins = bpRounds.filter(r => r === 'boys').length;
    const girlsWins = bpRounds.filter(r => r === 'girls').length;

    return (
      <div className="space-y-5">
        <p className="text-sm text-warm-500 lowercase">pick 2 players per team, then record who wins each round.</p>

        {/* Phase: Team Selection */}
        {bpPhase === 'select' && (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-bold text-sky-600 mb-2 lowercase flex items-center gap-2">
                <span>💙</span> team boys — pick 2
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {boysUsers.map(u => {
                  const sel = bpBoys.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        if (sel) setBpBoys(prev => prev.filter(id => id !== u.id));
                        else if (bpBoys.length < 2) setBpBoys(prev => [...prev, u.id]);
                      }}
                      className={`p-3 rounded-2xl border-2 text-sm font-medium lowercase transition-all ${
                        sel
                          ? 'border-sky-400 bg-sky-100 text-sky-700'
                          : 'border-cream-200 bg-cream-50 text-warm-600 hover:border-sky-300'
                      }`}
                    >
                      {sel && <span className="mr-1">✓</span>}
                      {u.nickname || u.name}
                    </button>
                  );
                })}
              </div>
              {boysUsers.length < 2 && (
                <p className="text-xs text-peach-600 mt-2">need at least 2 boys players.</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-peach-600 mb-2 lowercase flex items-center gap-2">
                <span>💗</span> team girls — pick 2
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {girlsUsers.map(u => {
                  const sel = bpGirls.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        if (sel) setBpGirls(prev => prev.filter(id => id !== u.id));
                        else if (bpGirls.length < 2) setBpGirls(prev => [...prev, u.id]);
                      }}
                      className={`p-3 rounded-2xl border-2 text-sm font-medium lowercase transition-all ${
                        sel
                          ? 'border-peach-400 bg-peach-100 text-peach-700'
                          : 'border-cream-200 bg-cream-50 text-warm-600 hover:border-peach-300'
                      }`}
                    >
                      {sel && <span className="mr-1">✓</span>}
                      {u.nickname || u.name}
                    </button>
                  );
                })}
              </div>
              {girlsUsers.length < 2 && (
                <p className="text-xs text-peach-600 mt-2">need at least 2 girls players.</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setBpPhase('playing')}
              disabled={bpBoys.length !== 2 || bpGirls.length !== 2}
              className="w-full btn-butter text-sm py-3 lowercase disabled:opacity-40"
            >
              start game 🏓
            </button>
          </div>
        )}

        {/* Phase: Round Tracker */}
        {bpPhase === 'playing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="text-xs font-bold text-sky-600 lowercase mb-1">💙 boys</div>
                <div className="text-3xl font-bold text-sky-700">{boysWins}</div>
                <div className="text-xs text-warm-400 mt-1 lowercase">
                  {bpBoys.map(id => users.find(u => u.id === id)).map(u => u?.nickname || u?.name || '?').join(' & ')}
                </div>
              </div>
              <div className="text-center px-3">
                <div className="text-lg font-bold text-warm-400">vs</div>
                <div className="text-xs text-warm-400">r{bpRounds.length + 1}</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-xs font-bold text-peach-600 lowercase mb-1">💗 girls</div>
                <div className="text-3xl font-bold text-peach-700">{girlsWins}</div>
                <div className="text-xs text-warm-400 mt-1 lowercase">
                  {bpGirls.map(id => users.find(u => u.id === id)).map(u => u?.nickname || u?.name || '?').join(' & ')}
                </div>
              </div>
            </div>

            {bpRounds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center pt-1">
                {bpRounds.map((winner, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      winner === 'boys' ? 'bg-sky-100 text-sky-700' : 'bg-peach-100 text-peach-700'
                    }`}
                  >
                    r{i + 1}: {winner === 'boys' ? '💙' : '💗'}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBpRounds(prev => [...prev, 'boys'])}
                className="p-3 rounded-2xl border-2 border-sky-300 bg-sky-50 text-sky-700 font-bold text-sm lowercase hover:bg-sky-100 active:scale-95 transition-all"
              >
                💙 boys won
              </button>
              <button
                type="button"
                onClick={() => setBpRounds(prev => [...prev, 'girls'])}
                className="p-3 rounded-2xl border-2 border-peach-300 bg-peach-50 text-peach-700 font-bold text-sm lowercase hover:bg-peach-100 active:scale-95 transition-all"
              >
                💗 girls won
              </button>
            </div>

            <div className="flex gap-2 justify-center">
              {bpRounds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setBpRounds(prev => prev.slice(0, -1))}
                  className="btn-spring bg-cream-200 text-warm-600 lowercase text-xs py-2 px-3"
                >
                  undo last
                </button>
              )}
              {bpRounds.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveBeerPong}
                  disabled={bpSaving}
                  className="btn-butter lowercase text-xs py-2 px-3"
                >
                  {bpSaving ? 'saving...' : 'end game & save 🏆'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Phase: Done */}
        {bpPhase === 'done' && (
          <div className="text-center space-y-3">
            <div className="text-3xl">🏆</div>
            <div className="flex items-center justify-center gap-4 text-2xl font-bold">
              <span className="text-sky-600">💙 {boysWins}</span>
              <span className="text-warm-400">—</span>
              <span className="text-peach-600">💗 {girlsWins}</span>
            </div>
            <p className="text-warm-600 text-sm lowercase">
              {boysWins === girlsWins
                ? "it's a tie!"
                : boysWins > girlsWins
                  ? '💙 team boys wins!'
                  : '💗 team girls wins!'}
            </p>
            <p className="text-warm-400 text-xs lowercase">
              {bpRounds.length} round{bpRounds.length !== 1 ? 's' : ''} — scores saved
            </p>
            <button
              type="button"
              onClick={() => {
                setBpPhase('select');
                setBpBoys([]);
                setBpGirls([]);
                setBpRounds([]);
              }}
              className="btn-butter lowercase text-sm"
            >
              new game 🔄
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleAddScore} className="space-y-3">
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

      <button
        type="submit"
        className="w-full btn-butter text-sm py-2 disabled:opacity-50"
        disabled={!newScore.userId || users.length === 0}
      >
        add score
      </button>
    </form>
  );
}
