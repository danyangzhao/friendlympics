'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
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
  youtubeId: string;
  startTime?: number;
}

interface TriviaQuestion {
  question: string;
  options: string[];
  answer: number;
  category: string;
}

interface User {
  id: number;
  name: string;
  nickname?: string;
  team?: 'boys' | 'girls';
}

interface TypingPlayerResult {
  timeMs: number;
  wpm: number;
  accuracy: number;
}

type TypingGamePhase = 'setup' | 'playing' | 'results';

/** Visual styles for memory cards — picked randomly each round (face-down glyph, colors, shape). */
const MEMORY_CARD_VARIANTS = [
  {
    faceDown: '?',
    back: 'bg-cream-200 border-cream-300 hover:bg-cream-300',
    flipped: 'bg-butter-200 border-butter-400',
    matched: 'bg-mint-200 border-mint-500',
    card: 'rounded-xl',
    emoji: 'text-3xl',
  },
  {
    faceDown: '✦',
    back: 'bg-gradient-to-br from-lavender-100 to-lavender-200 border-lavender-300/80 hover:from-lavender-200',
    flipped: 'bg-butter-100 border-butter-400',
    matched: 'bg-mint-100 border-mint-500 ring-2 ring-mint-400/40',
    card: 'rounded-xl',
    emoji: 'text-3xl',
  },
  {
    faceDown: '···',
    back: 'bg-slate-100 border-slate-300 hover:bg-slate-200',
    flipped: 'bg-amber-50 border-amber-300',
    matched: 'bg-emerald-100 border-emerald-500',
    card: 'rounded-xl',
    emoji: 'text-3xl',
  },
  {
    faceDown: '✧',
    back: 'bg-gradient-to-br from-sky-100 to-cyan-100 border-sky-200 hover:from-sky-200',
    flipped: 'bg-white border-sky-300',
    matched: 'bg-teal-100 border-teal-500',
    card: 'rounded-2xl',
    emoji: 'text-4xl',
  },
  {
    faceDown: '♡',
    back: 'bg-gradient-to-br from-peach-100 to-peach-200 border-peach-300 hover:from-peach-200',
    flipped: 'bg-butter-50 border-peach-400',
    matched: 'bg-mint-200 border-mint-500',
    card: 'rounded-full',
    emoji: 'text-3xl',
  },
  {
    faceDown: '◆',
    back: 'bg-gradient-to-br from-lavender-50 via-cream-100 to-butter-100 border-butter-300',
    flipped: 'bg-white/90 border-butter-400',
    matched: 'bg-mint-200 border-mint-600',
    card: 'rounded-lg',
    emoji: 'text-3xl',
  },
  {
    faceDown: '★',
    back: 'bg-gradient-to-br from-indigo-100 to-violet-100 border-indigo-200',
    flipped: 'bg-butter-200 border-indigo-300',
    matched: 'bg-mint-200 border-mint-500',
    card: 'rounded-xl',
    emoji: 'text-3xl',
  },
  {
    faceDown: '◎',
    back: 'bg-cream-100 border-2 border-dashed border-warm-300 hover:border-warm-400',
    flipped: 'bg-butter-200 border-butter-400 border-solid',
    matched: 'bg-mint-200 border-mint-500 border-solid',
    card: 'rounded-xl',
    emoji: 'text-3xl',
  },
] as const;

/** Memory scoring (Option A): move-based points plus bounded exponential time bonus. */
const MEMORY_TIME_BONUS_MAX = 150;
const MEMORY_TIME_BONUS_TAU_MS = 90_000;
const MEMORY_SCORE_CAP = 1200;

function memoryScoreBreakdown(moves: number, timeMs: number) {
  const movePts = Math.max(0, 1000 - 10 * moves);
  const timeBonus = Math.round(
    MEMORY_TIME_BONUS_MAX * Math.exp(-timeMs / MEMORY_TIME_BONUS_TAU_MS)
  );
  const total = Math.min(MEMORY_SCORE_CAP, movePts + timeBonus);
  return { total, movePts, timeBonus };
}

/** 5×5 grid: 12 pairs + one empty tile (25 cells). Free space is always center (index 12). */
const MEMORY_PAIR_COUNT = 12;
const MEMORY_EMPTY_INDEX = 12;
/** Face-up flash of the full board before play; timer starts after this. */
const MEMORY_PREVIEW_MS = 2200;

type MemoryCell =
  | { kind: 'card'; emoji: string; flipped: boolean; matched: boolean }
  | { kind: 'empty' };

