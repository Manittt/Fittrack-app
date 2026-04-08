import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Dumbbell, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password, inviteCode.trim() || null);
      toast.success('Account created! Check your email for a verification code.');
      navigate('/verify-email', { state: { email } });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#007AFF] rounded-md mb-4">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="barlow text-4xl font-black tracking-tighter text-white mb-2">FITTRACK</h1>
          <p className="text-[#A1A1AA] tracking-wide">Start your fitness journey today</p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-8">
          <h2 className="barlow text-2xl font-bold tracking-tight text-white mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-white uppercase tracking-widest">Name</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="bg-[#0A0A0A] border-[#27272A] text-white focus:border-[#007AFF]" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white uppercase tracking-widest">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="bg-[#0A0A0A] border-[#27272A] text-white focus:border-[#007AFF]" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white uppercase tracking-widest">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="bg-[#0A0A0A] border-[#27272A] text-white focus:border-[#007AFF] pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#007AFF] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteCode" className="text-sm font-medium text-white uppercase tracking-widest">
                Gym Invite Code <span className="text-[#71717A] normal-case tracking-normal">(optional)</span>
              </Label>
              <Input id="inviteCode" type="text" value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. GYM3X7K2"
                className="bg-[#0A0A0A] border-[#27272A] text-white focus:border-[#007AFF] uppercase" />
              <p className="text-[#71717A] text-xs">Got a code from your gym? Enter it here to link your account.</p>
            </div>

            <Button type="submit" disabled={loading}
              className="w-full bg-[#007AFF] hover:bg-[#0066DD] text-white font-bold py-3 rounded-md">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#A1A1AA] text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-[#007AFF] hover:text-[#0066DD] font-medium">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}