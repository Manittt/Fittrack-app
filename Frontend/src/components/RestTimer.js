import { useState, useEffect, useRef } from 'react';
import { X, SkipForward } from 'lucide-react';

export default function RestTimer({ onDone }) {
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(null); // null = not started
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            // Small vibration on phones if supported
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const start = (secs) => {
    clearInterval(intervalRef.current);
    setDuration(secs);
    setTimeLeft(secs);
    setRunning(true);
  };

  const skip = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setTimeLeft(null);
    onDone?.();
  };

  const mins = Math.floor((timeLeft ?? duration) / 60);
  const secs = (timeLeft ?? duration) % 60;
  const display = `${mins}:${String(secs).padStart(2, '0')}`;
  const progress = timeLeft !== null ? (timeLeft / duration) * 100 : 100;
  const isDone = timeLeft === 0;

  // Collapsed state (not started)
  if (timeLeft === null) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[#71717A] text-xs uppercase tracking-widest font-bold">Rest:</span>
        <button
          onClick={() => start(30)}
          className="px-3 py-1.5 bg-[#27272A] hover:bg-[#007AFF] text-white text-xs font-bold uppercase tracking-widest rounded-md transition-colors"
        >
          30s
        </button>
        <button
          onClick={() => start(60)}
          className="px-3 py-1.5 bg-[#27272A] hover:bg-[#007AFF] text-white text-xs font-bold uppercase tracking-widest rounded-md transition-colors"
        >
          60s
        </button>
        <button
          onClick={() => start(90)}
          className="px-3 py-1.5 bg-[#27272A] hover:bg-[#007AFF] text-white text-xs font-bold uppercase tracking-widest rounded-md transition-colors"
        >
          90s
        </button>
      </div>
    );
  }

  // Active / done timer
  return (
    <div className={`mt-3 rounded-md border px-4 py-3 flex items-center gap-4 ${
      isDone
        ? 'bg-[#34C759]/10 border-[#34C759]/40'
        : 'bg-[#007AFF]/10 border-[#007AFF]/40'
    }`}>
      {/* Circular progress */}
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#27272A" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15" fill="none"
            stroke={isDone ? '#34C759' : '#007AFF'}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 15}`}
            strokeDashoffset={`${2 * Math.PI * 15 * (1 - progress / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center barlow text-xs font-black ${
          isDone ? 'text-[#34C759]' : 'text-white'
        }`}>
          {isDone ? '✓' : display}
        </span>
      </div>

      <div className="flex-1">
        {isDone ? (
          <p className="text-[#34C759] font-bold text-sm">Rest done! Let's go 💪</p>
        ) : (
          <p className="text-white text-sm font-medium">Resting...</p>
        )}
        <p className="text-[#71717A] text-xs">{isDone ? 'Tap skip to continue' : `${timeLeft}s remaining`}</p>
      </div>

      <button
        onClick={skip}
        className="flex items-center gap-1 text-[#A1A1AA] hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
      >
        <SkipForward className="w-4 h-4" />
        Skip
      </button>
    </div>
  );
}