function shuffleMemoryDeck(emojis: string[]): MemoryCell[] {
  if (emojis.length < MEMORY_PAIR_COUNT) {
    console.warn(
      `memory theme has ${emojis.length} emojis; need ${MEMORY_PAIR_COUNT}. Update data/prompts.json.`
    );
    return [];
  }
  const pairEmojis = emojis.slice(0, MEMORY_PAIR_COUNT);
  const cards: MemoryCell[] = [];
  for (const emoji of pairEmojis) {
    cards.push({ kind: 'card', emoji, flipped: false, matched: false });
    cards.push({ kind: 'card', emoji, flipped: false, matched: false });
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  const deck: MemoryCell[] = new Array(25);
  let ci = 0;
  for (let i = 0; i < 25; i++) {
    if (i === MEMORY_EMPTY_INDEX) {
      deck[i] = { kind: 'empty' };
    } else {
      deck[i] = cards[ci++];
    }
  }
  return deck;
}

/** Partial credit for a wrong word: counts matching prefix chars toward accuracy (denominator is full target length). */
function longestCommonPrefixLength(a: string, b: string): number {
  let i = 0;
  const n = Math.min(a.length, b.length);
  while (i < n && a[i] === b[i]) i++;
  return i;
}

// Typing Game Component — word at a time; Space commits and moves on (typos do not misalign later words)
function TypingGame({
  targetText,
  onComplete,
  playerName,
  playerTeam,
}: {
  targetText: string;
  onComplete: (wpm: number, accuracy: number, timeMs: number) => void;
  playerName: string;
  playerTeam: 'boys' | 'girls';
}) {
  const tokens = useMemo(() => targetText.match(/\S+|\s+/g) || [], [targetText]);
  const words = useMemo(() => tokens.filter((t) => /\S/.test(t)), [tokens]);

  const [wordIndex, setWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [correctCharsSum, setCorrectCharsSum] = useState(0);
  /** Whether each completed word matched exactly (word-level styling). */
  const [wordExactMatch, setWordExactMatch] = useState<boolean[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTimeMs, setFinalTimeMs] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const readyButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setWordIndex(0);
    setCurrentInput('');
    setCorrectCharsSum(0);
    setWordExactMatch([]);
    setIsComplete(false);
    setFinalTimeMs(null);
    setElapsedTime(0);
    setStartTime((prev) => (prev !== null ? Date.now() : prev));
  }, [targetText]);

  useEffect(() => {
    if (!isReady && readyButtonRef.current) {
      readyButtonRef.current.focus();
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady && !isComplete && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isReady, isComplete, wordIndex]);

  const handleStartGame = () => {
    setIsReady(true);
    setStartTime(Date.now());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isReady) {
      e.preventDefault();
      handleStartGame();
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && !isComplete) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [startTime, isComplete]);

  const finishRound = useCallback(
    (finalCorrectChars: number, timeMs: number) => {
      const denom = targetText.length || 1;
      const accuracy = Math.round((finalCorrectChars / denom) * 100);
      const timeMinutes = timeMs / 60000;
      const wpm = Math.round((words.length / timeMinutes) || 0);
      setFinalTimeMs(timeMs);
      setElapsedTime(timeMs);
      setIsComplete(true);
      onComplete(wpm, accuracy, timeMs);
    },
    [onComplete, targetText.length, words.length]
  );

  const commitCurrentWord = useCallback(() => {
    if (!isReady || isComplete || words.length === 0) return;
    const expected = words[wordIndex];
    const typed = currentInput.replace(/\s/g, '');
    const exact = typed === expected;
    const added = exact ? expected.length : longestCommonPrefixLength(typed, expected);
    const nextSum = correctCharsSum + added;

    setWordExactMatch((prev) => [...prev, exact]);

    if (wordIndex >= words.length - 1) {
      const endTime = Date.now();
      const timeMs = endTime - (startTime || endTime);
      setCorrectCharsSum(nextSum);
      setCurrentInput('');
      setWordIndex(words.length);
      finishRound(nextSum, timeMs);
      return;
    }

    setCorrectCharsSum(nextSum);
    setWordIndex((w) => w + 1);
    setCurrentInput('');
  }, [
    isReady,
    isComplete,
    words,
    wordIndex,
    currentInput,
    correctCharsSum,
    startTime,
    finishRound,
  ]);

  const handleWordInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' && !isComplete) {
      e.preventDefault();
      commitCurrentWord();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\s/g, '');
    const maxLen = words[wordIndex]?.length ?? 0;
    setCurrentInput((prev) => (prev + pasted).slice(0, maxLen));
  };

  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}s`;
  };

  const renderPrompt = () => {
    let wordOrdinal = -1;
    return tokens.map((tok, i) => {
      if (!/\S/.test(tok)) {
        return (
          <span key={`ws-${i}`} className="whitespace-pre-wrap">
            {tok}
          </span>
        );
      }
      wordOrdinal += 1;
      const w = wordOrdinal;
      if (w < wordIndex) {
        const ok = wordExactMatch[w];
        return (
          <span
            key={`w-${i}`}
            className={
              ok ? 'bg-mint-200 text-mint-800 rounded px-0.5' : 'bg-peach-200 text-peach-800 rounded px-0.5'
            }
          >
            {tok}
          </span>
        );
      }
      if (w === wordIndex) {
        return (
          <span
            key={`w-${i}`}
            className="bg-butter-100 text-warm-900 ring-2 ring-butter-400 rounded px-0.5"
          >
            {tok}
          </span>
        );
      }
      return (
        <span key={`w-${i}`} className="text-warm-400">
          {tok}
        </span>
      );
    });
  };

  if (!isReady) {
    return (
      <div className="space-y-6" onKeyDown={handleKeyDown}>
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-4 border border-cream-200">
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl">{playerTeam === 'boys' ? '💙' : '💗'}</span>
            <span className="text-xl font-bold text-warm-700">{playerName}</span>
            <span className="text-warm-500 lowercase">get ready!</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft-xl p-8 border-2 border-butter-200 text-center">
          <div className="text-6xl mb-6">⌨️</div>
          <h3 className="text-2xl font-bold text-warm-700 mb-4 lowercase">ready to type?</h3>
          <p className="text-warm-500 mb-6">
            when you press start, the prompt will appear and the clock begins. type one word at a time and press{' '}
            <kbd className="px-1.5 py-0.5 bg-cream-200 rounded text-sm">Space</kbd> to move to the next word — a typo
            won&apos;t throw off the rest.
          </p>
          <button
            ref={readyButtonRef}
            onClick={handleStartGame}
            className="btn-butter text-xl px-10 py-4 lowercase animate-pulse"
          >
            press Enter or click to start ⏱️
          </button>
          <p className="text-warm-400 text-sm mt-4">
            tip: press Enter on your keyboard for fastest start
          </p>
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="text-center text-peach-600 p-4">
        no words to type — skip this prompt or try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-4 border border-cream-200">
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">{playerTeam === 'boys' ? '💙' : '💗'}</span>
          <span className="text-xl font-bold text-warm-700">{playerName}</span>
          <span className="text-warm-500 lowercase">{isComplete ? 'finished!' : 'is typing'}</span>
        </div>
        {startTime && (
          <div
            className={`text-center mt-2 text-lg font-mono ${isComplete ? 'text-mint-600 font-bold' : 'text-lavender-600'}`}
          >
            {formatElapsedTime(isComplete && finalTimeMs ? finalTimeMs : elapsedTime)}
            {isComplete && ' ✓ recorded!'}
          </div>
        )}
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft-xl p-6 border-2 border-sky-200">
        <div className="mb-4">
          <div className="text-sm text-warm-500 mb-3 lowercase text-center">
            type each word below; press Space to commit and go to the next word (backspace only edits this word).
          </div>
          <div className="text-lg font-mono text-warm-700 leading-relaxed mb-4 p-4 bg-cream-50 rounded-xl border border-cream-200 max-h-48 overflow-y-auto">
            {renderPrompt()}
          </div>
        </div>
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value.replace(/\s/g, ''))}
          onKeyDown={handleWordInputKeyDown}
          onPaste={handlePaste}
          disabled={isComplete}
          className="w-full px-4 py-3 text-lg font-mono border-2 border-sky-300 rounded-xl focus:outline-none focus:border-sky-500"
          placeholder="current word…"
          aria-label="Type the current word, then press Space"
        />
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-warm-500">
          <span>
            word {Math.min(wordIndex + 1, words.length)} / {words.length}
          </span>
          <span>
            {currentInput.length} / {words[wordIndex]?.length ?? 0} chars in this word
          </span>
        </div>
        {isComplete && (
          <div className="mt-4 text-center text-mint-600 font-bold text-lg">
            ✓ Complete!
          </div>
        )}
      </div>
    </div>
  );
}

// Trivia Game Component — one player, 60s round; score = correct answers (like charades / memory flow)
function TriviaGame({
  question,
  onAnswer,
}: {
  question: TriviaQuestion;
  onAnswer: (correct: boolean) => void;
}) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (optionIndex: number) => {
    if (answered) return;
    setSelectedOption(optionIndex);
    setAnswered(true);
    const isCorrect = optionIndex === question.answer;
    setTimeout(() => {
      onAnswer(isCorrect);
      setSelectedOption(null);
      setAnswered(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft-xl p-8 border-2 border-lavender-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs bg-lavender-200 text-lavender-700 px-3 py-1 rounded-full lowercase">
            {question.category}
          </span>
        </div>
        <h3 className="text-xl font-bold text-warm-700 mb-6">{question.question}</h3>
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrect = index === question.answer;
            const showResult = answered;
            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={answered}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  showResult && isCorrect
                    ? 'bg-mint-200 border-2 border-mint-500'
                    : showResult && isSelected && !isCorrect
                    ? 'bg-peach-200 border-2 border-peach-500'
                    : isSelected
                    ? 'bg-lavender-200 border-2 border-lavender-500'
                    : 'bg-cream-100 border-2 border-cream-300 hover:border-lavender-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-warm-700">{String.fromCharCode(65 + index)}.</span>
                  <span className="text-warm-700">{option}</span>
                  {showResult && isCorrect && <span className="ml-auto text-mint-600">✓</span>}
                  {showResult && isSelected && !isCorrect && <span className="ml-auto text-peach-600">✗</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// YouTube embed (plain iframe — avoids IFrame API + React Strict Mode races in dev)

type SongGamePhase = 'idle' | 'playing';
type GameType = 'charades' | 'song' | 'typing' | 'trivia' | 'memory' | 'manual' | 'speed_drawing' | null;

/** Shuffle and take up to `count` unique words from pool. */
function pickRandomWords(pool: string[], count: number): string[] {
  if (pool.length === 0) return [];
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function YouTubePlayer({ videoId, startTime = 0 }: { videoId: string; startTime?: number }) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    setIframeLoaded(false);
  }, [videoId, startTime]);

  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    controls: '1',
    fs: '1',
    ...(startTime > 0 ? { start: String(Math.floor(startTime)) } : {}),
  });
  const embedSrc = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

  return (
    <div className="relative space-y-4">
      <div className="w-full max-w-md mx-auto rounded-xl overflow-hidden border border-cream-200 bg-black shadow-soft min-w-0 aspect-video relative">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-warm-400 text-sm z-10 pointer-events-none">
            Loading video…
          </div>
        )}
        <iframe
          key={`${videoId}-${startTime}`}
          title="Song clip"
          className="absolute inset-0 h-full w-full"
          src={embedSrc}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
      <p className="text-center text-xs text-warm-500 max-w-md mx-auto">
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 font-medium underline"
        >
          Open on YouTube
        </a>
        {' '}
        if the embedded player does not load.
      </p>
      {iframeLoaded && (
        <p className="text-center text-sm text-warm-500 lowercase">
          use the youtube controls to play, pause, or seek whenever you like
        </p>
      )}
    </div>
  );
}

// Song Guessing Game — YouTube clip + host picks which team got title & artist right
function SongGame({
  song,
  onRoundComplete,
  teamScore,
  onNextSong
}: {
  song: Song;
  onRoundComplete: (winningTeam: 'boys' | 'girls' | null) => void;
  teamScore: { boys: number; girls: number };
  onNextSong: () => void;
}) {
  const [phase, setPhase] = useState<SongGamePhase>('idle');
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setShowAnswer(false);
  }, [song.youtubeId]);

  const startPlaying = () => {
    setPhase('playing');
  };

  const awardPoint = (team: 'boys' | 'girls') => {
    onRoundComplete(team);
  };

  const handleNextSong = () => {
    setShowAnswer(false);
    onNextSong();
    setPhase('playing');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-4 border border-cream-200">
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-sky-500">{teamScore.boys}</div>
            <div className="text-sm text-warm-500">Team Boys 💙</div>
          </div>
          <div className="text-2xl text-warm-300 self-center">vs</div>
          <div className="text-center">
            <div className="text-3xl font-bold text-peach-500">{teamScore.girls}</div>
            <div className="text-sm text-warm-500">Team Girls 💗</div>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft-xl p-8 border-2 border-sky-200">
        {phase === 'idle' && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎵</div>
            <h3 className="text-xl font-bold text-warm-700 mb-4 lowercase">ready to play?</h3>
            <p className="text-warm-500 mb-6">
              the host controls play and pause on the video. when a team names the correct song title and artist,
              tap their button to give them a point. keep going until you are done!
            </p>
            <button
              onClick={startPlaying}
              className="btn-butter text-lg px-8 py-4 lowercase"
            >
              show video 🎶
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div className="text-center space-y-6">
            <div className="text-5xl mb-2">🎧</div>
            <h3 className="text-xl font-bold text-warm-700 mb-2 lowercase">guess the song</h3>
            <YouTubePlayer key={song.youtubeId} videoId={song.youtubeId} startTime={song.startTime || 0} />

            <p className="text-warm-600 text-sm max-w-md mx-auto">
              which team said the correct <strong className="font-semibold">title</strong> and{' '}
              <strong className="font-semibold">artist</strong>?
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch max-w-lg mx-auto">
              <button
                type="button"
                onClick={() => awardPoint('boys')}
                className="btn-sky text-lg px-6 py-4 flex-1 lowercase"
              >
                💙 team boys +1
              </button>
              <button
                type="button"
                onClick={() => awardPoint('girls')}
                className="btn-peach text-lg px-6 py-4 flex-1 lowercase"
              >
                💗 team girls +1
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
              <button
                type="button"
                onClick={() => setShowAnswer((v) => !v)}
                className="btn-spring bg-cream-200 text-warm-600 text-sm px-6 py-2 lowercase"
              >
                {showAnswer ? 'hide answer' : 'show answer'}
              </button>
              <button type="button" onClick={handleNextSong} className="btn-butter text-lg px-8 py-3 lowercase">
                next song 🎵
              </button>
            </div>

            {showAnswer && (
              <div className="bg-cream-100 rounded-2xl p-5 max-w-md mx-auto text-center border border-cream-200">
                <div className="text-xl font-bold text-warm-700 mb-1">{song.title}</div>
                <div className="text-warm-500">by {song.artist}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Memory Game Component
function MemoryGame({
  theme,
  themeLabel,
  visualVariantIndex,
  roundKey,
  onComplete,
}: {
  theme: string[];
  themeLabel?: string;
  visualVariantIndex: number;
  roundKey: number;
  onComplete: (moves: number, timeMs: number) => void;
}) {
  const [cards, setCards] = useState<MemoryCell[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isPreviewFlash, setIsPreviewFlash] = useState(true);

  const variant = MEMORY_CARD_VARIANTS[visualVariantIndex % MEMORY_CARD_VARIANTS.length];

  useEffect(() => {
    const deck = shuffleMemoryDeck(theme);
    setCards(deck);
    setFlippedCards([]);
    setMoves(0);
    setIsComplete(false);
    setStartTime(null);
    setIsPreviewFlash(true);

    const t = window.setTimeout(() => {
      setIsPreviewFlash(false);
      setStartTime(Date.now());
    }, MEMORY_PREVIEW_MS);

    return () => window.clearTimeout(t);
  }, [theme, roundKey]);

  useEffect(() => {
    if (isPreviewFlash || flippedCards.length !== 2) return;
    const [first, second] = flippedCards;
    const a = cards[first];
    const b = cards[second];
    if (!(a && b && a.kind === 'card' && b.kind === 'card')) {
      setFlippedCards([]);
      return;
    }
    if (a.emoji === b.emoji) {
      setCards((prev) =>
        prev.map((cell, i) =>
          i === first || i === second
            ? cell.kind === 'card'
              ? { ...cell, matched: true, flipped: false }
              : cell
            : cell
        )
      );
      setMoves((prev) => prev + 1);
      setFlippedCards([]);
    } else {
      setTimeout(() => {
        setCards((prev) =>
          prev.map((cell, i) =>
            flippedCards.includes(i) && cell.kind === 'card'
              ? { ...cell, flipped: false }
              : cell
          )
        );
        setFlippedCards([]);
        setMoves((prev) => prev + 1);
      }, 1000);
    }
  }, [flippedCards, cards, isPreviewFlash]);

  useEffect(() => {
    if (isPreviewFlash || startTime === null) return;
    const playing = cards.filter((c) => c.kind === 'card');
    if (
      cards.length > 0 &&
      playing.length > 0 &&
      playing.every((c) => c.matched) &&
      !isComplete
    ) {
      setIsComplete(true);
      const timeMs = Date.now() - startTime;
      onComplete(moves, timeMs);
    }
  }, [cards, moves, startTime, onComplete, isComplete, isPreviewFlash]);

  const handleCardClick = (index: number) => {
    const cell = cards[index];
    if (!cell || cell.kind === 'empty') return;
    if (isPreviewFlash) return;
    if (cell.flipped || cell.matched || flippedCards.length === 2 || isComplete) return;

    setCards((prev) =>
      prev.map((c, i) =>
        i === index && c.kind === 'card' ? { ...c, flipped: true } : c
      )
    );
    setFlippedCards((prev) => [...prev, index]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft-xl p-6 border-2 border-butter-200">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div className="text-sm text-warm-500 lowercase">
            moves: <span className="font-bold text-warm-700">{moves}</span>
          </div>
          {themeLabel ? (
            <div className="text-xs font-medium text-warm-500 lowercase px-2 py-1 rounded-full bg-cream-100 border border-cream-200">
              deck: {themeLabel}
            </div>
          ) : null}
          {isPreviewFlash && (
            <div className="text-xs font-semibold text-lavender-600 lowercase animate-pulse">
              peek! full board shows, then cards hide…
            </div>
          )}
          {isComplete && (
            <div className="text-mint-600 font-bold">🎉 Complete!</div>
          )}
        </div>
        {cards.length === 0 ? (
          <p className="text-peach-600 text-sm text-center">
            each memory deck needs at least {MEMORY_PAIR_COUNT} emojis in data/prompts.json.
          </p>
        ) : (
          <div className="grid grid-cols-5 gap-2 sm:gap-3 w-full max-w-md mx-auto">
            {cards.map((cell, index) =>
              cell.kind === 'empty' ? (
                <div
                  key={index}
                  className="aspect-square rounded-xl border-2 border-dashed border-cream-300 bg-cream-50/80 pointer-events-none flex items-center justify-center text-cream-400 text-lg"
                  aria-hidden
                >
                  ·
                </div>
              ) : (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleCardClick(index)}
                  disabled={cell.matched || isComplete || isPreviewFlash}
                  className={`aspect-square border-2 flex items-center justify-center transition-all text-2xl sm:text-3xl ${variant.card} ${
                    cell.matched
                      ? variant.matched
                      : isPreviewFlash || cell.flipped
                        ? variant.flipped
                        : variant.back
                  }`}
                >
                  <span
                    className={
                      isPreviewFlash || cell.flipped || cell.matched
                        ? 'leading-none'
                        : 'text-warm-500 font-semibold text-lg sm:text-xl'
                    }
                  >
                    {isPreviewFlash || cell.flipped || cell.matched ? cell.emoji : variant.faceDown}
                  </span>
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
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
  const [currentTrivia, setCurrentTrivia] = useState<TriviaQuestion | null>(null);
  const [currentTypingText, setCurrentTypingText] = useState<string>('');
  const [currentMemoryTheme, setCurrentMemoryTheme] = useState<string[]>([]);
  const [currentMemoryThemeLabel, setCurrentMemoryThemeLabel] = useState<string | null>(null);
  const [memoryVisualVariant, setMemoryVisualVariant] = useState(0);
  const [memoryRoundKey, setMemoryRoundKey] = useState(0);
  const [gameType, setGameType] = useState<GameType>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [typingScore, setTypingScore] = useState<{ wpm: number; accuracy: number; timeMs: number } | null>(null);
  // Typing game multi-player state
  const [typingGamePhase, setTypingGamePhase] = useState<TypingGamePhase>('setup');
  const [currentTypingPlayerId, setCurrentTypingPlayerId] = useState<number | null>(null);
  const [typingPlayersCompleted, setTypingPlayersCompleted] = useState<Record<number, TypingPlayerResult>>({});
  const [songScore, setSongScore] = useState({ boys: 0, girls: 0 });
  /** True after host clicks "finish game" for song mode — avoids showing game-over on initial load. */
  const [songSessionEnded, setSongSessionEnded] = useState(false);
  const [memoryScore, setMemoryScore] = useState<{ moves: number; timeMs: number } | null>(null);
  const [manualScore, setManualScore] = useState({
    userId: '' as string,
    points: '',
    timeSeconds: '',
    notes: '',
  });
  const [isSavingScore, setIsSavingScore] = useState(false);
  /** Who this round's score is saved under (charades, memory, trivia). */
  const [sessionScoreUserId, setSessionScoreUserId] = useState<number | null>(null);
  /** DB user id for team boys score rows (song). */
  const [sessionBoysUserId, setSessionBoysUserId] = useState<number | null>(null);
  /** DB user id for team girls score rows (song). */
  const [sessionGirlsUserId, setSessionGirlsUserId] = useState<number | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [typingPrompts, setTypingPrompts] = useState<string[]>([]);
  const [triviaQuestions, setTriviaQuestions] = useState<TriviaQuestion[]>([]);
  const [memoryThemes, setMemoryThemes] = useState<Record<string, string[]>>({});
  const [speedDrawingPool, setSpeedDrawingPool] = useState<string[]>([]);
  const [drawingRoundWords, setDrawingRoundWords] = useState<string[]>([]);
  const [drawingWordsHidden, setDrawingWordsHidden] = useState(false);
  const [usedPrompts, setUsedPrompts] = useState<Set<number>>(new Set());
  const [usedSongs, setUsedSongs] = useState<Set<number>>(new Set());
  const [usedTyping, setUsedTyping] = useState<Set<number>>(new Set());
  const [usedTrivia, setUsedTrivia] = useState<Set<number>>(new Set());
  const [usedMemory, setUsedMemory] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGame();
    loadPrompts();
  }, [gameId]);

  useEffect(() => {
    setSessionScoreUserId(null);
    setSessionBoysUserId(null);
    setSessionGirlsUserId(null);
  }, [gameId]);

  useEffect(() => {
    if (gameType === 'speed_drawing' && speedDrawingPool.length > 0) {
      setDrawingRoundWords(pickRandomWords(speedDrawingPool, 25));
    }
  }, [gameType, speedDrawingPool]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    // Song game handles its own timing via YouTube player
    if (isRunning && timeLeft > 0 && gameType !== 'typing' && gameType !== 'memory' && gameType !== 'song' && gameType !== 'speed_drawing') {
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
  }, [isRunning, timeLeft, gameType]);

  const loadGame = async () => {
    try {
      const storedEventId = localStorage.getItem('eventId');
      if (!storedEventId) {
        router.push('/');
        return;
      }

      let parsedEventId = parseInt(storedEventId, 10);
      setEventId(parsedEventId);
      let res = await fetch(`/api/games?eventId=${parsedEventId}`);
      if (res.status === 404) {
        parsedEventId = await initDefaultEventAndStore();
        setEventId(parsedEventId);
        res = await fetch(`/api/games?eventId=${parsedEventId}`);
      }
      const games = await res.json();
      const gameData = Array.isArray(games) ? games.find((g: Game) => g.id === gameId) : undefined;
      
      if (gameData) {
        setGame(gameData);
        const name = gameData.name.toLowerCase();
        if (name.includes('charade')) {
          setGameType('charades');
        } else if (name.includes('speed drawing')) {
          setGameType('speed_drawing');
        } else if (name.includes('song') || name.includes('guess')) {
          setGameType('song');
        } else if (name.includes('typer') || name.includes('typing')) {
          setGameType('typing');
        } else if (name.includes('trivia') || name.includes('quiz')) {
          setGameType('trivia');
        } else if (name.includes('memory') || name.includes('match')) {
          setGameType('memory');
        } else if (name.includes('relay') || name.includes('4x400') || 
                   name.includes('puzzle') || 
                   name.includes('beer pong') || name.includes('pong') ||
                   (name.includes('egg') && name.includes('carton'))) {
          setGameType('manual');
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
      setTypingPrompts(data.typing || []);
      setTriviaQuestions(data.trivia || []);
      setMemoryThemes(data.memory || {});
      setSpeedDrawingPool(data.charades || []);
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
    } else if (gameType === 'typing' && typingPrompts.length > 0) {
      let available = typingPrompts.map((_, i) => i).filter(i => !usedTyping.has(i));
      if (available.length === 0) {
        available = typingPrompts.map((_, i) => i);
        setUsedTyping(new Set());
      }
      const index = available[Math.floor(Math.random() * available.length)];
      setUsedTyping(new Set([...usedTyping, index]));
      return typingPrompts[index];
    } else if (gameType === 'trivia' && triviaQuestions.length > 0) {
      let available = triviaQuestions.map((_, i) => i).filter(i => !usedTrivia.has(i));
      if (available.length === 0) {
        available = triviaQuestions.map((_, i) => i);
        setUsedTrivia(new Set());
      }
      const index = available[Math.floor(Math.random() * available.length)];
      setUsedTrivia(new Set([...usedTrivia, index]));
      return triviaQuestions[index];
    } else if (gameType === 'memory') {
      const themes = Object.keys(memoryThemes).filter(t => !usedMemory.has(t));
      if (themes.length === 0) {
        const allThemes = Object.keys(memoryThemes);
        setUsedMemory(new Set());
        if (allThemes.length > 0) {
          const theme = allThemes[Math.floor(Math.random() * allThemes.length)];
          setUsedMemory(new Set([theme]));
          return { theme, emojis: memoryThemes[theme] };
        }
      } else {
        const theme = themes[Math.floor(Math.random() * themes.length)];
        setUsedMemory(new Set([...usedMemory, theme]));
        return { theme, emojis: memoryThemes[theme] };
      }
    }
    return null;
  };

  const startGame = () => {
    if (gameType === 'charades' || gameType === 'memory' || gameType === 'trivia') {
      if (sessionScoreUserId == null) return;
    }
    if (gameType === 'song') {
      if (
        sessionBoysUserId == null ||
        sessionGirlsUserId == null ||
        sessionBoysUserId === sessionGirlsUserId
      ) {
        return;
      }
    }
    setIsRunning(true);
    setTimeLeft(60);
    setScore({ correct: 0, incorrect: 0 });
    setTypingScore(null);
    setSongScore({ boys: 0, girls: 0 });
    setSongSessionEnded(false);
    setMemoryScore(null);
    nextPrompt();
  };

  const nextPrompt = () => {
    if (gameType === 'charades') {
      const prompt = getRandomPrompt();
      if (prompt) setCurrentPrompt(prompt as string);
    } else if (gameType === 'song') {
      const song = getRandomPrompt();
      if (song) setCurrentSong(song as Song);
    } else if (gameType === 'typing') {
      const text = getRandomPrompt();
      if (text) setCurrentTypingText(text as string);
    } else if (gameType === 'trivia') {
      const question = getRandomPrompt();
      if (question) setCurrentTrivia(question as TriviaQuestion);
    } else if (gameType === 'memory') {
      const result = getRandomPrompt();
      if (result && typeof result === 'object' && 'emojis' in result && 'theme' in result) {
        setCurrentMemoryThemeLabel(
          String(result.theme).replace(/_/g, ' ').toLowerCase()
        );
        setMemoryVisualVariant(Math.floor(Math.random() * MEMORY_CARD_VARIANTS.length));
        setMemoryRoundKey((k) => k + 1);
        setCurrentMemoryTheme(result.emojis as string[]);
      }
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

  const handleTypingComplete = (wpm: number, accuracy: number, timeMs: number) => {
    setTypingScore({ wpm, accuracy, timeMs });
    setIsRunning(false);
  };

  const handleTriviaAnswer = (correct: boolean) => {
    if (correct) {
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }
    nextPrompt();
  };

  const handleMemoryComplete = (moves: number, timeMs: number) => {
    setMemoryScore({ moves, timeMs });
    setIsRunning(false);
  };

  const handleManualScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !game || !manualScore.userId) return;

    const userIdNum = parseInt(manualScore.userId, 10);
    if (isNaN(userIdNum)) return;

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
          userId: userIdNum,
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

  const handleSaveMemoryScore = async () => {
    if (!eventId || !game || !memoryScore || sessionScoreUserId == null) return;

    setIsSavingScore(true);
    try {
      const { total, movePts, timeBonus } = memoryScoreBreakdown(
        memoryScore.moves,
        memoryScore.timeMs
      );
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          gameId: game.id,
          userId: sessionScoreUserId,
          points: total,
          timeMs: memoryScore.timeMs,
          notes: `${memoryScore.moves} moves · ${(memoryScore.timeMs / 1000).toFixed(1)}s · ${movePts} + ${timeBonus} speed`,
        }),
      });

      if (res.ok) {
        setMemoryScore(null);
        setIsRunning(false);
        setTimeLeft(60);
      }
    } catch (error) {
      console.error('Failed to save score:', error);
    } finally {
      setIsSavingScore(false);
    }
  };

  const handleSaveCharadesScore = async () => {
    if (!eventId || !game || sessionScoreUserId == null) return;

    setIsSavingScore(true);
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          gameId: game.id,
          userId: sessionScoreUserId,
          points: score.correct,
          timeMs: 60000, // 60 second game
          notes: `${score.correct} correct, ${score.incorrect} skipped`,
        }),
      });

      if (res.ok) {
        // Reset to allow another round
        setScore({ correct: 0, incorrect: 0 });
        setTimeLeft(60);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to save charades score:', err);
      }
    } catch (error) {
      console.error('Failed to save score:', error);
    } finally {
      setIsSavingScore(false);
    }
  };

  const handleSaveTriviaScore = async () => {
    if (!eventId || !game || sessionScoreUserId == null) return;

    setIsSavingScore(true);
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          gameId: game.id,
          userId: sessionScoreUserId,
          points: score.correct,
          timeMs: 60000,
          notes: `${score.correct} correct, ${score.incorrect} wrong`,
        }),
      });

      if (res.ok) {
        setScore({ correct: 0, incorrect: 0 });
        setTimeLeft(60);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to save trivia score:', err);
      }
    } catch (error) {
      console.error('Failed to save trivia score:', error);
    } finally {
      setIsSavingScore(false);
    }
  };

  const handleSaveSongScores = async () => {
    if (!eventId || !game || sessionBoysUserId == null || sessionGirlsUserId == null) return;

    setIsSavingScore(true);
    try {
      // Save boys team score
      if (songScore.boys > 0) {
        await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            gameId: game.id,
            userId: sessionBoysUserId,
            points: songScore.boys,
            notes: `Team Boys: ${songScore.boys} songs guessed correctly`,
          }),
        });
      }

      // Save girls team score
      if (songScore.girls > 0) {
        await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            gameId: game.id,
            userId: sessionGirlsUserId,
            points: songScore.girls,
            notes: `Team Girls: ${songScore.girls} songs guessed correctly`,
          }),
        });
      }

      // Reset for next round
      setSongScore({ boys: 0, girls: 0 });
      setIsRunning(false);
    } catch (error) {
      console.error('Failed to save song scores:', error);
    } finally {
      setIsSavingScore(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGameDescription = () => {
    switch (gameType) {
      case 'charades':
        return 'act out the prompts! you have 60 seconds ⏱️';
      case 'song':
        return 'play the youtube clip, pause or seek as needed — award a point to the team that gets title + artist right! 🎵';
      case 'typing':
        return 'type the paragraph — team winner is highest average WPM (same rule as the leaderboard). ⚡';
      case 'trivia':
        return 'answer as many questions as you can in 60 seconds — your score is how many you get right! 🧠';
      case 'memory':
        return '5×5 grid — 12 pairs; free space stays in the center. match them all! 🧩';
      case 'manual':
        return 'play this game outside the app and record scores here! 📝';
      case 'speed_drawing':
        return '25 numbered words — sketch to remember, then guess which number was what! ✏️';
      default:
        return 'let\'s play! 🎮';
    }
  };

  const getManualGameEmoji = () => {
    if (!game) return '🎮';
    const name = game.name.toLowerCase();
    if (name.includes('relay') || name.includes('4x400')) return '🏃';
    if (name.includes('puzzle')) return '🧩';
    if (name.includes('egg') && name.includes('carton')) return '🥚';
    if (name.includes('pong') || name.includes('beer')) return '🍺';
    return '🎯';
  };

  const getManualGameInstructions = () => {
    if (!game) return [];
    const name = game.name.toLowerCase();
    if (name.includes('flip cup')) {
      return [
        'Teams run the flip cup relay head-to-head',
        'Decide how you want to count points, such as successful flips or relay wins',
        'Add up each team\'s total points',
        'Record the final score below'
      ];
    }
    if (name.includes('relay') || name.includes('4x400')) {
      return [
        'Each team runs a 4x400m relay race',
        'Time starts when first runner begins',
        'Time stops when last runner crosses finish',
        'Record the total time for each team'
      ];
    }
    if (name.includes('puzzle')) {
      return [
        'Each team works together to complete a 500-piece puzzle',
        'Start the timer when you begin',
        'Stop when the puzzle is complete',
        'Record the completion time for each team'
      ];
    }
    if (name.includes('egg') && name.includes('carton')) {
      return [
        'Each team bounces ping pong balls into an egg carton — count how many land in the slots',
        'Agree on scoring (e.g. 1 point per ball, or total balls in the carton)',
        'Highest score wins — enter each player\'s points below'
      ];
    }
    if (name.includes('pong') || name.includes('beer')) {
      return [
        'Standard beer pong rules apply',
        'Teams compete head-to-head',
        'Winner gets the points',
        'Record cups remaining or final score'
      ];
    }
    return ['Play the game outside the app', 'Record scores when finished'];
  };

  const handleSongRoundComplete = (winningTeam: 'boys' | 'girls' | null) => {
    if (winningTeam) {
      setSongScore(prev => ({
        ...prev,
        [winningTeam]: prev[winningTeam] + 1
      }));
    }
  };

  // Typing game multi-player helpers
  const getTypingTeamUsers = (team: 'boys' | 'girls') => {
    return users.filter(u => u.team === team);
  };

  const getTypingNoTeamUsers = () => users.filter((u) => !u.team);

  /** Everyone who must finish a typing turn (team players if any, else all players). */
  const getTypingParticipants = () => {
    const withTeam = users.filter((u) => u.team === 'boys' || u.team === 'girls');
    return withTeam.length > 0 ? withTeam : users;
  };

  const hasTypingTeamPlayers = () =>
    users.some((u) => u.team === 'boys' || u.team === 'girls');

  /** Average WPM among teammates who finished (matches leaderboard team rule: avg_points on WPM). */
  const getTypingTeamAvgWpm = (team: 'boys' | 'girls'): number | null => {
    const teamUsers = getTypingTeamUsers(team);
    const done = teamUsers.filter((u) => typingPlayersCompleted[u.id]);
    if (done.length === 0) return null;
    return done.reduce((sum, u) => sum + typingPlayersCompleted[u.id].wpm, 0) / done.length;
  };

  const getTypingTeamCompletedCount = (team: 'boys' | 'girls') => {
    return getTypingTeamUsers(team).filter(u => typingPlayersCompleted[u.id] !== undefined).length;
  };

  const isTypingPlayerCompleted = (userId: number) => {
    return typingPlayersCompleted[userId] !== undefined;
  };

  const getAllTypingPlayersCompleted = () => {
    const participants = getTypingParticipants();
    return (
      participants.length > 0 &&
      participants.every((u) => typingPlayersCompleted[u.id] !== undefined)
    );
  };
  
  const getCompletedPlayersCount = () => {
    return Object.keys(typingPlayersCompleted).length;
  };

  const startTypingForPlayer = (userId: number) => {
    setCurrentTypingPlayerId(userId);
    setTypingGamePhase('playing');
    // Get a random prompt for this player
    const text = getRandomPrompt();
    if (text) setCurrentTypingText(text as string);
  };

const handleTypingPlayerComplete = async (wpm: number, accuracy: number, timeMs: number) => {
    if (!currentTypingPlayerId || !eventId || !game) return;

    const playerId = currentTypingPlayerId;
    
    // Save to local state immediately
    setTypingPlayersCompleted(prev => ({
      ...prev,
      [playerId]: { timeMs, wpm, accuracy }
    }));

    // Save to database
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          gameId: game.id,
          userId: playerId,
          points: wpm,
          timeMs,
          notes: `${accuracy}% accuracy`,
        }),
      });
    } catch (error) {
      console.error('Failed to save typing score:', error);
    }

    // Check if all players completed
    const allPlayers = getTypingParticipants();
    const completedCount = Object.keys(typingPlayersCompleted).length + 1; // +1 for current player

    if (allPlayers.length > 0 && completedCount >= allPlayers.length) {
      // All players done - show results
      setTimeout(() => {
        setTypingGamePhase('results');
        setCurrentTypingPlayerId(null);
      }, 1500);
    } else {
      // Return to setup for next player
      setTimeout(() => {
        setTypingGamePhase('setup');
        setCurrentTypingPlayerId(null);
        setCurrentTypingText('');
      }, 1500);
    }
  };

  const resetTypingGame = () => {
    setTypingGamePhase('setup');
    setCurrentTypingPlayerId(null);
    setTypingPlayersCompleted({});
    setCurrentTypingText('');
    setUsedTyping(new Set());
  };

  const formatTimeMs = (ms: number) => {
    const seconds = (ms / 1000).toFixed(2);
    return `${seconds}s`;
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-[#FDF6E9] flex items-center justify-center relative overflow-hidden">
        {/* Decorative elements for not-found state */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-8 left-8">
            <svg width="50" height="50" viewBox="0 0 50 50" className="opacity-60">
              <circle cx="25" cy="10" r="8" fill="#FFB5BA" />
              <circle cx="38" cy="20" r="8" fill="#FFB5BA" />
              <circle cx="35" cy="35" r="8" fill="#FFB5BA" />
              <circle cx="15" cy="35" r="8" fill="#FFB5BA" />
              <circle cx="12" cy="20" r="8" fill="#FFB5BA" />
              <circle cx="25" cy="23" r="10" fill="#FFD4D8" />
              <circle cx="22" cy="21" r="2" fill="#333" />
              <circle cx="28" cy="21" r="2" fill="#333" />
              <path d="M 23 26 Q 25 28 27 26" stroke="#333" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <div className="absolute top-12 right-12">
            <svg width="60" height="35" viewBox="0 0 60 35" className="opacity-50">
              <ellipse cx="20" cy="20" rx="15" ry="10" fill="#D4EDE1" />
              <ellipse cx="35" cy="18" rx="18" ry="12" fill="#D4EDE1" />
              <ellipse cx="50" cy="22" rx="12" ry="8" fill="#D4EDE1" />
            </svg>
          </div>
          <div className="absolute bottom-12 left-12">
            <svg width="40" height="50" viewBox="0 0 40 50" className="opacity-50">
              <line x1="15" y1="50" x2="15" y2="30" stroke="#98D4BB" strokeWidth="2" />
              <ellipse cx="12" cy="25" rx="4" ry="8" fill="#98D4BB" transform="rotate(-15 12 25)" />
              <ellipse cx="18" cy="26" rx="4" ry="8" fill="#98D4BB" transform="rotate(15 18 26)" />
            </svg>
          </div>
          <div className="absolute bottom-8 right-8">
            <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-60">
              <ellipse cx="30" cy="40" rx="25" ry="16" fill="#F5F0E1" />
              <ellipse cx="30" cy="36" rx="20" ry="14" fill="#FDFBF5" />
              <ellipse cx="22" cy="15" rx="5" ry="15" fill="#FDFBF5" />
              <ellipse cx="38" cy="15" rx="5" ry="15" fill="#FDFBF5" />
              <ellipse cx="22" cy="17" rx="2.5" ry="8" fill="#FFB5BA" />
              <ellipse cx="38" cy="17" rx="2.5" ry="8" fill="#FFB5BA" />
              <circle cx="25" cy="34" r="2" fill="#333" />
              <circle cx="35" cy="34" r="2" fill="#333" />
              <ellipse cx="30" cy="38" rx="2.5" ry="1.5" fill="#FFB5BA" />
            </svg>
          </div>
        </div>
        <div className="text-center relative z-10">
          <div className="text-4xl mb-4">🌿</div>
          <h1 className="text-xl font-bold text-warm-700 mb-4 lowercase">game not found</h1>
          <Link href="/dashboard" className="btn-sky lowercase">
            back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const memoryBreakdown = memoryScore
    ? memoryScoreBreakdown(memoryScore.moves, memoryScore.timeMs)
    : null;

  return (
    <div className="min-h-screen bg-[#FDF6E9] pb-20 relative overflow-hidden">
      {/* Decorative spring border background - kawaii style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FDF6E9] via-transparent to-[#FDF6E9]" />
        
        {/* Top left - Cat on moon */}
        <div className="absolute top-4 left-4">
          <svg width="80" height="70" viewBox="0 0 80 70" className="opacity-80">
            <ellipse cx="35" cy="45" rx="30" ry="20" fill="#F5DEB3" />
            <ellipse cx="55" cy="30" rx="12" ry="10" fill="#FFB366" />
            <circle cx="52" cy="28" r="1.5" fill="#333" />
            <circle cx="58" cy="28" r="1.5" fill="#333" />
            <path d="M 54 32 Q 56 34 58 32" stroke="#333" strokeWidth="1" fill="none" />
            <path d="M 47 22 L 50 28 L 53 24" fill="#FFB366" />
            <path d="M 57 24 L 60 28 L 63 22" fill="#FFB366" />
            <path d="M 65 35 Q 70 40 68 45" stroke="#FFB366" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        
        {/* Top left flower with face */}
        <div className="absolute top-24 left-8">
          <svg width="50" height="50" viewBox="0 0 50 50" className="opacity-80">
            <circle cx="25" cy="10" r="8" fill="#FFB5BA" />
            <circle cx="38" cy="20" r="8" fill="#FFB5BA" />
            <circle cx="35" cy="35" r="8" fill="#FFB5BA" />
            <circle cx="15" cy="35" r="8" fill="#FFB5BA" />
            <circle cx="12" cy="20" r="8" fill="#FFB5BA" />
            <circle cx="25" cy="23" r="10" fill="#FFD4D8" />
            <circle cx="22" cy="21" r="2" fill="#333" />
            <circle cx="28" cy="21" r="2" fill="#333" />
            <path d="M 23 26 Q 25 28 27 26" stroke="#333" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        
        {/* Top clouds */}
        <div className="absolute top-8 left-1/4">
          <svg width="60" height="35" viewBox="0 0 60 35" className="opacity-60">
            <ellipse cx="20" cy="20" rx="15" ry="10" fill="#D4EDE1" />
            <ellipse cx="35" cy="18" rx="18" ry="12" fill="#D4EDE1" />
            <ellipse cx="50" cy="22" rx="12" ry="8" fill="#D4EDE1" />
          </svg>
        </div>
        
        {/* Top right cloud */}
        <div className="absolute top-12 right-8">
          <svg width="70" height="40" viewBox="0 0 70 40" className="opacity-50">
            <ellipse cx="20" cy="22" rx="16" ry="11" fill="#D4EDE1" />
            <ellipse cx="40" cy="20" rx="20" ry="14" fill="#D4EDE1" />
            <ellipse cx="58" cy="24" rx="14" ry="10" fill="#D4EDE1" />
          </svg>
        </div>
        
        {/* Top right flowers with faces */}
        <div className="absolute top-4 right-1/4">
          <svg width="90" height="40" viewBox="0 0 90 40" className="opacity-70">
            {/* Flower 1 */}
            <circle cx="20" cy="8" r="5" fill="#F5DEB3" />
            <circle cx="28" cy="13" r="5" fill="#F5DEB3" />
            <circle cx="26" cy="23" r="5" fill="#F5DEB3" />
            <circle cx="14" cy="23" r="5" fill="#F5DEB3" />
            <circle cx="12" cy="13" r="5" fill="#F5DEB3" />
            <circle cx="20" cy="15" r="6" fill="#FFE4B5" />
            <circle cx="18" cy="14" r="1" fill="#333" />
            <circle cx="22" cy="14" r="1" fill="#333" />
            <path d="M 19 17 Q 20 18 21 17" stroke="#333" strokeWidth="0.8" fill="none" />
            {/* Flower 2 */}
            <circle cx="50" cy="8" r="5" fill="#F5DEB3" />
            <circle cx="58" cy="13" r="5" fill="#F5DEB3" />
            <circle cx="56" cy="23" r="5" fill="#F5DEB3" />
            <circle cx="44" cy="23" r="5" fill="#F5DEB3" />
            <circle cx="42" cy="13" r="5" fill="#F5DEB3" />
            <circle cx="50" cy="15" r="6" fill="#FFE4B5" />
            <circle cx="48" cy="14" r="1" fill="#333" />
            <circle cx="52" cy="14" r="1" fill="#333" />
            <path d="M 49 17 Q 50 18 51 17" stroke="#333" strokeWidth="0.8" fill="none" />
          </svg>
        </div>
        
        {/* Left side flower with face */}
        <div className="absolute top-1/3 left-2">
          <svg width="45" height="45" viewBox="0 0 45 45" className="opacity-70">
            <circle cx="22" cy="8" r="7" fill="#FFB5BA" />
            <circle cx="34" cy="17" r="7" fill="#FFB5BA" />
            <circle cx="31" cy="31" r="7" fill="#FFB5BA" />
            <circle cx="14" cy="31" r="7" fill="#FFB5BA" />
            <circle cx="10" cy="17" r="7" fill="#FFB5BA" />
            <circle cx="22" cy="20" r="9" fill="#FFD4D8" />
            <circle cx="19" cy="18" r="1.5" fill="#333" />
            <circle cx="25" cy="18" r="1.5" fill="#333" />
            <path d="M 20 23 Q 22 25 24 23" stroke="#333" strokeWidth="1.2" fill="none" />
          </svg>
        </div>
        
        {/* Left side plant */}
        <div className="absolute top-1/2 left-6">
          <svg width="30" height="50" viewBox="0 0 30 50" className="opacity-60">
            <line x1="15" y1="50" x2="15" y2="25" stroke="#7BA887" strokeWidth="2" />
            <ellipse cx="10" cy="20" rx="6" ry="10" fill="#7BA887" transform="rotate(-20 10 20)" />
            <ellipse cx="20" cy="22" rx="6" ry="10" fill="#7BA887" transform="rotate(20 20 22)" />
            <circle cx="15" cy="10" r="6" fill="#FFB366" />
          </svg>
        </div>
        
        {/* Right side flowers */}
        <div className="absolute top-1/3 right-4">
          <svg width="50" height="50" viewBox="0 0 50 50" className="opacity-60">
            <circle cx="25" cy="10" r="8" fill="#FFB5BA" />
            <circle cx="38" cy="20" r="8" fill="#FFB5BA" />
            <circle cx="35" cy="35" r="8" fill="#FFB5BA" />
            <circle cx="15" cy="35" r="8" fill="#FFB5BA" />
            <circle cx="12" cy="20" r="8" fill="#FFB5BA" />
            <circle cx="25" cy="23" r="10" fill="#FFD4D8" />
            <circle cx="22" cy="21" r="2" fill="#333" />
            <circle cx="28" cy="21" r="2" fill="#333" />
            <path d="M 23 26 Q 25 28 27 26" stroke="#333" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        
        {/* Right side plants */}
        <div className="absolute top-1/2 right-8">
          <svg width="40" height="50" viewBox="0 0 40 50" className="opacity-50">
            <line x1="15" y1="50" x2="15" y2="30" stroke="#98D4BB" strokeWidth="2" />
            <ellipse cx="12" cy="25" rx="4" ry="8" fill="#98D4BB" transform="rotate(-15 12 25)" />
            <ellipse cx="18" cy="26" rx="4" ry="8" fill="#98D4BB" transform="rotate(15 18 26)" />
            <line x1="30" y1="50" x2="30" y2="32" stroke="#98D4BB" strokeWidth="2" />
            <ellipse cx="27" cy="28" rx="4" ry="7" fill="#98D4BB" transform="rotate(-15 27 28)" />
            <ellipse cx="33" cy="29" rx="4" ry="7" fill="#98D4BB" transform="rotate(15 33 29)" />
          </svg>
        </div>
        
        {/* Bottom left cute blob */}
        <div className="absolute bottom-4 left-4">
          <svg width="80" height="80" viewBox="0 0 80 80" className="opacity-70">
            <ellipse cx="40" cy="50" rx="35" ry="25" fill="#FFD4D8" />
            <ellipse cx="40" cy="45" rx="30" ry="22" fill="#FFE4E8" />
            <circle cx="30" cy="40" r="3" fill="#333" />
            <circle cx="50" cy="40" r="3" fill="#333" />
            <path d="M 35 50 Q 40 55 45 50" stroke="#333" strokeWidth="2" fill="none" />
            <circle cx="22" cy="48" r="4" fill="#FFB5BA" opacity="0.6" />
            <circle cx="58" cy="48" r="4" fill="#FFB5BA" opacity="0.6" />
          </svg>
        </div>
        
        {/* Bottom center flowers */}
        <div className="absolute bottom-2 left-1/4">
          <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-60">
            <line x1="20" y1="60" x2="20" y2="35" stroke="#7BA887" strokeWidth="2" />
            <ellipse cx="16" cy="30" rx="5" ry="10" fill="#7BA887" transform="rotate(-10 16 30)" />
            <ellipse cx="24" cy="32" rx="5" ry="10" fill="#7BA887" transform="rotate(10 24 32)" />
            <circle cx="20" cy="20" r="8" fill="#FFE4B5" />
            <circle cx="18" cy="18" r="1.5" fill="#333" />
            <circle cx="22" cy="18" r="1.5" fill="#333" />
            <path d="M 18 23 Q 20 25 22 23" stroke="#333" strokeWidth="1" fill="none" />
            <line x1="45" y1="60" x2="45" y2="40" stroke="#7BA887" strokeWidth="2" />
            <ellipse cx="42" cy="36" rx="4" ry="8" fill="#7BA887" transform="rotate(-10 42 36)" />
            <ellipse cx="48" cy="37" rx="4" ry="8" fill="#7BA887" transform="rotate(10 48 37)" />
          </svg>
        </div>
        
        {/* Bottom heart */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
          <svg width="30" height="30" viewBox="0 0 30 30" className="opacity-40">
            <path d="M 15 25 C 5 15 5 5 15 10 C 25 5 25 15 15 25" fill="#FFB5BA" />
          </svg>
        </div>
        
        {/* Bottom right cute bunny */}
        <div className="absolute bottom-4 right-4">
          <svg width="70" height="70" viewBox="0 0 70 70" className="opacity-70">
            <ellipse cx="35" cy="50" rx="28" ry="18" fill="#F5F0E1" />
            <ellipse cx="35" cy="45" rx="22" ry="16" fill="#FDFBF5" />
            <ellipse cx="25" cy="15" rx="6" ry="18" fill="#FDFBF5" />
            <ellipse cx="45" cy="15" rx="6" ry="18" fill="#FDFBF5" />
            <ellipse cx="25" cy="18" rx="3" ry="10" fill="#FFB5BA" />
            <ellipse cx="45" cy="18" rx="3" ry="10" fill="#FFB5BA" />
            <circle cx="28" cy="42" r="3" fill="#333" />
            <circle cx="42" cy="42" r="3" fill="#333" />
            <ellipse cx="35" cy="48" rx="3" ry="2" fill="#FFB5BA" />
            <circle cx="20" cy="50" r="4" fill="#FFB5BA" opacity="0.5" />
            <circle cx="50" cy="50" r="4" fill="#FFB5BA" opacity="0.5" />
          </svg>
        </div>
        
        {/* Bottom right plants */}
        <div className="absolute bottom-2 right-1/4">
          <svg width="50" height="50" viewBox="0 0 50 50" className="opacity-50">
            <line x1="15" y1="50" x2="15" y2="30" stroke="#98D4BB" strokeWidth="2" />
            <ellipse cx="12" cy="25" rx="4" ry="8" fill="#98D4BB" transform="rotate(-15 12 25)" />
            <ellipse cx="18" cy="26" rx="4" ry="8" fill="#98D4BB" transform="rotate(15 18 26)" />
            <line x1="35" y1="50" x2="35" y2="28" stroke="#98D4BB" strokeWidth="2" />
            <ellipse cx="32" cy="23" rx="4" ry="8" fill="#98D4BB" transform="rotate(-15 32 23)" />
            <ellipse cx="38" cy="24" rx="4" ry="8" fill="#98D4BB" transform="rotate(15 38 24)" />
          </svg>
        </div>
        
        {/* Sparkle decorations */}
        <div className="absolute top-40 left-1/4 text-lg opacity-40">✦</div>
        <div className="absolute top-60 right-1/3 text-sm opacity-30">✦</div>
        <div className="absolute bottom-32 left-1/3 text-lg opacity-40">✦</div>
        <div className="absolute top-1/2 right-1/4 text-sm opacity-30">✧</div>
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
        {/* Typing Game - Special Multi-player Flow */}
        {gameType === 'typing' && (
          <>
            {/* Setup Phase - Rules & Player Selection */}
            {typingGamePhase === 'setup' && (
              <>
                {users.length === 0 && (
                  <div className="bg-peach-50 border border-peach-200 rounded-2xl p-4 text-center text-peach-800 text-sm mb-4">
                    add players on the host page first. each person then taps &quot;start typing&quot; for their turn.
                  </div>
                )}
                {/* Game Rules */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 border border-cream-200">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-3">⌨️</div>
                    <h2 className="text-2xl font-bold text-warm-700 lowercase">typing race</h2>
                  </div>
                  <div className="bg-cream-50 rounded-2xl p-4 border border-cream-200">
                    <h3 className="font-bold text-warm-700 mb-3 lowercase">how to play:</h3>
                    <ol className="space-y-2 text-warm-600 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="bg-lavender-200 text-lavender-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        <span>each team member takes a turn typing the paragraph</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-lavender-200 text-lavender-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        <span>type as fast and accurately as you can</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-lavender-200 text-lavender-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        <span>when you finish, we save WPM (points), completion time, and accuracy in notes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-lavender-200 text-lavender-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                        <span>each team&apos;s score is the average WPM of everyone who played</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-lavender-200 text-lavender-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
                        <span>higher average WPM wins — same rule as the team leaderboard</span>
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Team progress: turns done + running avg WPM (leaderboard uses avg WPM per team) */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-4 border border-cream-200">
                  <div className="flex justify-center gap-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-sky-500">
                        {getTypingTeamCompletedCount('boys')}/{getTypingTeamUsers('boys').length}
                      </div>
                      <div className="text-sm text-warm-500">Team Boys 💙</div>
                      {getTypingTeamAvgWpm('boys') != null && (
                        <div className="text-xs text-sky-600 font-mono mt-1">
                          {getTypingTeamAvgWpm('boys')!.toFixed(1)} avg wpm
                        </div>
                      )}
                    </div>
                    <div className="text-xl text-warm-300 self-center">vs</div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-peach-500">
                        {getTypingTeamCompletedCount('girls')}/{getTypingTeamUsers('girls').length}
                      </div>
                      <div className="text-sm text-warm-500">Team Girls 💗</div>
                      {getTypingTeamAvgWpm('girls') != null && (
                        <div className="text-xs text-peach-600 font-mono mt-1">
                          {getTypingTeamAvgWpm('girls')!.toFixed(1)} avg wpm
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Player Selection by Team */}
                <div className="space-y-4">
                  {/* Team Boys */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft p-5 border border-sky-200">
                    <h3 className="text-lg font-bold text-sky-600 mb-3 flex items-center gap-2">
                      💙 Team Boys
                    </h3>
                    <div className="space-y-2">
                      {getTypingTeamUsers('boys').length === 0 ? (
                        <p className="text-warm-400 text-sm italic">no players on this team</p>
                      ) : (
                        getTypingTeamUsers('boys').map(user => {
                          const result = typingPlayersCompleted[user.id];
                          const isCompleted = !!result;
                          return (
                            <div
                              key={user.id}
                              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                                isCompleted
                                  ? 'bg-mint-100 border border-mint-300'
                                  : 'bg-cream-50 border border-cream-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{isCompleted ? '✅' : '⏳'}</span>
                                <span className="font-medium text-warm-700">
                                  {user.nickname || user.name}
                                </span>
                              </div>
                              {isCompleted ? (
                                <div className="text-right">
                                  <div className="text-sm font-mono text-mint-700">{formatTimeMs(result.timeMs)}</div>
                                  <div className="text-xs text-warm-500">{result.wpm} WPM</div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startTypingForPlayer(user.id)}
                                  className="btn-sky text-sm px-4 py-2"
                                >
                                  start typing
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Team Girls */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft p-5 border border-peach-200">
                    <h3 className="text-lg font-bold text-peach-600 mb-3 flex items-center gap-2">
                      💗 Team Girls
                    </h3>
                    <div className="space-y-2">
                      {getTypingTeamUsers('girls').length === 0 ? (
                        <p className="text-warm-400 text-sm italic">no players on this team</p>
                      ) : (
                        getTypingTeamUsers('girls').map(user => {
                          const result = typingPlayersCompleted[user.id];
                          const isCompleted = !!result;
                          return (
                            <div
                              key={user.id}
                              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                                isCompleted
                                  ? 'bg-mint-100 border border-mint-300'
                                  : 'bg-cream-50 border border-cream-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{isCompleted ? '✅' : '⏳'}</span>
                                <span className="font-medium text-warm-700">
                                  {user.nickname || user.name}
                                </span>
                              </div>
                              {isCompleted ? (
                                <div className="text-right">
                                  <div className="text-sm font-mono text-mint-700">{formatTimeMs(result.timeMs)}</div>
                                  <div className="text-xs text-warm-500">{result.wpm} WPM</div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startTypingForPlayer(user.id)}
                                  className="btn-peach text-sm px-4 py-2"
                                >
                                  start typing
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Players without a team */}
                {getTypingNoTeamUsers().length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft p-5 border border-cream-200">
                    <h3 className="text-lg font-bold text-warm-600 mb-3 flex items-center gap-2">
                      👤 Players (no team)
                    </h3>
                    <p className="text-warm-500 text-sm mb-3">
                      Assign teams on the host page if you want boys vs girls totals; everyone here can still take a turn.
                    </p>
                    <div className="space-y-2">
                      {getTypingNoTeamUsers().map((user) => {
                        const result = typingPlayersCompleted[user.id];
                        const isCompleted = !!result;
                        return (
                          <div
                            key={user.id}
                            className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                              isCompleted
                                ? 'bg-mint-100 border border-mint-300'
                                : 'bg-cream-50 border border-cream-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{isCompleted ? '✅' : '⏳'}</span>
                              <span className="font-medium text-warm-700">
                                {user.nickname || user.name}
                              </span>
                            </div>
                            {isCompleted ? (
                              <div className="text-right">
                                <div className="text-sm font-mono text-mint-700">{formatTimeMs(result.timeMs)}</div>
                                <div className="text-xs text-warm-500">{result.wpm} WPM</div>
                              </div>
                            ) : (
                              <button
                                onClick={() => startTypingForPlayer(user.id)}
                                className="btn-butter text-sm px-4 py-2"
                              >
                                start typing
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reset Button */}
                {Object.keys(typingPlayersCompleted).length > 0 && (
                  <div className="text-center">
                    <button
                      onClick={resetTypingGame}
                      className="text-warm-500 hover:text-warm-700 text-sm underline lowercase"
                    >
                      reset all scores
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Playing Phase */}
            {typingGamePhase === 'playing' && currentTypingPlayerId && currentTypingText && (
              <>
                {/* Team Progress Bar */}
                {hasTypingTeamPlayers() ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-4 border border-cream-200">
                    <div className="flex justify-center gap-8">
                      <div className="text-center">
                        <div className="text-xl font-bold text-sky-500">
                          {getTypingTeamAvgWpm('boys') != null
                            ? `${getTypingTeamAvgWpm('boys')!.toFixed(1)} wpm`
                            : '—'}
                        </div>
                        <div className="text-xs text-warm-500">Team Boys 💙 (avg)</div>
                      </div>
                      <div className="text-lg text-warm-300 self-center">vs</div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-peach-500">
                          {getTypingTeamAvgWpm('girls') != null
                            ? `${getTypingTeamAvgWpm('girls')!.toFixed(1)} wpm`
                            : '—'}
                        </div>
                        <div className="text-xs text-warm-500">Team Girls 💗 (avg)</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-4 border border-cream-200 text-center">
                    <p className="text-warm-500 text-sm lowercase">
                      no team split — pick &quot;start typing&quot; for each player in order
                    </p>
                  </div>
                )}

                <TypingGame
                  targetText={currentTypingText}
                  onComplete={handleTypingPlayerComplete}
                  playerName={users.find(u => u.id === currentTypingPlayerId)?.nickname || users.find(u => u.id === currentTypingPlayerId)?.name || 'Player'}
                  playerTeam={users.find(u => u.id === currentTypingPlayerId)?.team || 'boys'}
                />
              </>
            )}

            {/* Results Phase */}
            {typingGamePhase === 'results' && (
              <div className="space-y-6">
                {/* Winner Announcement */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft-xl p-8 text-center border-2 border-butter-200">
                  <div className="text-6xl mb-4">🏆</div>
                  {hasTypingTeamPlayers() ? (
                    <>
                      <h2 className="text-3xl font-bold text-warm-700 mb-2 lowercase">
                        {(getTypingTeamAvgWpm('girls') ?? -1) > (getTypingTeamAvgWpm('boys') ?? -1)
                          ? 'team girls wins!'
                          : (getTypingTeamAvgWpm('boys') ?? -1) > (getTypingTeamAvgWpm('girls') ?? -1)
                          ? 'team boys wins!'
                          : "it's a tie!"}
                      </h2>
                      <div className="text-5xl mb-4">
                        {(getTypingTeamAvgWpm('girls') ?? -1) > (getTypingTeamAvgWpm('boys') ?? -1)
                          ? '💗'
                          : (getTypingTeamAvgWpm('boys') ?? -1) > (getTypingTeamAvgWpm('girls') ?? -1)
                          ? '💙'
                          : '🤝'}
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-bold text-warm-700 mb-2 lowercase">all done!</h2>
                      <p className="text-warm-500 text-sm">highest WPM ranks first — same as the game leaderboard</p>
                    </>
                  )}
                </div>

                {/* Final Scores */}
                {hasTypingTeamPlayers() && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 border border-cream-200">
                    <h3 className="text-xl font-bold text-warm-700 mb-4 text-center lowercase">team average WPM</h3>
                    <div className="flex justify-center gap-12">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-sky-500 font-mono">
                          {getTypingTeamAvgWpm('boys') != null
                            ? getTypingTeamAvgWpm('boys')!.toFixed(1)
                            : '—'}
                        </div>
                        <div className="text-warm-500">Team Boys 💙</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-peach-500 font-mono">
                          {getTypingTeamAvgWpm('girls') != null
                            ? getTypingTeamAvgWpm('girls')!.toFixed(1)
                            : '—'}
                        </div>
                        <div className="text-warm-500">Team Girls 💗</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Individual Results */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft p-5 border border-cream-200">
                  <h3 className="text-lg font-bold text-warm-700 mb-4 lowercase">individual times</h3>
                  <div className="space-y-2">
                    {getTypingParticipants()
                      .sort((a, b) => {
                        const aResult = typingPlayersCompleted[a.id];
                        const bResult = typingPlayersCompleted[b.id];
                        return (bResult?.wpm ?? 0) - (aResult?.wpm ?? 0);
                      })
                      .map((user, index) => {
                        const result = typingPlayersCompleted[user.id];
                        return (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 bg-cream-50 rounded-xl border border-cream-200"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-warm-400">#{index + 1}</span>
                              <span className="text-lg">
                                {user.team === 'boys' ? '💙' : user.team === 'girls' ? '💗' : '👤'}
                              </span>
                              <span className="font-medium text-warm-700">{user.nickname || user.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-warm-700">
                                {result ? formatTimeMs(result.timeMs) : '-'}
                              </div>
                              {result && (
                                <div className="text-xs text-warm-500">{result.wpm} WPM • {result.accuracy}%</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Play Again */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={resetTypingGame}
                    className="btn-butter text-lg px-8 py-4 lowercase"
                  >
                    play again 🔄
                  </button>
                  <Link
                    href={`/games/${gameId}`}
                    className="btn-spring bg-cream-200 text-warm-600 text-lg px-8 py-4 lowercase"
                  >
                    back to game
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        {/* Manual Score Entry Games (relay, puzzle, beer pong) */}
        {gameType === 'manual' && (
          <>
            {/* Game Info & Instructions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 border border-cream-200">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">{getManualGameEmoji()}</div>
                <h2 className="text-2xl font-bold text-warm-700 lowercase">{game.name}</h2>
                <p className="text-warm-500 mt-2">{getGameDescription()}</p>
              </div>
              
              <div className="bg-cream-50 rounded-2xl p-4 border border-cream-200">
                <h3 className="font-bold text-warm-700 mb-3 lowercase flex items-center gap-2">
                  <span>📋</span> how to play:
                </h3>
                <ol className="space-y-2 text-warm-600 text-sm">
                  {getManualGameInstructions().map((instruction, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="bg-lavender-200 text-lavender-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Score Entry Form */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft-xl p-6 border-2 border-butter-200">
              <h2 className="text-xl font-bold text-warm-700 mb-4 lowercase flex items-center gap-2">
                <span>📝</span> record scores
              </h2>
              <form onSubmit={handleManualScoreSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-warm-500 mb-2 lowercase">select player</label>
                  <select
                    value={manualScore.userId}
                    onChange={(e) => setManualScore({ ...manualScore, userId: e.target.value })}
                    className="input-spring text-lg w-full"
                    required
                  >
                    <option value="">choose who this score is for...</option>
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
                    <p className="text-sm text-peach-600 mt-2">add players from the dashboard or host view first.</p>
                  )}
                </div>

                {/* Points Input */}
                {game.type !== 'time' && (
                  <div>
                    <label className="block text-sm text-warm-500 mb-2 lowercase">
                      points / score
                    </label>
                    <input
                      type="number"
                      placeholder="enter points..."
                      value={manualScore.points}
                      onChange={(e) => setManualScore({ ...manualScore, points: e.target.value })}
                      className="input-spring text-lg"
                      step="0.1"
                    />
                  </div>
                )}

                {/* Time Input */}
                {game.type !== 'score' && (
                  <div>
                    <label className="block text-sm text-warm-500 mb-2 lowercase">
                      time (seconds)
                    </label>
                    <input
                      type="number"
                      placeholder="enter time in seconds..."
                      value={manualScore.timeSeconds}
                      onChange={(e) => setManualScore({ ...manualScore, timeSeconds: e.target.value })}
                      className="input-spring text-lg"
                      step="0.01"
                    />
                    {manualScore.timeSeconds && (
                      <p className="text-sm text-warm-400 mt-1">
                        = {Math.floor(parseFloat(manualScore.timeSeconds) / 60)}m {(parseFloat(manualScore.timeSeconds) % 60).toFixed(2)}s
                      </p>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm text-warm-500 mb-2 lowercase">
                    notes (optional)
                  </label>
                  <textarea
                    placeholder="add any notes about this score..."
                    value={manualScore.notes}
                    onChange={(e) => setManualScore({ ...manualScore, notes: e.target.value })}
                    className="input-spring"
                    rows={2}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full btn-butter text-lg py-4 lowercase disabled:opacity-50"
                  disabled={isSavingScore || !manualScore.userId || users.length === 0}
                >
                  {isSavingScore ? 'saving...' : 'save score ✨'}
                </button>
              </form>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4 justify-center">
              <Link
                href={`/games/${gameId}`}
                className="btn-spring bg-cream-200 text-warm-600 lowercase"
              >
                ← back to game
              </Link>
              <Link
                href="/leaderboard"
                className="btn-lavender lowercase"
              >
                view leaderboard 🏆
              </Link>
            </div>
          </>
        )}

        {/* Speed Drawing — 25 random words */}
        {gameType === 'speed_drawing' && (
          <>
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 border border-cream-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✏️</span>
                <h2 className="text-xl font-bold text-warm-700 lowercase">speed drawing</h2>
              </div>
              <p className="text-warm-500 text-sm mb-3">
                Someone reads the 25 numbered words aloud while everyone quick-sketches each one to remember it later.
                Hide the words for the guessing phase — teams use their drawings to recall which number was which.
                Enter scores in Host when you&apos;re done.
              </p>
              {drawingRoundWords.length === 0 ? (
                <p className="text-peach-600 text-sm">Loading word list…</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setDrawingWordsHidden((h) => !h)}
                      className="btn-butter lowercase flex items-center justify-center gap-2"
                    >
                      {drawingWordsHidden ? 'show words' : 'hide words'}
                    </button>
                    <span className="text-warm-400 text-xs">
                      {drawingWordsHidden ? 'Words hidden — time to guess by number!' : 'Words visible — study & draw'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                    {drawingRoundWords.map((word, i) => (
                      <div
                        key={`${word}-${i}`}
                        className={`rounded-xl px-3 py-2 text-center border ${
                          drawingWordsHidden
                            ? 'bg-warm-100/80 border-warm-200'
                            : 'bg-butter-50 border-butter-200'
                        }`}
                      >
                        <div className="text-xs font-bold text-lavender-600 tabular-nums">#{i + 1}</div>
                        <div
                          className={`text-sm font-medium mt-1 lowercase min-h-[1.25rem] ${
                            drawingWordsHidden ? 'text-warm-400' : 'text-warm-700'
                          }`}
                        >
                          {drawingWordsHidden ? '?' : word}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawingRoundWords(pickRandomWords(speedDrawingPool, 25));
                      setDrawingWordsHidden(false);
                    }}
                    className="btn-lavender w-full lowercase flex items-center justify-center gap-2"
                  >
                    <RefreshIcon />
                    new 25 words
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href={`/games/${gameId}`} className="btn-spring bg-cream-200 text-warm-600 lowercase">
                ← back to game
              </Link>
              <Link href="/host" className="btn-butter lowercase">
                host: enter scores 🏆
              </Link>
            </div>
          </>
        )}

        {/* Ready to Play - for non-typing, non-manual games */}
        {gameType &&
          gameType !== 'typing' &&
          gameType !== 'manual' &&
          gameType !== 'speed_drawing' &&
          !isRunning &&
          timeLeft === 60 &&
          !typingScore &&
          !memoryScore && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-8 text-center border border-cream-200">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-warm-700 mb-4 lowercase">ready to play?</h2>
            <p className="text-warm-500 mb-6">{getGameDescription()}</p>

            {(gameType === 'charades' || gameType === 'memory' || gameType === 'trivia') && (
              <div className="mb-6 text-left max-w-md mx-auto">
                <label className="block text-sm font-medium text-warm-600 mb-2 lowercase">
                  who is this round for? (score saves under this player)
                </label>
                <select
                  value={sessionScoreUserId ?? ''}
                  onChange={(e) =>
                    setSessionScoreUserId(e.target.value ? parseInt(e.target.value, 10) : null)
                  }
                  className="input-spring w-full text-lg"
                >
                  <option value="">select a player…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nickname || u.name}
                      {u.team ? ` (${u.team})` : ''}
                    </option>
                  ))}
                </select>
                {users.length === 0 && (
                  <p className="text-sm text-peach-600 mt-2">add players from the host page first.</p>
                )}
              </div>
            )}

            {gameType === 'song' && (
              <div className="mb-6 space-y-4 text-left max-w-md mx-auto">
                <p className="text-sm text-warm-500">
                  Pick one player per side so scores can be saved in the leaderboard (two different people).
                </p>
                <div>
                  <label className="block text-sm font-medium text-warm-600 mb-2 lowercase">
                    team boys — attach score to
                  </label>
                  <select
                    value={sessionBoysUserId ?? ''}
                    onChange={(e) =>
                      setSessionBoysUserId(e.target.value ? parseInt(e.target.value, 10) : null)
                    }
                    className="input-spring w-full text-lg"
                  >
                    <option value="">select player…</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nickname || u.name}
                        {u.team ? ` (${u.team})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-600 mb-2 lowercase">
                    team girls — attach score to
                  </label>
                  <select
                    value={sessionGirlsUserId ?? ''}
                    onChange={(e) =>
                      setSessionGirlsUserId(e.target.value ? parseInt(e.target.value, 10) : null)
                    }
                    className="input-spring w-full text-lg"
                  >
                    <option value="">select player…</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nickname || u.name}
                        {u.team ? ` (${u.team})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {users.length < 2 && (
                  <p className="text-sm text-peach-600">need at least two players for team vs team.</p>
                )}
                {sessionBoysUserId != null &&
                  sessionGirlsUserId != null &&
                  sessionBoysUserId === sessionGirlsUserId && (
                <p className="text-sm text-peach-600">choose two different players.</p>
                  )}
              </div>
            )}

            <button
              type="button"
              onClick={startGame}
              className="btn-butter text-xl px-10 py-4 lowercase disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                users.length === 0 ||
                ((gameType === 'charades' || gameType === 'memory' || gameType === 'trivia') &&
                  sessionScoreUserId == null) ||
                (gameType === 'song' &&
                  (users.length < 2 ||
                    sessionBoysUserId == null ||
                    sessionGirlsUserId == null ||
                    sessionBoysUserId === sessionGirlsUserId))
              }
            >
              start game 🚀
            </button>
          </div>
        )}

        {/* Game Running - for non-typing, non-manual games */}
        {isRunning && gameType !== 'typing' && gameType !== 'manual' && (
          <>
            {/* Timer & Score - charades + trivia (song game is untimed) */}
            {(gameType === 'charades' || gameType === 'trivia') && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 text-center border border-cream-200">
                <div className={`text-6xl font-bold mb-4 ${timeLeft <= 10 ? 'text-peach-500 animate-pulse' : 'text-lavender-500'}`}>
                  {formatTime(timeLeft)}
                </div>
                {(gameType === 'charades' || gameType === 'trivia') && (
                  <div className="flex justify-center gap-8 mb-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-mint-500">{score.correct}</div>
                      <div className="text-sm text-warm-400 lowercase">correct ✅</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-peach-400">{score.incorrect}</div>
                      <div className="text-sm text-warm-400 lowercase">
                        {gameType === 'trivia' ? 'wrong' : 'skipped'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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
              </div>
            )}

            {/* Song Guessing Game */}
            {gameType === 'song' && currentSong && (
              <>
                <SongGame
                  song={currentSong}
                  onRoundComplete={handleSongRoundComplete}
                  teamScore={songScore}
                  onNextSong={nextPrompt}
                />
                {/* Finish Game Option */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft p-5 border border-cream-200 text-center">
                  <p className="text-warm-500 text-sm mb-3 lowercase">done playing?</p>
                  <button
                    onClick={() => {
                      setIsRunning(false);
                      setSongSessionEnded(true);
                    }}
                    className="btn-lavender lowercase text-sm"
                  >
                    finish game & record scores 🏁
                  </button>
                </div>
              </>
            )}

            {/* Trivia Game */}
            {gameType === 'trivia' && currentTrivia && (
              <TriviaGame question={currentTrivia} onAnswer={handleTriviaAnswer} />
            )}

            {/* Memory Game */}
            {gameType === 'memory' && currentMemoryTheme.length > 0 && (
              <MemoryGame
                theme={currentMemoryTheme}
                themeLabel={currentMemoryThemeLabel ?? undefined}
                visualVariantIndex={memoryVisualVariant}
                roundKey={memoryRoundKey}
                onComplete={handleMemoryComplete}
              />
            )}
          </>
        )}

        {/* Memory Results */}
        {memoryScore && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-xl p-8 text-center border border-cream-200">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-warm-700 mb-4 lowercase">memory match complete!</h2>
            <div className="space-y-3 mb-6">
              <div className="text-4xl font-bold text-butter-500">{memoryScore.moves} moves</div>
              <div className="text-xl text-warm-600">time: {(memoryScore.timeMs / 1000).toFixed(1)}s</div>
              {memoryBreakdown && (
                <>
                  <div className="text-lg text-warm-500">
                    score: <span className="font-semibold text-warm-700">{memoryBreakdown.total}</span> points
                  </div>
                  <div className="text-sm text-warm-400">
                    {memoryBreakdown.movePts} from moves + {memoryBreakdown.timeBonus} speed bonus (max{' '}
                    {MEMORY_TIME_BONUS_MAX})
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleSaveMemoryScore}
                className="btn-butter lowercase"
                disabled={isSavingScore || sessionScoreUserId == null}
              >
                {isSavingScore ? 'saving...' : 'save score ✨'}
              </button>
              <button
                onClick={() => {
                  setMemoryScore(null);
                  startGame();
                }}
                className="btn-spring bg-cream-200 text-warm-600 lowercase"
              >
                play again 🔄
              </button>
            </div>
          </div>
        )}

        {/* Game Over - Song Game */}
        {!isRunning && gameType === 'song' && songSessionEnded && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-xl p-8 text-center border border-cream-200">
            <div className="text-5xl mb-4">🎵</div>
            <h2 className="text-3xl font-bold text-warm-700 mb-4 lowercase">game complete!</h2>
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-sky-500">{songScore.boys}</div>
                <div className="text-warm-500">Team Boys 💙</div>
              </div>
              <div className="text-2xl text-warm-300 self-center">vs</div>
              <div className="text-center">
                <div className="text-4xl font-bold text-peach-500">{songScore.girls}</div>
                <div className="text-warm-500">Team Girls 💗</div>
              </div>
            </div>
            <div className="text-xl font-bold text-warm-600 mb-6">
              {songScore.boys > songScore.girls 
                ? '💙 Team Boys wins!' 
                : songScore.girls > songScore.boys 
                ? '💗 Team Girls wins!' 
                : "🤝 It's a tie!"}
            </div>
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={handleSaveSongScores}
                className="btn-butter lowercase"
                disabled={
                  isSavingScore ||
                  sessionBoysUserId == null ||
                  sessionGirlsUserId == null
                }
              >
                {isSavingScore ? 'saving...' : 'record scores ✨'}
              </button>
              <div className="flex gap-4">
                <button
                  onClick={startGame}
                  className="btn-spring bg-cream-200 text-warm-600 lowercase"
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
          </div>
        )}

        {/* Game Over - Trivia */}
        {!isRunning && timeLeft === 0 && gameType === 'trivia' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-xl p-8 text-center border border-cream-200">
            <div className="text-5xl mb-4">🧠</div>
            <h2 className="text-3xl font-bold text-warm-700 mb-4 lowercase">time&apos;s up!</h2>
            <div className="text-5xl font-bold text-lavender-500 mb-4">
              {score.correct} / {score.correct + score.incorrect}
            </div>
            <p className="text-warm-500 mb-6">
              {score.correct + score.incorrect === 0
                ? 'no questions answered in 60 seconds.'
                : `${score.correct} correct out of ${score.correct + score.incorrect} answered in 60 seconds.`}{' '}
              {score.correct > 5 ? ' amazing! 🌟' : score.correct > 2 ? ' great job! 💪' : ' nice try! 🌱'}
            </p>
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={handleSaveTriviaScore}
                className="btn-butter lowercase"
                disabled={isSavingScore || sessionScoreUserId == null}
              >
                {isSavingScore ? 'saving...' : 'record score ✨'}
              </button>
              <div className="flex gap-4">
                <button
                  onClick={startGame}
                  className="btn-spring bg-cream-200 text-warm-600 lowercase"
                >
                  try again 🔄
                </button>
                <Link
                  href={`/games/${gameId}`}
                  className="btn-spring bg-cream-200 text-warm-600 lowercase"
                >
                  back to game
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Game Over - for timed games (charades only, song game handles its own end state) */}
        {!isRunning && timeLeft === 0 && gameType === 'charades' && (
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
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={handleSaveCharadesScore}
                className="btn-butter lowercase"
                disabled={isSavingScore || sessionScoreUserId == null}
              >
                {isSavingScore ? 'saving...' : 'record score ✨'}
              </button>
              <div className="flex gap-4">
                <button
                  onClick={startGame}
                  className="btn-spring bg-cream-200 text-warm-600 lowercase"
                >
                  try again 🔄
                </button>
                <Link
                  href={`/games/${gameId}`}
                  className="btn-spring bg-cream-200 text-warm-600 lowercase"
                >
                  back to game
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Manual Score Entry - hidden for typing game (automatic) and manual games (has dedicated UI above) */}
        {gameType !== 'typing' && gameType !== 'manual' && gameType !== 'speed_drawing' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft p-6 border border-cream-200">
            <h2 className="text-lg font-bold text-warm-700 mb-4 lowercase flex items-center gap-2">
              <span>📝</span> manual score entry
            </h2>
            <form onSubmit={handleManualScoreSubmit} className="space-y-3">
              <select
                value={manualScore.userId}
                onChange={(e) => setManualScore({ ...manualScore, userId: e.target.value })}
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
                disabled={isSavingScore || !manualScore.userId || users.length === 0}
              >
                {isSavingScore ? 'saving...' : 'save score ✨'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
