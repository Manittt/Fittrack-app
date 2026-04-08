import { X, Play, Pause } from 'lucide-react';
import { useRef, useState } from 'react';

export default function ExerciseDetailModal({ exercise, onClose }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  if (!exercise) return null;

  // Works for both Exercise library (exercise_name or name) and workout exercises
  const name = exercise.exercise_name || exercise.name;
  const muscle = exercise.muscle_group;
  const description = exercise.description;
  const image = exercise.image_url;
  const video = exercise.video_url;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#1A1A1A] border border-[#27272A] rounded-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <h2 className="barlow text-2xl font-black tracking-tight text-white">{name}</h2>
            <p className="text-[#007AFF] text-xs uppercase tracking-widest font-bold mt-0.5">{muscle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-white transition-colors ml-4 flex-shrink-0 mt-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video player — shown if video exists, paused by default */}
        {video ? (
          <div className="relative mx-5 mb-4 rounded-md overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              src={video}
              className="w-full h-full object-cover"
              loop
              playsInline
              onEnded={() => setPlaying(false)}
            />
            {/* Play/pause overlay */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                playing ? 'bg-white/20 opacity-0 group-hover:opacity-100' : 'bg-[#007AFF]'
              }`}>
                {playing
                  ? <Pause className="w-6 h-6 text-white" fill="white" />
                  : <Play className="w-6 h-6 text-white ml-1" fill="white" />
                }
              </div>
            </button>
            {!playing && (
              <div className="absolute bottom-3 left-3 bg-black/60 rounded px-2 py-1">
                <p className="text-white text-xs uppercase tracking-widest">Tap to play</p>
              </div>
            )}
          </div>
        ) : image ? (
          /* Fall back to image if no video */
          <div className="mx-5 mb-4 rounded-md overflow-hidden h-48">
            <img src={image} alt={name} className="w-full h-full object-cover" />
          </div>
        ) : null}

        {/* Instructions */}
        <div className="px-5 pb-5">
          <p className="text-[#A1A1AA] text-xs uppercase tracking-widest font-bold mb-2">How To</p>
          <p className="text-white text-sm leading-relaxed">{description}</p>

          {!video && (
            <p className="text-[#71717A] text-xs mt-4 italic">Video tutorial coming soon</p>
          )}
        </div>
      </div>
    </div>
  );
}