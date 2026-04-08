import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Check, X, Play } from 'lucide-react';
import ExerciseDetailModal from '../components/ExerciseDetailModal';
import RestTimer from '../components/RestTimer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ActiveWorkoutPage() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoExercise, setVideoExercise] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseDetails, setExerciseDetails] = useState({});
  // Tracks which exercise index is currently resting
  const [restingExerciseIndex, setRestingExerciseIndex] = useState(null);

  // Converts YouTube watch URL to embed URL
  const toEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
  };

  useEffect(() => {
    fetchWorkout();
  }, [workoutId]);

  const fetchWorkout = async () => {
    try {
      const response = await axios.get(`${API}/workouts/active`, {
        headers: getAuthHeader()
      });
      
      if (!response.data || response.data.id !== workoutId) {
        toast.error('Workout not found');
        navigate('/');
        return;
      }

      setWorkout(response.data);
      setExercises(response.data.exercises || []);
    } catch (error) {
      toast.error('Failed to load workout');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const toggleSet = async (exerciseIndex, setNumber) => {
    const updatedExercises = [...exercises];
    const exercise = updatedExercises[exerciseIndex];

    const wasCompleting = exercise.completed_sets !== setNumber;

    if (exercise.completed_sets === setNumber) {
      exercise.completed_sets = setNumber - 1;
      // Unchecking a set — hide rest timer for this exercise
      if (restingExerciseIndex === exerciseIndex) setRestingExerciseIndex(null);
    } else {
      exercise.completed_sets = setNumber;
      // Just completed a set — show rest timer (unless it's the last set)
      if (wasCompleting && setNumber < exercise.sets) {
        setRestingExerciseIndex(exerciseIndex);
      }
    }

    setExercises(updatedExercises);

    try {
      await axios.put(
        `${API}/workouts/${workoutId}`,
        { exercises: updatedExercises },
        { headers: getAuthHeader() }
      );
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      await axios.put(
        `${API}/workouts/${workoutId}/complete`,
        { exercises },
        { headers: getAuthHeader() }
      );
      toast.success('Workout completed! Great job!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to complete workout');
    }
  };

  const handleCancelWorkout = () => {
    if (window.confirm('Are you sure you want to cancel this workout?')) {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  const handleExerciseClick = async (exercise) => {
    if (exerciseDetails[exercise.exercise_id]) {
      setSelectedExercise(exerciseDetails[exercise.exercise_id]);
      return;
    }
    try {
      const res = await axios.get(`${API}/exercises/${exercise.exercise_id}`, { headers: getAuthHeader() });
      const full = { ...exercise, ...res.data };
      setExerciseDetails(prev => ({ ...prev, [exercise.exercise_id]: full }));
      setSelectedExercise(full);
    } catch {
      setSelectedExercise(exercise);
    }
  };

  if (!workout) return null;

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const completedSets = exercises.reduce((sum, ex) => sum + ex.completed_sets, 0);
  const progressPercent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      {/* Exercise detail modal */}
      {selectedExercise && (
        <ExerciseDetailModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
      )}

      {/* Video Modal */}
      {videoExercise && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setVideoExercise(null)}>
          <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="barlow text-xl font-black text-white">{videoExercise.exercise_name}</h3>
              <button onClick={() => setVideoExercise(null)} className="text-[#A1A1AA] hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-[#1A1A1A]">
              <iframe
                src={toEmbedUrl(videoExercise.video_url)}
                title={videoExercise.exercise_name}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-[#141414] border-b border-[#27272A]/40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="barlow text-xl sm:text-2xl font-black tracking-tighter text-white" data-testid="workout-title">
              {workout.routine_name}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancelWorkout}
              className="text-[#FF3B30] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10"
              data-testid="cancel-workout-button"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-[#27272A] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#007AFF] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
                data-testid="progress-bar"
              />
            </div>
            <p className="text-[#A1A1AA] text-xs mt-2 uppercase tracking-widest font-bold" data-testid="progress-text">
              {completedSets} / {totalSets} Sets Completed
            </p>
          </div>
        </div>
      </header>

      {/* Exercises */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          {exercises.map((exercise, exerciseIndex) => (
            <div
              key={exercise.exercise_id}
              className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-6"
              data-testid={`exercise-card-${exerciseIndex}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <button
                  onClick={() => handleExerciseClick(exercise)}
                  className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={exercise.image_url}
                    alt={exercise.exercise_name}
                    className="w-full h-full object-cover"
                  />
                </button>
                <div className="flex-1">
                  <button
                    onClick={() => handleExerciseClick(exercise)}
                    className="text-left group"
                  >
                    <h3 className="barlow text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-[#007AFF] transition-colors mb-0.5">
                      {exercise.exercise_name}
                    </h3>
                    <p className="text-[#007AFF] text-xs uppercase tracking-widest font-bold">Tap for instructions & video</p>
                  </button>
                  <p className="text-[#A1A1AA] text-sm uppercase tracking-widest mt-1">{exercise.muscle_group}</p>
                  <p className="text-[#71717A] text-sm mt-1">{exercise.sets} sets × {exercise.reps} reps</p>
                </div>
              </div>

              {/* Set Checkboxes - Large Touch Targets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: exercise.sets }).map((_, setIndex) => {
                  const setNumber = setIndex + 1;
                  const isCompleted = exercise.completed_sets >= setNumber;
                  
                  return (
                    <button
                      key={setIndex}
                      onClick={() => toggleSet(exerciseIndex, setNumber)}
                      className={`p-4 rounded-md border-2 transition-all ${
                        isCompleted
                          ? 'bg-[#007AFF]/10 border-[#007AFF]'
                          : 'bg-[#0A0A0A] border-[#27272A] hover:border-[#3f3f46]'
                      }`}
                      data-testid={`set-button-${exerciseIndex}-${setIndex}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="barlow text-lg font-bold text-white">
                          Set {setNumber}
                        </span>
                        <div
                          className={`w-8 h-8 rounded-md flex items-center justify-center ${
                            isCompleted ? 'bg-[#007AFF]' : 'bg-[#27272A]'
                          }`}
                        >
                          {isCompleted && <Check className="w-5 h-5 text-white" />}
                        </div>
                      </div>
                      <p className="text-left text-[#A1A1AA] text-sm mt-1">{exercise.reps} reps</p>
                    </button>
                  );
                })}
              </div>

              {/* Rest timer — appears after completing a set, before the last */}
              {restingExerciseIndex === exerciseIndex && (
                <RestTimer onDone={() => setRestingExerciseIndex(null)} />
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Complete Button - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A0A0A] border-t border-[#27272A]">
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={handleCompleteWorkout}
            disabled={completedSets === 0}
            className="w-full bg-[#34C759] hover:bg-[#2BA647] disabled:bg-[#27272A] text-white font-bold py-4 text-lg"
            data-testid="complete-workout-button"
          >
            Complete Workout
          </Button>
        </div>
      </div>
    </div>
  );
}