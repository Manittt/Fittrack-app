import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Trophy, Flame, Calendar, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProgressPage() {
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const [statsRes, chartRes, historyRes] = await Promise.all([
        axios.get(`${API}/progress/stats`, { headers: getAuthHeader() }),
        axios.get(`${API}/progress/chart-data`, { headers: getAuthHeader() }),
        axios.get(`${API}/workouts/history`, { headers: getAuthHeader() })
      ]);

      setStats(statsRes.data);
      setChartData(chartRes.data);
      setWorkoutHistory(historyRes.data);
    } catch (error) {
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="bg-[#141414] border-b border-[#27272A]/40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A]"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="barlow text-2xl font-black tracking-tighter text-white" data-testid="page-title">
            Progress & Stats
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-6" data-testid="current-streak-card">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-[#FF3B30]" />
              <p className="text-[#A1A1AA] text-xs uppercase tracking-widest font-bold">Current Streak</p>
            </div>
            <p className="barlow text-4xl font-black tracking-tighter text-white">{stats?.current_streak || 0}</p>
            <p className="text-[#71717A] text-xs mt-1">days</p>
          </div>

          <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-6" data-testid="longest-streak-card">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-[#FF9F0A]" />
              <p className="text-[#A1A1AA] text-xs uppercase tracking-widest font-bold">Best Streak</p>
            </div>
            <p className="barlow text-4xl font-black tracking-tighter text-white">{stats?.longest_streak || 0}</p>
            <p className="text-[#71717A] text-xs mt-1">days</p>
          </div>

          <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-6" data-testid="week-workouts-card">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-[#007AFF]" />
              <p className="text-[#A1A1AA] text-xs uppercase tracking-widest font-bold">This Week</p>
            </div>
            <p className="barlow text-4xl font-black tracking-tighter text-white">{stats?.workouts_this_week || 0}</p>
            <p className="text-[#71717A] text-xs mt-1">workouts</p>
          </div>

          <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-6" data-testid="total-workouts-card">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#34C759]" />
              <p className="text-[#A1A1AA] text-xs uppercase tracking-widest font-bold">Total</p>
            </div>
            <p className="barlow text-4xl font-black tracking-tighter text-white">{stats?.total_workouts || 0}</p>
            <p className="text-[#71717A] text-xs mt-1">workouts</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-6 mb-8">
          <h2 className="barlow text-2xl font-black tracking-tight text-white mb-4">Last 30 Days</h2>
          <div className="h-64" data-testid="progress-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis
                  dataKey="date"
                  stroke="#71717A"
                  fontSize={12}
                  tickFormatter={(value) => {
                    try {
                      return format(new Date(value), 'MMM d');
                    } catch {
                      return value;
                    }
                  }}
                />
                <YAxis stroke="#71717A" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #27272A',
                    borderRadius: '6px',
                    color: '#FFFFFF'
                  }}
                  labelFormatter={(value) => {
                    try {
                      return format(new Date(value), 'MMM d, yyyy');
                    } catch {
                      return value;
                    }
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sets"
                  stroke="#007AFF"
                  strokeWidth={2}
                  dot={{ fill: '#007AFF', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Sets Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Workout History */}
        <div>
          <h2 className="barlow text-2xl font-black tracking-tight text-white mb-4">Recent Workouts</h2>
          {workoutHistory.length === 0 ? (
            <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-8 text-center">
              <p className="text-[#A1A1AA]">No completed workouts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workoutHistory.map((workout) => (
                <div
                  key={workout.id}
                  className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-4 flex items-center justify-between"
                  data-testid={`history-item-${workout.id}`}
                >
                  <div>
                    <h3 className="barlow text-lg font-bold tracking-tight text-white mb-1">
                      {workout.routine_name}
                    </h3>
                    <p className="text-[#A1A1AA] text-sm">
                      {format(new Date(workout.completed_at), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="barlow text-xl font-bold text-white">{workout.completed_sets}</p>
                    <p className="text-[#71717A] text-xs uppercase tracking-widest">sets</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}