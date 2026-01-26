'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InitPage() {
  const router = useRouter();
  const [eventCode, setEventCode] = useState('FRIEND2024');
  const [eventName, setEventName] = useState('Friendlympics 2024');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventCode: eventCode.toUpperCase(),
          eventName,
          createSampleGames: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize event');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-mint-200/40 rounded-full blur-3xl" />
          <div className="absolute top-1/4 -right-20 w-80 h-80 bg-butter-200/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl" />
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] shadow-soft-xl p-8 w-full max-w-md text-center relative border border-cream-200">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-4 text-mint-500 lowercase">event created!</h1>
          <p className="text-warm-600 mb-6">
            your event <strong className="text-warm-700">{eventName}</strong> has been initialized with code:
          </p>
          <div className="bg-butter-100 p-4 rounded-2xl mb-6 border-2 border-butter-300">
            <div className="text-4xl font-bold tracking-wider text-warm-700">{eventCode.toUpperCase()}</div>
          </div>
          <p className="text-warm-500 mb-6">
            share this code with your friends so they can join! 🌸
          </p>
          <Link
            href="/"
            className="block btn-sky lowercase"
          >
            go to home page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-lavender-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-peach-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-mint-200/40 rounded-full blur-3xl" />
        
        {/* Floating elements */}
        <div className="absolute top-16 left-10 text-3xl animate-float">🌷</div>
        <div className="absolute top-32 right-16 text-2xl animate-float-slow">✨</div>
        <div className="absolute bottom-32 left-20 text-2xl animate-float-reverse">🌸</div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] shadow-soft-xl p-8 w-full max-w-md relative border border-cream-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">✨</span>
          <h1 className="text-2xl font-bold text-warm-700 lowercase">
            initialize event
          </h1>
        </div>
        <p className="text-warm-500 mb-6 lowercase">set up your first friendlympics event</p>

        <form onSubmit={handleInit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-warm-600 mb-2 lowercase">
              event name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="input-spring"
              placeholder="Friendlympics 2024"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-warm-600 mb-2 lowercase">
              event code
            </label>
            <input
              type="text"
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value.toUpperCase())}
              className="input-spring text-center text-2xl font-bold tracking-wider"
              placeholder="FRIEND2024"
              required
              maxLength={10}
            />
            <p className="text-xs text-warm-400 mt-2 lowercase">this code will be used by participants to join</p>
          </div>
          {error && (
            <div className="bg-peach-100 border-2 border-peach-300 text-warm-700 px-4 py-3 rounded-2xl text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-butter text-lg disabled:opacity-50 disabled:cursor-not-allowed lowercase"
          >
            {loading ? 'creating...' : 'create event 🌟'}
          </button>
          <Link
            href="/"
            className="block text-center text-warm-500 hover:text-warm-700 text-sm lowercase"
          >
            back to home
          </Link>
        </form>
      </div>
    </div>
  );
}
