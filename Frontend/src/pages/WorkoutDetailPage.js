import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Clock, Dumbbell, ChevronRight } from 'lucide-react';
import ExerciseDetailModal from '../components/ExerciseDetailModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function WorkoutDetailPage() {
  const { routineId } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);
  // Cache of full exercise details (includes description + video_url)
  const [exerciseDetails, setExerciseDetails] = useState({});

  useEffect(() => { fetchRoutine(); }, [routineId]);

  const fetchRoutine = async () => {
    try {
      const response = await axios.get(`${API}/routines/${routineId}`, { headers: getAuthHeader() });
      setRoutine(response.data);
    } catch (error) {
      toast.error('Failed to load workout');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseClick = async (exercise) => {
    // If we already fetched this exercise's full details, use cache
    if (exerciseDetails[exercise.exercise_id]) {
      setSelectedExercise(exerciseDetails[exercise.exercise_id]);
      return;
    }
    // Otherwise fetch from API to get description + video_url
    try {
      const res = await axios.get(`${API}/exercises/${exercise.exercise_id}`, { headers: getAuthHeader() });
      const full = { ...exercise, ...res.data };
      setExerciseDetails(prev => ({ ...prev, [exercise.exercise_id]: full }));
      setSelectedExercise(full);
    } catch {
      // Fall back to whatever we have from the routine
      setSelectedExercise(exercise);
    }
  };

  const handleStartWorkout = async () => {
    try {
      const response = await axios.post(
        `${API}/workouts/start`,
        { routine_id: routineId },
        { headers: getAuthHeader() }
      );
      navigate(`/workout/${response.data.id}/active`);
    } catch (error) {
      toast.error('Failed to start workout');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-white text-lg">Loading...</div>
    </div>
  );
  if (!routine) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Exercise detail modal */}
      {selectedExercise && (
        <ExerciseDetailModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
      )}

      {/* Header */}
      <header className="bg-[#141414] border-b border-[#27272A]/40 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/')}
            className="text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] p-2 rounded-md transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="barlow text-2xl font-black tracking-tighter text-white">{routine.name}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Image */}
        <div className="mb-8 rounded-md overflow-hidden h-64 sm:h-80">
          <img src={routine.cover_image} alt={routine.name} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="mb-8">
          <h2 className="barlow text-4xl sm:text-5xl font-black tracking-tighter text-white mb-4">{routine.name}</h2>
          <p className="text-[#A1A1AA] text-lg tracking-wide mb-4">{routine.description}</p>
          <div className="flex items-center gap-6 text-[#71717A]">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5" />
              <span className="text-sm uppercase tracking-widest font-bold">{routine.exercises.length} Exercises</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm uppercase tracking-widest font-bold">~{routine.estimated_duration} Minutes</span>
            </div>
          </div>
        </div>

        {/* Exercise List — click any to see detail */}
        <div className="mb-8">
          <h3 className="barlow text-2xl font-black tracking-tight text-white mb-4">Exercises</h3>
          <p className="text-[#71717A] text-sm mb-4">Tap any exercise to see instructions and video</p>
          <div className="space-y-3">
            {routine.exercises.map((exercise, index) => (
              <button
                key={exercise.exercise_id}
                onClick={() => handleExerciseClick(exercise)}
                className="w-full bg-[#1A1A1A] border border-[#27272A] hover:border-[#007AFF] rounded-md p-4 flex items-center gap-4 transition-colors text-left"
              >
                <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                  <img src={exercise.image_url} alt={exercise.exercise_name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="barlow text-lg font-bold tracking-tight text-white mb-1">{exercise.exercise_name}</h4>
                  <p className="text-[#A1A1AA] text-sm">{exercise.muscle_group}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="barlow text-xl font-bold text-white">{exercise.sets} × {exercise.reps}</p>
                  <p className="text-[#71717A] text-xs uppercase tracking-widest">Sets × Reps</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#71717A] flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-[#0A0A0A] border-t border-[#27272A] sm:relative sm:p-0 sm:border-0">
          <button
            onClick={handleStartWorkout}
            className="w-full bg-[#007AFF] hover:bg-[#0066DD] text-white font-bold py-4 text-lg rounded-md transition-colors"
          >
            Start Workout
          </button>
        </div>
      </main>
    </div>
  );
}