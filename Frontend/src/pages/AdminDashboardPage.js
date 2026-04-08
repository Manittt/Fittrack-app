import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
  Users, Flame, Activity, Trophy,
  Copy, RefreshCw, Settings, Dumbbell, Trash2
} from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboardPage() {
  const { user, getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const [gym, setGym] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [gymRes, membersRes, statsRes] = await Promise.all([
        axios.get(`${API}/admin/gym`, { headers: getAuthHeader() }),
        axios.get(`${API}/admin/members`, { headers: getAuthHeader() }),
        axios.get(`${API}/admin/stats`, { headers: getAuthHeader() }),
      ]);
      setGym(gymRes.data);
      setMembers(membersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(gym.invite_code);
    toast.success('Invite code copied!');
  };

  const regenerateCode = async () => {
    if (!window.confirm('This will invalidate the current code. Any unregistered clients will need the new code. Continue?')) return;
    setRegenerating(true);
    try {
      const res = await axios.post(`${API}/admin/gym/regenerate-code`, {}, { headers: getAuthHeader() });
      setGym(res.data);
      toast.success('New invite code generated');
    } catch {
      toast.error('Failed to regenerate code');
    } finally {
      setRegenerating(false);
    }
  };

  const removeMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from your gym? Their account and data will be kept, they just won't be linked to your gym.`)) return;
    try {
      await axios.delete(`${API}/admin/members/${memberId}`, { headers: getAuthHeader() });
      setMembers(members.filter(m => m.id !== memberId));
      toast.success(`${memberName} removed from gym`);
    } catch {
      toast.error('Failed to remove member');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#007AFF] rounded-md flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="barlow text-2xl font-black tracking-tighter text-white leading-none">
                {gym?.name || 'GYM ADMIN'}
              </h1>
              <p className="text-[#71717A] text-xs uppercase tracking-widest">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#A1A1AA] text-sm hidden sm:block">Hi, {user?.name}</span>
            <button
              onClick={() => navigate('/settings')}
              className="text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] p-2 rounded-md transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Invite Code Card */}
        <div className="bg-[#1A1A1A] border border-[#007AFF]/40 rounded-md p-6 mb-8">
          <p className="text-[#A1A1AA] text-xs uppercase tracking-widest font-bold mb-2">Client Invite Code</p>
          <p className="text-[#71717A] text-sm mb-4">
            Share this code with your gym clients. They enter it when registering to be linked to your gym.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-[#0A0A0A] border border-[#27272A] rounded-md px-6 py-3">
              <span className="barlow text-3xl font-black tracking-widest text-[#007AFF]">
                {gym?.invite_code}
              </span>
            </div>
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-2 bg-[#007AFF] hover:bg-[#0066DD] text-white font-bold px-4 py-3 rounded-md transition-colors text-sm uppercase tracking-widest"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button
              onClick={regenerateCode}
              disabled={regenerating}
              className="flex items-center gap-2 bg-[#27272A] hover:bg-[#3f3f46] text-[#A1A1AA] hover:text-white font-bold px-4 py-3 rounded-md transition-colors text-sm uppercase tracking-widest disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-[#007AFF]" />
              <p className="text-[#A1A1AA] text-xs uppercase tracking-widest font-bold">Total Members</p>
            </div>
            <p className="barlow text-4xl font-black tracking-tighter text-white">{stats?.total_members || 0}</p>
          </div>

          <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-[#FF3B30]" />
              <p className="text-[#A1A1AA] text-xs uppercase tracking-widest font-bold">Active This Week</p>
            </div>
            <p className="barlow text-4xl font-black tracking-tighter text-white">{stats?.active_this_week || 0}</p>
          </div>

          <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-[#34C759]" />
              <p className="text-[#A1A1AA] text-xs uppercase tracking-widest font-bold">Active This Month</p>
            </div>
            <p className="barlow text-4xl font-black tracking-tighter text-white">{stats?.active_this_month || 0}</p>
          </div>

          <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-[#FF9F0A]" />
              <p className="text-[#A1A1AA] text-xs uppercase tracking-widest font-bold">Total Workouts</p>
            </div>
            <p className="barlow text-4xl font-black tracking-tighter text-white">{stats?.total_workouts_all_members || 0}</p>
          </div>
        </div>

        {/* Members Table */}
        <div>
          <h2 className="barlow text-2xl font-black tracking-tight text-white mb-4">
            Members <span className="text-[#71717A]">({members.length})</span>
          </h2>

          {members.length === 0 ? (
            <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-12 text-center">
              <Users className="w-12 h-12 text-[#27272A] mx-auto mb-4" />
              <p className="text-[#A1A1AA] text-lg mb-2">No members yet</p>
              <p className="text-[#71717A] text-sm">Share the invite code above with your gym clients</p>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#27272A] bg-[#141414]">
                <p className="col-span-4 text-[#71717A] text-xs uppercase tracking-widest font-bold">Member</p>
                <p className="col-span-2 text-[#71717A] text-xs uppercase tracking-widest font-bold text-center">Workouts</p>
                <p className="col-span-2 text-[#71717A] text-xs uppercase tracking-widest font-bold text-center">Streak</p>
                <p className="col-span-3 text-[#71717A] text-xs uppercase tracking-widest font-bold">Last Active</p>
                <p className="col-span-1"></p>
              </div>

              {/* Table rows */}
              {members.map((member, i) => (
                <div
                  key={member.id}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 items-center ${i !== members.length - 1 ? 'border-b border-[#27272A]' : ''}`}
                >
                  <div className="col-span-4">
                    <p className="barlow text-lg font-bold tracking-tight text-white">{member.name}</p>
                    <p className="text-[#71717A] text-xs">{member.email}</p>
                  </div>
                  <div className="col-span-2 text-center">
                    <p className="barlow text-xl font-bold text-white">{member.total_workouts}</p>
                  </div>
                  <div className="col-span-2 text-center">
                    <p className="barlow text-xl font-bold text-white">
                      {member.current_streak > 0
                        ? <span className="text-[#FF3B30]">{member.current_streak}🔥</span>
                        : <span className="text-[#71717A]">0</span>
                      }
                    </p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-[#A1A1AA] text-sm">
                      {member.last_workout_date
                        ? format(new Date(member.last_workout_date), 'MMM d, yyyy')
                        : <span className="text-[#71717A]">Never</span>
                      }
                    </p>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => removeMember(member.id, member.name)}
                      className="text-[#71717A] hover:text-[#FF3B30] transition-colors p-1 rounded"
                      title="Remove from gym"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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