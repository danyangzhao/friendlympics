'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Decorative spring elements
const FloatingElement = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`absolute pointer-events-none select-none ${className}`}>
    {children}
  </div>
);

export default function Home() {
  const [eventCode, setEventCode] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [team, setTeam] = useState<'boys' | 'girls' | ''>('');
  const [step, setStep] = useState<'code' | 'profile'>('code');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/events?code=${encodeURIComponent(eventCode)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Event not found');
      }
      const event = await res.json();
      localStorage.setItem('eventId', event.id.toString());
      localStorage.setItem('eventCode', event.event_code);
      setStep('profile');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const eventId = localStorage.getItem('eventId');
      if (!eventId) {
        throw new Error('Event not found');
      }

      if (!team) {
        setError('Please select a team');
        return;
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: parseInt(eventId),
          name,
          nickname: nickname || null,
          team,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create profile');
      }

      const user = await res.json();
      localStorage.setItem('userId', user.id.toString());
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
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

      <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] shadow-soft-xl p-8 w-full max-w-md relative border border-cream-200">
        {/* Decorative corner elements */}
        <div className="absolute -top-3 -left-3 text-2xl">🌱</div>
        <div className="absolute -top-3 -right-3 text-2xl">🌱</div>
        
        <h1 className="text-4xl font-bold text-center mb-2 text-warm-700">
          friendlympics
        </h1>
        <p className="text-center text-warm-500 mb-8 text-lg">let the fun begin! ✨</p>

        {step === 'code' ? (
          <form onSubmit={handleCodeSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-warm-600 mb-2 lowercase">
                event code
              </label>
              <input
                type="text"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                className="input-spring text-center text-2xl font-bold tracking-wider"
                placeholder="ABC123"
                required
                maxLength={10}
              />
            </div>
            {error && (
              <div className="bg-peach-100 border-2 border-peach-300 text-warm-700 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-sky text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'checking...' : 'join event 🎉'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-warm-600 mb-2 lowercase">
                your name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-spring"
                placeholder="enter your name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-600 mb-2 lowercase">
                nickname (optional)
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="input-spring"
                placeholder="fun nickname"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-600 mb-3 lowercase">
                pick your team *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTeam('boys')}
                  className={`p-5 rounded-2xl border-2 transition-all ${
                    team === 'boys'
                      ? 'bg-gradient-to-br from-sky-100 to-sky-200 border-sky-300 ring-2 ring-sky-400 shadow-glow-sky'
                      : 'bg-cream-50 border-cream-200 hover:border-sky-300 hover:bg-sky-50'
                  }`}
                >
                  <div className="text-4xl mb-2">💙</div>
                  <div className={`font-bold lowercase ${team === 'boys' ? 'text-warm-700' : 'text-warm-500'}`}>
                    team boys
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTeam('girls')}
                  className={`p-5 rounded-2xl border-2 transition-all ${
                    team === 'girls'
                      ? 'bg-gradient-to-br from-peach-100 to-peach-200 border-peach-300 ring-2 ring-peach-400 shadow-glow-peach'
                      : 'bg-cream-50 border-cream-200 hover:border-peach-300 hover:bg-peach-50'
                  }`}
                >
                  <div className="text-4xl mb-2">💗</div>
                  <div className={`font-bold lowercase ${team === 'girls' ? 'text-warm-700' : 'text-warm-500'}`}>
                    team girls
                  </div>
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-peach-100 border-2 border-peach-300 text-warm-700 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('code')}
                className="flex-1 btn-spring bg-cream-200 text-warm-600 hover:bg-cream-300"
              >
                back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-butter text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'joining...' : "let's go! 🌟"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
