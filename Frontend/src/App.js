import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Toaster } from 'sonner';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WorkoutDetailPage from './pages/WorkoutDetailPage';
import ActiveWorkoutPage from './pages/ActiveWorkoutPage';
import ExercisesPage from './pages/ExercisesPage';
import ProgressPage from './pages/ProgressPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#0A0A0A] dark:bg-[#0A0A0A] flex items-center justify-center"><div className="text-white text-lg">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><div className="text-white text-lg">Loading...</div></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const HomeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><div className="text-white text-lg">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'gym_owner') return <AdminDashboardPage />;
  return <DashboardPage />;
};

// This wrapper applies the theme class to the root app div
function ThemedApp() {
  const { theme } = useTheme();
  return (
    <div className={`App min-h-screen ${theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-[#0A0A0A] text-white'}`}>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1A1A1A', border: '1px solid #27272A', color: '#FFFFFF' } }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login"        element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register"     element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/"             element={<HomeRoute />} />
          {/* IMPORTANT: /active route must come BEFORE /:routineId to avoid clash */}
          <Route path="/workout/:workoutId/active" element={<ProtectedRoute><ActiveWorkoutPage /></ProtectedRoute>} />
          <Route path="/workout/:routineId"        element={<ProtectedRoute><WorkoutDetailPage /></ProtectedRoute>} />
          <Route path="/exercises"   element={<ProtectedRoute><ExercisesPage /></ProtectedRoute>} />
          <Route path="/progress"    element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
          <Route path="/settings"    element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;