'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

// Typing Game Component
function TypingGame({ 
  targetText, 
  onComplete,
  playerName,
  playerTeam
}: { 
  targetText: string; 
  onComplete: (wpm: number, accuracy: number, timeMs: number) => void;
  playerName: string;
  playerTeam: 'boys' | 'girls';
}) {
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTimeMs, setFinalTimeMs] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const readyButtonRef = useRef<HTMLButtonElement>(null);

  // Focus on ready button initially
  useEffect(() => {
    if (!isReady && readyButtonRef.current) {
      readyButtonRef.current.focus();
    }
  }, [isReady]);

  // Focus on textarea when game starts
  useEffect(() => {
    if (isReady && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isReady]);

  // Handle Enter key to start the game
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

  // Timer for displaying elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && !isComplete) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [startTime, isComplete]);

  useEffect(() => {
    if (input === targetText && !isComplete && isReady) {
      const endTime = Date.now();
      const timeMs = endTime - (startTime || endTime);
      
      // Set final time and complete state
      setFinalTimeMs(timeMs);
      setElapsedTime(timeMs); // Update elapsed to match final
      setIsComplete(true);
      
      const timeMinutes = timeMs / 60000;
      const wordsTyped = targetText.split(' ').length;
      const wpm = Math.round((wordsTyped / timeMinutes) || 0);
      
      let correctChars = 0;
      for (let i = 0; i < Math.min(input.length, targetText.length); i++) {
        if (input[i] === targetText[i]) correctChars++;
      }
      const accuracy = Math.round((correctChars / targetText.length) * 100);
      
      onComplete(wpm, accuracy, timeMs);
    }
  }, [input, targetText, startTime, onComplete, isComplete, isReady]);

  const getCharStatus = (index: number) => {
    if (index >= input.length) return 'pending';
    if (input[index] === targetText[index]) return 'correct';
    return 'incorrect';
  };

  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}s`;
  };

  // Ready screen - waiting to start
  if (!isReady) {
    return (
      <div className="space-y-6" onKeyDown={handleKeyDown}>
        {/* Current Player Header */}
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
            when you press start, the prompt will appear and the clock begins!
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

  return (
    <div className="space-y-6">
      {/* Current Player Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-4 border border-cream-200">
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">{playerTeam === 'boys' ? '💙' : '💗'}</span>
          <span className="text-xl font-bold text-warm-700">{playerName}</span>
          <span className="text-warm-500 lowercase">{isComplete ? 'finished!' : 'is typing'}</span>
        </div>
        {startTime && (
          <div className={`text-center mt-2 text-lg font-mono ${isComplete ? 'text-mint-600 font-bold' : 'text-lavender-600'}`}>
            {formatElapsedTime(isComplete && finalTimeMs ? finalTimeMs : elapsedTime)}
            {isComplete && ' ✓ recorded!'}
          </div>
        )}
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft-xl p-6 border-2 border-sky-200">
        <div className="mb-6">
          <div className="text-sm text-warm-500 mb-4 lowercase text-center">type this text:</div>
          <div className="text-lg font-mono text-warm-700 leading-relaxed mb-6 p-4 bg-cream-50 rounded-xl border border-cream-200">
            {targetText.split('').map((char, i) => {
              const status = getCharStatus(i);
              return (
                <span
                  key={i}
                  className={
                    status === 'correct'
                      ? 'bg-mint-200 text-mint-800'
                      : status === 'incorrect'
                      ? 'bg-peach-200 text-peach-800'
                      : 'text-warm-400'
                  }
                >
                  {char}
                </span>
              );
            })}
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isComplete}
          className="w-full px-4 py-3 text-lg font-mono border-2 border-sky-300 rounded-xl focus:outline-none focus:border-sky-500 resize-none"
          placeholder="start typing here..."
          rows={4}
        />
        <div className="mt-3 flex justify-between text-sm text-warm-500">
          <span>{input.length} / {targetText.length} characters</span>
          <span>{Math.round((input.length / targetText.length) * 100)}% complete</span>
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

// Trivia Game Component
function TriviaGame({
  question,
  onAnswer,
  teamScore
}: {
  question: TriviaQuestion;
  onAnswer: (correct: boolean, team: 'boys' | 'girls') => void;
  teamScore: { boys: number; girls: number };
}) {
  const [selectedTeam, setSelectedTeam] = useState<'boys' | 'girls' | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (optionIndex: number) => {
    if (answered || !selectedTeam) return;
    setSelectedOption(optionIndex);
    setAnswered(true);
    const isCorrect = optionIndex === question.answer;
    setTimeout(() => {
      onAnswer(isCorrect, selectedTeam);
      setSelectedTeam(null);
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
          <div className="flex gap-4 text-sm">
            <span className="text-sky-600 font-bold">💙 {teamScore.boys}</span>
            <span className="text-peach-600 font-bold">💗 {teamScore.girls}</span>
          </div>
        </div>
        <h3 className="text-xl font-bold text-warm-700 mb-6">{question.question}</h3>
        {!selectedTeam && (
          <div className="mb-4">
            <p className="text-sm text-warm-500 mb-3 lowercase">which team buzzed in?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTeam('boys')}
                className="flex-1 btn-sky py-3"
              >
                💙 Team Boys
              </button>
              <button
                onClick={() => setSelectedTeam('girls')}
                className="flex-1 btn-peach py-3"
              >
                💗 Team Girls
              </button>
            </div>
          </div>
        )}
        {selectedTeam && (
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
        )}
      </div>
    </div>
  );
}

// YouTube Player Component
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type SongGamePhase = 'idle' | 'playing' | 'buzzing' | 'guessing' | 'stealing' | 'revealing';
type GameType = 'charades' | 'song' | 'typing' | 'trivia' | 'memory' | 'manual' | null;

function YouTubePlayer({
  videoId,
  startTime = 0,
  duration = 15,
  onEnded,
  isPlaying,
  onReady
}: {
  videoId: string;
  startTime?: number;
  duration?: number;
  onEnded: () => void;
  isPlaying: boolean;
  onReady?: () => void;
}) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const initPlayer = () => {
    if (!containerRef.current) return;
    
    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '200',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        start: startTime,
      },
      events: {
        onReady: () => {
          setIsLoaded(true);
          onReady?.();
        },
        onStateChange: (event: any) => {
          // Video ended naturally
          if (event.data === window.YT.PlayerState.ENDED) {
            onEnded();
          }
        }
      }
    });
  };

  useEffect(() => {
    if (!playerRef.current || !isLoaded) return;

    if (isPlaying) {
      playerRef.current.seekTo(startTime);
      playerRef.current.playVideo();
      setTimeRemaining(duration);
      
      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            playerRef.current?.pauseVideo();
            onEnded();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      playerRef.current.pauseVideo();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, isLoaded, startTime, duration, onEnded]);

  return (
    <div className="relative">
      <div ref={containerRef} className="rounded-xl overflow-hidden opacity-0 h-0" />
      {isPlaying && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-full bg-cream-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-lavender-500 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(timeRemaining / duration) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-lavender-500 rounded-full animate-pulse" />
            <span className="text-warm-600 font-medium">{timeRemaining}s remaining</span>
          </div>
        </div>
      )}
      {!isLoaded && (
        <div className="text-center py-4 text-warm-500">Loading audio...</div>
      )}
    </div>
  );
}

// Song Guessing Game Component (New version with YouTube)
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
  const [buzzedTeam, setBuzzedTeam] = useState<'boys' | 'girls' | null>(null);
  const [guessTitle, setGuessTitle] = useState('');
  const [guessArtist, setGuessArtist] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [stealAvailable, setStealAvailable] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const resetRound = () => {
    setPhase('idle');
    setBuzzedTeam(null);
    setGuessTitle('');
    setGuessArtist('');
    setIsCorrect(null);
    setStealAvailable(false);
    setPlayerReady(false);
  };

  const startPlaying = () => {
    setPhase('playing');
  };

  const handleAudioEnded = () => {
    setPhase('buzzing');
  };

  const handleBuzzIn = (team: 'boys' | 'girls') => {
    setBuzzedTeam(team);
    setPhase('guessing');
  };

  const normalizeString = (str: string) => {
    return str.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const checkGuess = () => {
    const normalizedGuessTitle = normalizeString(guessTitle);
    const normalizedGuessArtist = normalizeString(guessArtist);
    const normalizedTitle = normalizeString(song.title);
    const normalizedArtist = normalizeString(song.artist);

    // Check if title matches (allow partial matches for longer titles)
    const titleMatch = normalizedTitle.includes(normalizedGuessTitle) || 
                       normalizedGuessTitle.includes(normalizedTitle) ||
                       normalizedGuessTitle === normalizedTitle;
    
    // Check if artist matches (more lenient - just needs to contain main artist name)
    const artistMatch = normalizedArtist.includes(normalizedGuessArtist) || 
                        normalizedGuessArtist.includes(normalizedArtist.split(' ')[0]) ||
                        normalizedGuessArtist === normalizedArtist;

    const correct = titleMatch && artistMatch && normalizedGuessTitle.length > 0 && normalizedGuessArtist.length > 0;
    setIsCorrect(correct);

    if (correct) {
      setPhase('revealing');
      onRoundComplete(buzzedTeam);
    } else {
      if (!stealAvailable) {
        // First wrong guess - enable steal
        setStealAvailable(true);
        setPhase('stealing');
        setGuessTitle('');
        setGuessArtist('');
      } else {
        // Steal attempt failed
        setPhase('revealing');
        onRoundComplete(null);
      }
    }
  };

  const handleSteal = (team: 'boys' | 'girls') => {
    setBuzzedTeam(team);
    setPhase('guessing');
    setGuessTitle('');
    setGuessArtist('');
  };

  const handleNextSong = () => {
    resetRound();
    onNextSong();
  };

  return (
    <div className="space-y-6">
      {/* Score Display */}
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
        {/* Idle Phase */}
        {phase === 'idle' && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎵</div>
            <h3 className="text-xl font-bold text-warm-700 mb-4 lowercase">ready for the next song?</h3>
            <p className="text-warm-500 mb-6">listen to the 15-second intro and guess the song!</p>
            <button
              onClick={startPlaying}
              className="btn-butter text-lg px-8 py-4 lowercase"
            >
              play intro 🎶
            </button>
          </div>
        )}

        {/* Playing Phase */}
        {phase === 'playing' && (
          <div className="text-center">
            <div className="text-5xl mb-4 animate-bounce">🎧</div>
            <h3 className="text-xl font-bold text-warm-700 mb-4 lowercase">listen carefully...</h3>
            <YouTubePlayer
              videoId={song.youtubeId}
              startTime={song.startTime || 0}
              duration={15}
              onEnded={handleAudioEnded}
              isPlaying={true}
              onReady={() => setPlayerReady(true)}
            />
          </div>
        )}

        {/* Buzzing Phase */}
        {phase === 'buzzing' && (
          <div className="text-center">
            <div className="text-5xl mb-4">🔔</div>
            <h3 className="text-xl font-bold text-warm-700 mb-4 lowercase">time to buzz in!</h3>
            <p className="text-warm-500 mb-6">which team knows the answer?</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleBuzzIn('boys')}
                className="btn-sky text-lg px-8 py-4 flex items-center gap-2"
              >
                💙 Team Boys
              </button>
              <button
                onClick={() => handleBuzzIn('girls')}
                className="btn-peach text-lg px-8 py-4 flex items-center gap-2"
              >
                💗 Team Girls
              </button>
            </div>
          </div>
        )}

        {/* Guessing Phase */}
        {phase === 'guessing' && buzzedTeam && (
          <div>
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">
                {buzzedTeam === 'boys' ? '💙' : '💗'}
              </div>
              <h3 className="text-xl font-bold text-warm-700 lowercase">
                {stealAvailable ? 'steal attempt!' : `team ${buzzedTeam} is guessing!`}
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-warm-500 mb-2 lowercase">song title</label>
                <input
                  type="text"
                  value={guessTitle}
                  onChange={(e) => setGuessTitle(e.target.value)}
                  className="input-spring w-full text-lg"
                  placeholder="enter song title..."
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-warm-500 mb-2 lowercase">artist</label>
                <input
                  type="text"
                  value={guessArtist}
                  onChange={(e) => setGuessArtist(e.target.value)}
                  className="input-spring w-full text-lg"
                  placeholder="enter artist name..."
                />
              </div>
              <button
                onClick={checkGuess}
                disabled={!guessTitle.trim() || !guessArtist.trim()}
                className="w-full btn-mint text-lg py-4 lowercase disabled:opacity-50"
              >
                submit guess ✓
              </button>
            </div>
          </div>
        )}

        {/* Stealing Phase */}
        {phase === 'stealing' && (
          <div className="text-center">
            <div className="text-5xl mb-4">😬</div>
            <h3 className="text-xl font-bold text-peach-600 mb-2 lowercase">wrong answer!</h3>
            <p className="text-warm-500 mb-6">
              the other team can steal the point!
            </p>
            <div className="flex gap-4 justify-center">
              {buzzedTeam === 'boys' ? (
                <button
                  onClick={() => handleSteal('girls')}
                  className="btn-peach text-lg px-8 py-4 flex items-center gap-2"
                >
                  💗 Team Girls Steal
                </button>
              ) : (
                <button
                  onClick={() => handleSteal('boys')}
                  className="btn-sky text-lg px-8 py-4 flex items-center gap-2"
                >
                  💙 Team Boys Steal
                </button>
              )}
              <button
                onClick={() => {
                  setPhase('revealing');
                  onRoundComplete(null);
                }}
                className="btn-spring bg-cream-200 text-warm-600 text-lg px-8 py-4"
              >
                skip steal
              </button>
            </div>
          </div>
        )}

        {/* Revealing Phase */}
        {phase === 'revealing' && (
          <div className="text-center">
            <div className="text-5xl mb-4">
              {isCorrect ? '🎉' : '😅'}
            </div>
            <h3 className="text-xl font-bold text-warm-700 mb-4 lowercase">
              {isCorrect ? 'correct!' : 'the answer was...'}
            </h3>
            <div className="bg-cream-100 rounded-2xl p-6 mb-6">
              <div className="text-2xl font-bold text-warm-700 mb-2">{song.title}</div>
              <div className="text-lg text-warm-500">by {song.artist}</div>
            </div>
            {isCorrect && buzzedTeam && (
              <p className="text-mint-600 font-bold mb-4">
                +1 point for Team {buzzedTeam === 'boys' ? 'Boys 💙' : 'Girls 💗'}!
              </p>
            )}
            <button
              onClick={handleNextSong}
              className="btn-butter text-lg px-8 py-4 lowercase"
            >
              next song 🎵
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Memory Game Component
function MemoryGame({
  theme,
  onComplete
}: {
  theme: string[];
  onComplete: (moves: number, timeMs: number) => void;
}) {
  const [cards, setCards] = useState<Array<{ id: number; emoji: string; flipped: boolean; matched: boolean }>>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Create pairs from theme
    const pairs = [...theme, ...theme].map((emoji, i) => ({
      id: i,
      emoji,
      flipped: false,
      matched: false,
    }));
    // Shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    setCards(pairs);
  }, [theme]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      if (cards[first].emoji === cards[second].emoji) {
        // Match!
        setCards(prev => prev.map((card, i) =>
          i === first || i === second ? { ...card, matched: true, flipped: false } : card
        ));
        setMoves(prev => prev + 1);
        setFlippedCards([]);
      } else {
        // No match, flip back
        setTimeout(() => {
          setCards(prev => prev.map((card, i) =>
            flippedCards.includes(i) ? { ...card, flipped: false } : card
          ));
          setFlippedCards([]);
          setMoves(prev => prev + 1);
        }, 1000);
      }
    }
  }, [flippedCards, cards]);

  // Check for completion when cards change
  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.matched) && !isComplete) {
      setIsComplete(true);
      const timeMs = Date.now() - startTime;
      onComplete(moves, timeMs);
    }
  }, [cards, moves, startTime, onComplete, isComplete]);

  const handleCardClick = (index: number) => {
    if (cards[index].flipped || cards[index].matched || flippedCards.length === 2 || isComplete) return;
    
    setCards(prev => prev.map((card, i) =>
      i === index ? { ...card, flipped: true } : card
    ));
    setFlippedCards(prev => [...prev, index]);
  };

  const gridSize = Math.ceil(Math.sqrt(cards.length));
  const cols = gridSize === 4 ? 4 : gridSize === 6 ? 6 : 4;

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft-xl p-6 border-2 border-butter-200">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-warm-500 lowercase">
            moves: <span className="font-bold text-warm-700">{moves}</span>
          </div>
          {isComplete && (
            <div className="text-mint-600 font-bold">🎉 Complete!</div>
          )}
        </div>
        <div className={`grid gap-3 ${cols === 4 ? 'grid-cols-4' : 'grid-cols-6'}`}>
          {cards.map((card, index) => (
            <button
              key={index}
              onClick={() => handleCardClick(index)}
              disabled={card.matched || isComplete}
              className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all ${
                card.matched
                  ? 'bg-mint-200 border-2 border-mint-500'
                  : card.flipped
                  ? 'bg-butter-200 border-2 border-butter-400'
                  : 'bg-cream-200 border-2 border-cream-300 hover:bg-cream-300'
              }`}
            >
              {card.flipped || card.matched ? card.emoji : '?'}
            </button>
          ))}
        </div>
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
  const [gameType, setGameType] = useState<GameType>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [typingScore, setTypingScore] = useState<{ wpm: number; accuracy: number; timeMs: number } | null>(null);
  // Typing game multi-player state
  const [typingGamePhase, setTypingGamePhase] = useState<TypingGamePhase>('setup');
  const [currentTypingPlayerId, setCurrentTypingPlayerId] = useState<number | null>(null);
  const [typingPlayersCompleted, setTypingPlayersCompleted] = useState<Record<number, TypingPlayerResult>>({});
  const [triviaScore, setTriviaScore] = useState({ boys: 0, girls: 0 });
  const [songScore, setSongScore] = useState({ boys: 0, girls: 0 });
  const [memoryScore, setMemoryScore] = useState<{ moves: number; timeMs: number } | null>(null);
  const [manualScore, setManualScore] = useState({
    team: '' as '' | 'boys' | 'girls',
    points: '',
    timeSeconds: '',
    notes: '',
  });
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [typingPrompts, setTypingPrompts] = useState<string[]>([]);
  const [triviaQuestions, setTriviaQuestions] = useState<TriviaQuestion[]>([]);
  const [memoryThemes, setMemoryThemes] = useState<Record<string, string[]>>({});
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
    let interval: NodeJS.Timeout;
    // Song game handles its own timing via YouTube player
    if (isRunning && timeLeft > 0 && gameType !== 'typing' && gameType !== 'memory' && gameType !== 'song') {
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
        } else if (name.includes('typer') || name.includes('typing')) {
          setGameType('typing');
        } else if (name.includes('trivia') || name.includes('quiz')) {
          setGameType('trivia');
        } else if (name.includes('memory') || name.includes('match')) {
          setGameType('memory');
        } else if (name.includes('relay') || name.includes('4x400') || 
                   name.includes('puzzle') || 
                   name.includes('beer pong') || name.includes('pong')) {
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
    setIsRunning(true);
    setTimeLeft(60);
    setScore({ correct: 0, incorrect: 0 });
    setTypingScore(null);
    setTriviaScore({ boys: 0, girls: 0 });
    setSongScore({ boys: 0, girls: 0 });
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
      if (result && typeof result === 'object' && 'emojis' in result) {
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

  const handleTriviaAnswer = (correct: boolean, team: 'boys' | 'girls') => {
    if (correct) {
      setTriviaScore((prev) => ({
        ...prev,
        [team]: prev[team] + 1,
      }));
    }
    nextPrompt();
  };

  const handleMemoryComplete = (moves: number, timeMs: number) => {
    setMemoryScore({ moves, timeMs });
    setIsRunning(false);
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

  const handleSaveTypingScore = async () => {
    if (!eventId || !game || !typingScore) return;
    
    // Find team user (use first available team)
    const teamUser = users.find(user => user.team);
    if (!teamUser) return;

    setIsSavingScore(true);
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          gameId: game.id,
          userId: teamUser.id,
          points: typingScore.wpm,
          timeMs: typingScore.timeMs,
          notes: `${typingScore.accuracy}% accuracy`,
        }),
      });

      if (res.ok) {
        setTypingScore(null);
        setIsRunning(false);
        setTimeLeft(60);
      }
    } catch (error) {
      console.error('Failed to save score:', error);
    } finally {
      setIsSavingScore(false);
    }
  };

  const handleSaveMemoryScore = async () => {
    if (!eventId || !game || !memoryScore) return;
    
    const teamUser = users.find(user => user.team);
    if (!teamUser) return;

    setIsSavingScore(true);
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          gameId: game.id,
          userId: teamUser.id,
          points: 1000 - memoryScore.moves * 10, // Score based on moves
          timeMs: memoryScore.timeMs,
          notes: `${memoryScore.moves} moves`,
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
    if (!eventId || !game) return;
    
    const teamUser = users.find(user => user.team);
    if (!teamUser) return;

    setIsSavingScore(true);
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          gameId: game.id,
          userId: teamUser.id,
          points: score.correct,
          timeMs: 60000, // 60 second game
          notes: `${score.correct} correct, ${score.incorrect} skipped`,
        }),
      });

      if (res.ok) {
        // Reset to allow another round
        setScore({ correct: 0, incorrect: 0 });
        setTimeLeft(60);
      }
    } catch (error) {
      console.error('Failed to save score:', error);
    } finally {
      setIsSavingScore(false);
    }
  };

  const handleSaveTriviaScores = async () => {
    if (!eventId || !game) return;

    const boysUser = users.find(user => user.team === 'boys');
    const girlsUser = users.find(user => user.team === 'girls');

    if (!boysUser && !girlsUser) return;

    setIsSavingScore(true);
    try {
      // Save boys team score
      if (boysUser && triviaScore.boys > 0) {
        await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            gameId: game.id,
            userId: boysUser.id,
            points: triviaScore.boys,
            timeMs: 60000,
            notes: `Team Boys: ${triviaScore.boys} correct answers`,
          }),
        });
      }

      // Save girls team score
      if (girlsUser && triviaScore.girls > 0) {
        await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            gameId: game.id,
            userId: girlsUser.id,
            points: triviaScore.girls,
            timeMs: 60000,
            notes: `Team Girls: ${triviaScore.girls} correct answers`,
          }),
        });
      }

      // Reset for next round
      setTriviaScore({ boys: 0, girls: 0 });
      setTimeLeft(60);
    } catch (error) {
      console.error('Failed to save trivia scores:', error);
    } finally {
      setIsSavingScore(false);
    }
  };

  const handleSaveSongScores = async () => {
    if (!eventId || !game) return;

    const boysUser = users.find(user => user.team === 'boys');
    const girlsUser = users.find(user => user.team === 'girls');

    if (!boysUser && !girlsUser) return;

    setIsSavingScore(true);
    try {
      // Save boys team score
      if (boysUser && songScore.boys > 0) {
        await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            gameId: game.id,
            userId: boysUser.id,
            points: songScore.boys,
            notes: `Team Boys: ${songScore.boys} songs guessed correctly`,
          }),
        });
      }

      // Save girls team score
      if (girlsUser && songScore.girls > 0) {
        await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            gameId: game.id,
            userId: girlsUser.id,
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
        return 'listen to the instrumental intro and guess the song + artist! 🎵';
      case 'typing':
        return 'type the text as fast as you can! ⚡';
      case 'trivia':
        return 'answer trivia questions! first team to buzz in wins! 🧠';
      case 'memory':
        return 'match all the pairs! 🧩';
      case 'manual':
        return 'play this game outside the app and record scores here! 📝';
      default:
        return 'let\'s play! 🎮';
    }
  };

  const getManualGameEmoji = () => {
    if (!game) return '🎮';
    const name = game.name.toLowerCase();
    if (name.includes('relay') || name.includes('4x400')) return '🏃';
    if (name.includes('puzzle')) return '🧩';
    if (name.includes('pong') || name.includes('beer')) return '🍺';
    return '🎯';
  };

  const getManualGameInstructions = () => {
    if (!game) return [];
    const name = game.name.toLowerCase();
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

  const getTypingTeamTotal = (team: 'boys' | 'girls') => {
    return getTypingTeamUsers(team).reduce((sum, user) => {
      const result = typingPlayersCompleted[user.id];
      return sum + (result?.timeMs || 0);
    }, 0);
  };

  const getTypingTeamCompletedCount = (team: 'boys' | 'girls') => {
    return getTypingTeamUsers(team).filter(u => typingPlayersCompleted[u.id] !== undefined).length;
  };

  const isTypingPlayerCompleted = (userId: number) => {
    return typingPlayersCompleted[userId] !== undefined;
  };

  const getAllTypingPlayersCompleted = () => {
    const allPlayers = users.filter(u => u.team === 'boys' || u.team === 'girls');
    return allPlayers.length > 0 && allPlayers.every(u => typingPlayersCompleted[u.id] !== undefined);
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
    const allPlayers = users.filter(u => u.team === 'boys' || u.team === 'girls');
    const completedCount = Object.keys(typingPlayersCompleted).length + 1; // +1 for current player

    if (completedCount >= allPlayers.length) {
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
                        <span>your time is recorded when you complete the text</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-lavender-200 text-lavender-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                        <span>team times are added together</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-lavender-200 text-lavender-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
                        <span>the team with the lowest total time wins!</span>
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Team Progress & Cumulative Times */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-4 border border-cream-200">
                  <div className="flex justify-center gap-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-sky-500">
                        {getTypingTeamCompletedCount('boys')}/{getTypingTeamUsers('boys').length}
                      </div>
                      <div className="text-sm text-warm-500">Team Boys 💙</div>
                      {getTypingTeamTotal('boys') > 0 && (
                        <div className="text-xs text-sky-600 font-mono mt-1">
                          {formatTimeMs(getTypingTeamTotal('boys'))}
                        </div>
                      )}
                    </div>
                    <div className="text-xl text-warm-300 self-center">vs</div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-peach-500">
                        {getTypingTeamCompletedCount('girls')}/{getTypingTeamUsers('girls').length}
                      </div>
                      <div className="text-sm text-warm-500">Team Girls 💗</div>
                      {getTypingTeamTotal('girls') > 0 && (
                        <div className="text-xs text-peach-600 font-mono mt-1">
                          {formatTimeMs(getTypingTeamTotal('girls'))}
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
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-4 border border-cream-200">
                  <div className="flex justify-center gap-8">
                    <div className="text-center">
                      <div className="text-xl font-bold text-sky-500">
                        {formatTimeMs(getTypingTeamTotal('boys'))}
                      </div>
                      <div className="text-xs text-warm-500">Team Boys 💙</div>
                    </div>
                    <div className="text-lg text-warm-300 self-center">vs</div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-peach-500">
                        {formatTimeMs(getTypingTeamTotal('girls'))}
                      </div>
                      <div className="text-xs text-warm-500">Team Girls 💗</div>
                    </div>
                  </div>
                </div>

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
                  <h2 className="text-3xl font-bold text-warm-700 mb-2 lowercase">
                    {getTypingTeamTotal('boys') < getTypingTeamTotal('girls')
                      ? 'team boys wins!'
                      : getTypingTeamTotal('girls') < getTypingTeamTotal('boys')
                      ? 'team girls wins!'
                      : "it's a tie!"}
                  </h2>
                  <div className="text-5xl mb-4">
                    {getTypingTeamTotal('boys') < getTypingTeamTotal('girls')
                      ? '💙'
                      : getTypingTeamTotal('girls') < getTypingTeamTotal('boys')
                      ? '💗'
                      : '🤝'}
                  </div>
                </div>

                {/* Final Scores */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 border border-cream-200">
                  <h3 className="text-xl font-bold text-warm-700 mb-4 text-center lowercase">final times</h3>
                  <div className="flex justify-center gap-12">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-sky-500 font-mono">
                        {formatTimeMs(getTypingTeamTotal('boys'))}
                      </div>
                      <div className="text-warm-500">Team Boys 💙</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-peach-500 font-mono">
                        {formatTimeMs(getTypingTeamTotal('girls'))}
                      </div>
                      <div className="text-warm-500">Team Girls 💗</div>
                    </div>
                  </div>
                </div>

                {/* Individual Results */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft p-5 border border-cream-200">
                  <h3 className="text-lg font-bold text-warm-700 mb-4 lowercase">individual times</h3>
                  <div className="space-y-2">
                    {users
                      .filter(u => u.team === 'boys' || u.team === 'girls')
                      .sort((a, b) => {
                        const aResult = typingPlayersCompleted[a.id];
                        const bResult = typingPlayersCompleted[b.id];
                        return (aResult?.timeMs || Infinity) - (bResult?.timeMs || Infinity);
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
                              <span className="text-lg">{user.team === 'boys' ? '💙' : '💗'}</span>
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
                {/* Team Selection */}
                <div>
                  <label className="block text-sm text-warm-500 mb-2 lowercase">select team</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setManualScore({ ...manualScore, team: 'boys' })}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        manualScore.team === 'boys'
                          ? 'bg-sky-200 border-2 border-sky-500 text-sky-700'
                          : 'bg-cream-100 border-2 border-cream-300 text-warm-600 hover:border-sky-300'
                      }`}
                    >
                      💙 Team Boys
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualScore({ ...manualScore, team: 'girls' })}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        manualScore.team === 'girls'
                          ? 'bg-peach-200 border-2 border-peach-500 text-peach-700'
                          : 'bg-cream-100 border-2 border-cream-300 text-warm-600 hover:border-peach-300'
                      }`}
                    >
                      💗 Team Girls
                    </button>
                  </div>
                  {manualScore.team && !users.find(user => user.team === manualScore.team) && (
                    <p className="text-sm text-peach-600 mt-2">
                      no players found for this team. add a player first.
                    </p>
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
                  disabled={isSavingScore || !manualScore.team || !users.find(user => user.team === manualScore.team)}
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

        {/* Ready to Play - for non-typing, non-manual games */}
        {gameType !== 'typing' && gameType !== 'manual' && !isRunning && timeLeft === 60 && !typingScore && !memoryScore && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-8 text-center border border-cream-200">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-warm-700 mb-4 lowercase">ready to play?</h2>
            <p className="text-warm-500 mb-6">{getGameDescription()}</p>
            <button
              onClick={startGame}
              className="btn-butter text-xl px-10 py-4 lowercase"
            >
              start game 🚀
            </button>
          </div>
        )}

        {/* Game Running - for non-typing, non-manual games */}
        {isRunning && gameType !== 'typing' && gameType !== 'manual' && (
          <>
            {/* Timer & Score - only for timed games (not song game which has its own timer) */}
            {(gameType === 'charades' || gameType === 'trivia') && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 text-center border border-cream-200">
                <div className={`text-6xl font-bold mb-4 ${timeLeft <= 10 ? 'text-peach-500 animate-pulse' : 'text-lavender-500'}`}>
                  {formatTime(timeLeft)}
                </div>
                {gameType === 'charades' && (
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
                <button
                  onClick={nextPrompt}
                  className="mt-4 text-lavender-500 hover:text-lavender-600 flex items-center gap-2 mx-auto lowercase font-medium"
                >
                  <RefreshIcon />
                  new prompt
                </button>
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
                {(songScore.boys > 0 || songScore.girls > 0) && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft p-5 border border-cream-200 text-center">
                    <p className="text-warm-500 text-sm mb-3 lowercase">done playing?</p>
                    <button
                      onClick={() => setIsRunning(false)}
                      className="btn-lavender lowercase text-sm"
                    >
                      finish game & record scores 🏁
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Trivia Game */}
            {gameType === 'trivia' && currentTrivia && (
              <TriviaGame
                question={currentTrivia}
                onAnswer={handleTriviaAnswer}
                teamScore={triviaScore}
              />
            )}

            {/* Memory Game */}
            {gameType === 'memory' && currentMemoryTheme.length > 0 && (
              <MemoryGame
                theme={currentMemoryTheme}
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
              <div className="text-lg text-warm-500">score: {1000 - memoryScore.moves * 10} points</div>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleSaveMemoryScore}
                className="btn-butter lowercase"
                disabled={isSavingScore}
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
        {!isRunning && gameType === 'song' && (songScore.boys > 0 || songScore.girls > 0) && (
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
                disabled={isSavingScore}
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
            <h2 className="text-3xl font-bold text-warm-700 mb-4 lowercase">time's up!</h2>
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-sky-500">{triviaScore.boys}</div>
                <div className="text-warm-500">Team Boys 💙</div>
              </div>
              <div className="text-2xl text-warm-300 self-center">vs</div>
              <div className="text-center">
                <div className="text-4xl font-bold text-peach-500">{triviaScore.girls}</div>
                <div className="text-warm-500">Team Girls 💗</div>
              </div>
            </div>
            <div className="text-xl font-bold text-warm-600 mb-6">
              {triviaScore.boys > triviaScore.girls 
                ? '💙 Team Boys wins!' 
                : triviaScore.girls > triviaScore.boys 
                ? '💗 Team Girls wins!' 
                : "🤝 It's a tie!"}
            </div>
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={handleSaveTriviaScores}
                className="btn-butter lowercase"
                disabled={isSavingScore || (triviaScore.boys === 0 && triviaScore.girls === 0)}
              >
                {isSavingScore ? 'saving...' : 'record scores ✨'}
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
                disabled={isSavingScore}
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
        {gameType !== 'typing' && gameType !== 'manual' && (
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
        )}
      </div>
    </div>
  );
}
