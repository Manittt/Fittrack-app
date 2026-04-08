import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { ArrowLeft, Sun, Moon, LogOut, Shield, Camera, Check, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, getAuthHeader, setUserFromResponse } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Profile editing state
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar_url || null);
  const fileInputRef = useRef(null);

  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim() === user?.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await axios.patch(
        `${API}/auth/profile`,
        { name: newName.trim() },
        { headers: getAuthHeader() }
      );
      setUserFromResponse(res.data);
      toast.success('Name updated!');
      setEditingName(false);
    } catch {
      toast.error('Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    // Convert to base64 and store — simple approach without a file server
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      try {
        const res = await axios.patch(
          `${API}/auth/profile`,
          { avatar_url: base64 },
          { headers: getAuthHeader() }
        );
        setUserFromResponse(res.data);
        setAvatar(base64);
        toast.success('Profile picture updated!');
      } catch {
        toast.error('Failed to update picture');
      }
    };
    reader.readAsDataURL(file);
  };

  const bg       = isDark ? 'bg-[#0A0A0A]'  : 'bg-[#F4F4F5]';
  const bgCard   = isDark ? 'bg-[#1A1A1A]'  : 'bg-white';
  const bgHeader = isDark ? 'bg-[#141414]'  : 'bg-white';
  const border   = isDark ? 'border-[#27272A]' : 'border-[#E4E4E7]';
  const divider  = isDark ? 'divide-[#27272A]' : 'divide-[#E4E4E7]';
  const textPrimary   = isDark ? 'text-white'    : 'text-[#09090B]';
  const textSecondary = isDark ? 'text-[#A1A1AA]': 'text-[#52525B]';
  const textMuted     = isDark ? 'text-[#71717A]': 'text-[#A1A1AA]';
  const inputBg       = isDark ? 'bg-[#0A0A0A] border-[#27272A]' : 'bg-[#F4F4F5] border-[#E4E4E7]';
  const hoverRow      = isDark ? 'hover:bg-[#27272A]/50' : 'hover:bg-[#F4F4F5]';

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-200`}>
      {/* Header */}
      <header className={`${bgHeader} border-b ${border} sticky top-0 z-50`}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/')}
            className={`${textSecondary} hover:${textPrimary} hover:${bgCard} p-2 rounded-md transition-colors`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className={`barlow text-2xl font-black tracking-tighter ${textPrimary}`}>Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── Profile card ── */}
        <div className={`${bgCard} border ${border} rounded-md p-6`}>
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#007AFF] flex items-center justify-center">
                {avatar || user?.avatar_url ? (
                  <img src={avatar || user?.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="barlow text-2xl font-black text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#007AFF] hover:bg-[#0066DD] rounded-full flex items-center justify-center transition-colors"
              >
                <Camera className="w-3 h-3 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                    className={`flex-1 ${inputBg} border rounded-md px-3 py-1.5 text-sm ${textPrimary} focus:outline-none focus:border-[#007AFF]`}
                  />
                  <button onClick={handleSaveName} disabled={savingName}
                    className="text-[#34C759] hover:text-green-400 transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingName(false); setNewName(user?.name); }}
                    className={`${textMuted} hover:${textPrimary} transition-colors`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className={`barlow text-xl font-bold ${textPrimary} truncate`}>{user?.name}</p>
                  <button onClick={() => setEditingName(true)}
                    className="text-[#007AFF] text-xs font-bold uppercase tracking-widest hover:text-[#0066DD] transition-colors flex-shrink-0">
                    Edit
                  </button>
                </div>
              )}
              <p className={`${textMuted} text-sm truncate`}>{user?.email}</p>
              {user?.gym_id && (
                <p className="text-[#007AFF] text-xs uppercase tracking-widest mt-1">Gym Member</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Appearance ── */}
        <div>
          <p className={`${textMuted} text-xs uppercase tracking-widest font-bold mb-3 px-1`}>Appearance</p>
          <div className={`${bgCard} border ${border} rounded-md`}>
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                {isDark
                  ? <Moon className={`w-5 h-5 ${textSecondary}`} />
                  : <Sun className="w-5 h-5 text-[#FF9F0A]" />
                }
                <div>
                  <p className={`${textPrimary} font-medium`}>Theme</p>
                  <p className={`${textMuted} text-sm`}>{isDark ? 'Dark mode' : 'Light mode'}</p>
                </div>
              </div>
              {/* Toggle: w-12=48px container, w-5=20px thumb, 4px padding */}
              {/* Dark: thumb at left (translate-x-1=4px) */}
              {/* Light: thumb at right (48-20-4=24px = translate-x-6) */}
              <button
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0 ${
                  isDark ? 'bg-[#27272A]' : 'bg-[#007AFF]'
                }`}
                aria-label="Toggle theme"
              >
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: isDark ? '2px' : '26px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'left 0.3s ease',
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Account ── */}
        <div>
          <p className={`${textMuted} text-xs uppercase tracking-widest font-bold mb-3 px-1`}>Account</p>
          <div className={`${bgCard} border ${border} rounded-md`}>
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#34C759]" />
                <div>
                  <p className={`${textPrimary} font-medium`}>Email Verification</p>
                  <p className={`${textMuted} text-sm`}>Your email is verified</p>
                </div>
              </div>
              <span className="text-[#34C759] text-xs font-bold uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>

        {/* ── Logout ── */}
        <div>
          <p className={`${textMuted} text-xs uppercase tracking-widest font-bold mb-3 px-1`}>Account Actions</p>
          <div className={`${bgCard} border ${border} rounded-md overflow-hidden`}>
            {!showLogoutConfirm ? (
              <button onClick={() => setShowLogoutConfirm(true)}
                className={`w-full flex items-center justify-between px-6 py-4 ${hoverRow} transition-colors`}>
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-[#FF3B30]" />
                  <p className="text-[#FF3B30] font-medium">Log Out</p>
                </div>
                <span className={`${textMuted} text-lg`}>›</span>
              </button>
            ) : (
              <div className="px-6 py-5">
                <p className={`${textPrimary} font-medium mb-1`}>Are you sure you want to log out?</p>
                <p className={`${textMuted} text-sm mb-4`}>You'll need to log back in to access your account.</p>
                <div className="flex gap-3">
                  <button onClick={handleLogout}
                    className="flex-1 bg-[#FF3B30] hover:bg-[#CC2F26] text-white font-bold py-2 rounded-md transition-colors text-sm">
                    Yes, log out
                  </button>
                  <button onClick={() => setShowLogoutConfirm(false)}
                    className={`flex-1 ${isDark ? 'bg-[#27272A] hover:bg-[#3f3f46]' : 'bg-[#E4E4E7] hover:bg-[#D4D4D8]'} ${textPrimary} font-bold py-2 rounded-md transition-colors text-sm`}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}