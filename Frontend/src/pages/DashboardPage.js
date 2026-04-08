import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { Flame, Trophy, Calendar, Dumbbell, Activity, Library, Settings } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DashboardPage() {
  const { user, getAuthHeader } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [dailyRoutine, setDailyRoutine] = useState(null);
  const [allRoutines, setAllRoutines] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);

  const isDark = theme === 'dark';
  const bg       = isDark ? 'bg-[#0A0A0A]'  : 'bg-gray-100';
  const bgHeader = isDark ? 'bg-[#141414]'  : 'bg-white';
  const bgCard   = isDark ? 'bg-[#1A1A1A]'  : 'bg-white';
  const border   = isDark ? 'border-[#27272A]' : 'border-gray-200';
  const textPrimary   = isDark ? 'text-white'    : 'text-gray-900';
  const textSecondary = isDark ? 'text-[#A1A1AA]': 'text-gray-500';
  const textMuted     = isDark ? 'text-[#71717A]': 'text-gray-400';

  useEffect(() => {
    fetchDashboardData();
    // Refetch every time user comes back to this page (fixes stale active workout banner)
    const handleFocus = () => fetchDashboardData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, dailyRes, routinesRes, activeRes] = await Promise.all([
        axios.get(`${API}/progress/stats`, { headers: getAuthHeader() }),
        axios.get(`${API}/routines/daily/today`, { headers: getAuthHeader() }),
        axios.get(`${API}/routines`, { headers: getAuthHeader() }),
        axios.get(`${API}/workouts/active`, { headers: getAuthHeader() })
      ]);
      setStats(statsRes.data);
      setDailyRoutine(dailyRes.data);
      setAllRoutines(routinesRes.data);
      setActiveWorkout(activeRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = async (routineId) => {
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

  if (loading) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center`}>
        <div className={`${textPrimary} text-lg`}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg}`}>
      {/* Header */}
      <header className={`${bgHeader} border-b ${border} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#007AFF] rounded-md flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <h1 className={`barlow text-2xl font-black tracking-tighter ${textPrimary}`}>FITTRACK</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#007AFF] flex items-center justify-center flex-shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="barlow text-sm font-black text-white">{user?.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className={`${textSecondary} text-sm`}>Hi, {user?.name}</span>
            </div>
            <button onClick={() => navigate('/settings')}
              className={`${textSecondary} hover:${textPrimary} hover:${bgCard} p-2 rounded-md transition-colors`}>
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Active Workout Banner */}
        {activeWorkout && (
          <div className="mb-8 bg-[#FF3B30] rounded-md p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-white/80 text-sm uppercase tracking-widest font-bold mb-1">Workout In Progress</p>
                <h3 className="barlow text-2xl font-black tracking-tight text-white">{activeWorkout.routine_name}</h3>
                <p className="text-white/90 text-sm mt-1">
                  {activeWorkout.completed_sets} / {activeWorkout.total_sets} sets completed
                </p>
              </div>
              {/* Plain button — no component, avoids the blank button bug */}
              <button
                onClick={() => navigate(`/workout/${activeWorkout.id}/active`)}
                className="flex-shrink-0 bg-white hover:bg-gray-100 text-[#FF3B30] font-bold px-5 py-2 rounded-md transition-colors text-sm uppercase tracking-widest"
              >
                Resume →
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Flame className="w-5 h-5 text-[#FF3B30]" />, label: 'Streak', value: stats?.current_streak || 0, unit: 'days' },
            { icon: <Trophy className="w-5 h-5 text-[#007AFF]" />, label: 'Total', value: stats?.total_workouts || 0, unit: 'workouts' },
            { icon: <Calendar className="w-5 h-5 text-[#34C759]" />, label: 'This Week', value: stats?.workouts_this_week || 0, unit: 'workouts' },
            { icon: <Activity className="w-5 h-5 text-[#FF9F0A]" />, label: 'This Month', value: stats?.workouts_this_month || 0, unit: 'workouts' },
          ].map((stat) => (
            <div key={stat.label} className={`${bgCard} border ${border} rounded-md p-6`}>
              <div className="flex items-center gap-3 mb-2">
                {stat.icon}
                <p className={`${textSecondary} text-xs uppercase tracking-widest font-bold`}>{stat.label}</p>
              </div>
              <p className={`barlow text-4xl font-black tracking-tighter ${textPrimary}`}>{stat.value}</p>
              <p className={`${textMuted} text-xs mt-1`}>{stat.unit}</p>
            </div>
          ))}
        </div>

        {/* Today's Workout */}
        {dailyRoutine && (
          <div className="mb-8">
            <h2 className={`barlow text-3xl font-black tracking-tight ${textPrimary} mb-4`}>Today's Workout</h2>
            <div className={`${bgCard} border ${border} rounded-md overflow-hidden hover:border-[#007AFF] transition-colors workout-card`}>
              <div className="h-48 overflow-hidden">
                <img src={dailyRoutine.cover_image} alt={dailyRoutine.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 className={`barlow text-2xl font-black tracking-tight ${textPrimary} mb-1`}>{dailyRoutine.name}</h3>
                <p className={`${textSecondary} text-sm tracking-wide mb-3`}>{dailyRoutine.description}</p>
                <div className="flex items-center gap-4 mb-4">
                  <span className={`${textMuted} text-xs uppercase tracking-widest`}>{dailyRoutine.exercises.length} exercises</span>
                  <span className={`${textMuted} text-xs uppercase tracking-widest`}>~{dailyRoutine.estimated_duration} min</span>
                </div>
                <button
                  onClick={() => handleStartWorkout(dailyRoutine.id)}
                  className="w-full bg-[#007AFF] hover:bg-[#0066DD] text-white font-bold py-3 rounded-md transition-colors"
                >
                  Start Workout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* All Workouts */}
        <div className="mb-8">
          <h2 className={`barlow text-3xl font-black tracking-tight ${textPrimary} mb-4`}>All Workouts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allRoutines.map((routine) => (
              <div key={routine.id}
                className={`${bgCard} border ${border} rounded-md overflow-hidden hover:border-[#007AFF] transition-colors workout-card cursor-pointer`}
                onClick={() => navigate(`/workout/${routine.id}`)}>
                <div className="h-32 overflow-hidden">
                  <img src={routine.cover_image} alt={routine.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className={`barlow text-xl font-bold tracking-tight ${textPrimary} mb-1`}>{routine.name}</h3>
                  <p className={`${textSecondary} text-sm mb-3`}>{routine.description}</p>
                  <div className={`flex items-center gap-3 ${textMuted} text-xs uppercase tracking-widest`}>
                    <span>{routine.exercises.length} exercises</span>
                    <span>~{routine.estimated_duration} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Nav */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => navigate('/exercises')}
            className={`${bgCard} border ${border} rounded-md p-6 hover:border-[#007AFF] transition-colors text-left`}>
            <Library className="w-6 h-6 text-[#007AFF] mb-3" />
            <h3 className={`barlow text-xl font-bold tracking-tight ${textPrimary} mb-1`}>Exercise Library</h3>
            <p className={`${textSecondary} text-sm`}>Browse all exercises</p>
          </button>
          <button onClick={() => navigate('/progress')}
            className={`${bgCard} border ${border} rounded-md p-6 hover:border-[#007AFF] transition-colors text-left`}>
            <Activity className="w-6 h-6 text-[#34C759] mb-3" />
            <h3 className={`barlow text-xl font-bold tracking-tight ${textPrimary} mb-1`}>Progress & History</h3>
            <p className={`${textSecondary} text-sm`}>View your stats</p>
          </button>
        </div>
      </main>
    </div>
  );
}