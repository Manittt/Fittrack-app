import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Search, Play, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Legs', 'Biceps', 'Triceps', 'Core'];

// Converts a YouTube watch URL to an embed URL
function toEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
}

export default function ExercisesPage() {
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [videoExercise, setVideoExercise] = useState(null); // which exercise's video is open

  useEffect(() => { fetchExercises(); }, []);
  useEffect(() => { filterExercises(); }, [exercises, selectedMuscleGroup, searchQuery]);

  const fetchExercises = async () => {
    try {
      const response = await axios.get(`${API}/exercises`, { headers: getAuthHeader() });
      setExercises(response.data);
    } catch (error) {
      toast.error('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;
    if (selectedMuscleGroup !== 'All') filtered = filtered.filter(ex => ex.muscle_group === selectedMuscleGroup);
    if (searchQuery) filtered = filtered.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredExercises(filtered);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-white text-lg">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Video Modal */}
      {videoExercise && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setVideoExercise(null)}>
          <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="barlow text-xl font-black text-white">{videoExercise.name}</h3>
              <button onClick={() => setVideoExercise(null)} className="text-[#A1A1AA] hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-[#1A1A1A]">
              <iframe
                src={toEmbedUrl(videoExercise.video_url)}
                title={videoExercise.name}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#141414] border-b border-[#27272A]/40 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}
              className="text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="barlow text-2xl font-black tracking-tighter text-white">Exercise Library</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#71717A]" />
            <Input type="text" placeholder="Search exercises..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0A0A0A] border-[#27272A] text-white focus:border-[#007AFF]" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Muscle Group Filter */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {MUSCLE_GROUPS.map((group) => (
              <button key={group} onClick={() => setSelectedMuscleGroup(group)}
                className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                  selectedMuscleGroup === group
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-[#1A1A1A] text-[#A1A1AA] border border-[#27272A] hover:border-[#007AFF]'
                }`}>
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise Grid */}
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#A1A1AA] text-lg">No exercises found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map((exercise) => (
              <div key={exercise.id}
                className="bg-[#1A1A1A] border border-[#27272A] rounded-md overflow-hidden hover:border-[#007AFF] transition-colors">
                {/* Image with play button overlay */}
                <div className="relative h-48 overflow-hidden group">
                  <img src={exercise.image_url} alt={exercise.name} className="w-full h-full object-cover" />
                  {exercise.video_url && (
                    <button
                      onClick={() => setVideoExercise(exercise)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="w-14 h-14 bg-[#007AFF] rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 text-white ml-1" fill="white" />
                      </div>
                    </button>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="barlow text-lg font-bold tracking-tight text-white mb-1">{exercise.name}</h3>
                  <p className="text-[#A1A1AA] text-sm uppercase tracking-widest mb-2">{exercise.muscle_group}</p>
                  <p className="text-[#71717A] text-sm mb-3">{exercise.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[#71717A] text-xs uppercase tracking-widest">
                      <span>{exercise.default_sets} sets</span>
                      <span>×</span>
                      <span>{exercise.default_reps} reps</span>
                    </div>
                    {exercise.video_url && (
                      <button
                        onClick={() => setVideoExercise(exercise)}
                        className="flex items-center gap-1 text-[#007AFF] hover:text-[#0066DD] text-xs font-bold uppercase tracking-widest transition-colors"
                      >
                        <Play className="w-3 h-3" fill="currentColor" />
                        Watch
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}