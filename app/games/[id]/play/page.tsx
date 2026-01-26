'use client';

import { useEffect, useState, useRef } from 'react';
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

// Typing Game Component
function TypingGame({ 
  targetText, 
  onComplete, 
  timeLeft 
}: { 
  targetText: string; 
  onComplete: (wpm: number, accuracy: number, timeMs: number) => void;
  timeLeft: number;
}) {
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (targetText && inputRef.current) {
      inputRef.current.focus();
    }
  }, [targetText]);

  useEffect(() => {
    if (input.length === 1 && !startTime) {
      setStartTime(Date.now());
    }
    if (input === targetText) {
      setIsComplete(true);
      const endTime = Date.now();
      const timeMs = endTime - (startTime || endTime);
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
  }, [input, targetText, startTime, onComplete]);

  const getCharStatus = (index: number) => {
    if (index >= input.length) return 'pending';
    if (input[index] === targetText[index]) return 'correct';
    return 'incorrect';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft-xl p-8 border-2 border-sky-200">
        <div className="text-center mb-6">
          <div className="text-sm text-warm-500 mb-4 lowercase">type this text:</div>
          <div className="text-2xl font-mono text-warm-700 leading-relaxed mb-6 whitespace-pre-wrap break-words">
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
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </div>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isComplete}
          className="w-full px-4 py-3 text-xl font-mono border-2 border-sky-300 rounded-xl focus:outline-none focus:border-sky-500 text-center"
          placeholder="start typing..."
        />
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
  const [gameType, setGameType] = useState<'charades' | 'song' | 'typing' | 'trivia' | 'memory' | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [typingScore, setTypingScore] = useState<{ wpm: number; accuracy: number; timeMs: number } | null>(null);
  const [triviaScore, setTriviaScore] = useState({ boys: 0, girls: 0 });
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
    if (isRunning && timeLeft > 0 && gameType !== 'typing' && gameType !== 'memory') {
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
        return 'guess the song from the clue! you have 60 seconds ⏱️';
      case 'typing':
        return 'type the text as fast as you can! ⚡';
      case 'trivia':
        return 'answer trivia questions! first team to buzz in wins! 🧠';
      case 'memory':
        return 'match all the pairs! 🧩';
      default:
        return 'let\'s play! 🎮';
    }
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
        {!isRunning && timeLeft === 60 && !typingScore && !memoryScore && (
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

        {/* Game Running */}
        {isRunning && (
          <>
            {/* Timer & Score - only for timed games */}
            {(gameType === 'charades' || gameType === 'song' || gameType === 'trivia') && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-lg p-6 text-center border border-cream-200">
                <div className={`text-6xl font-bold mb-4 ${timeLeft <= 10 ? 'text-peach-500 animate-pulse' : 'text-lavender-500'}`}>
                  {formatTime(timeLeft)}
                </div>
                {(gameType === 'charades' || gameType === 'song') && (
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

            {/* Typing Game */}
            {gameType === 'typing' && currentTypingText && (
              <TypingGame
                targetText={currentTypingText}
                onComplete={handleTypingComplete}
                timeLeft={timeLeft}
              />
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

        {/* Typing Results */}
        {typingScore && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-soft-xl p-8 text-center border border-cream-200">
            <div className="text-5xl mb-4">⚡</div>
            <h2 className="text-3xl font-bold text-warm-700 mb-4 lowercase">typing complete!</h2>
            <div className="space-y-3 mb-6">
              <div className="text-4xl font-bold text-sky-500">{typingScore.wpm} WPM</div>
              <div className="text-xl text-warm-600">accuracy: {typingScore.accuracy}%</div>
              <div className="text-lg text-warm-500">time: {(typingScore.timeMs / 1000).toFixed(2)}s</div>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleSaveTypingScore}
                className="btn-butter lowercase"
                disabled={isSavingScore}
              >
                {isSavingScore ? 'saving...' : 'save score ✨'}
              </button>
              <button
                onClick={() => {
                  setTypingScore(null);
                  startGame();
                }}
                className="btn-spring bg-cream-200 text-warm-600 lowercase"
              >
                play again 🔄
              </button>
            </div>
          </div>
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

        {/* Game Over - for timed games */}
        {!isRunning && timeLeft === 0 && (gameType === 'charades' || gameType === 'song') && (
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
