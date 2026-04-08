import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Dumbbell, Mail } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserFromResponse } = useAuth();

  // Email is passed via navigation state from RegisterPage
  const email = location.state?.email || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef([]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) navigate('/register');
  }, [email]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleInput = (index, value) => {
    // Allow only digits
    if (!/^\d?$/.test(value)) return;

    const updated = [...code];
    updated[index] = value;
    setCode(updated);

    // Auto-advance to next box
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (value && index === 5) {
      const fullCode = [...updated].join('');
      if (fullCode.length === 6) handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace goes to previous box
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (fullCode) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/verify-email`, {
        email,
        code: fullCode
      });
      setUserFromResponse(response.data);
      toast.success('Email verified! Welcome to FitTrack 🎉');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid code');
      // Clear inputs on error
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await axios.post(`${API}/auth/resend-verification`, { email });
      toast.success('New code sent to your email');
      setCooldown(60); // 60s cooldown before they can resend again
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to resend code');
    } finally {
      setResending(false);
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
        </div>

        <div className="bg-[#1A1A1A] border border-[#27272A] rounded-md p-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-6 h-6 text-[#007AFF]" />
            <h2 className="barlow text-2xl font-bold tracking-tight text-white">Check your email</h2>
          </div>
          <p className="text-[#A1A1AA] text-sm mb-1">We sent a 6-digit code to:</p>
          <p className="text-white font-medium mb-8">{email}</p>

          {/* 6-digit code input */}
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-md border-2 bg-[#0A0A0A] text-white transition-colors focus:outline-none
                  ${digit ? 'border-[#007AFF]' : 'border-[#27272A]'}
                  focus:border-[#007AFF]`}
                disabled={loading}
              />
            ))}
          </div>

          <button
            onClick={() => handleVerify(code.join(''))}
            disabled={loading || code.join('').length < 6}
            className="w-full bg-[#007AFF] hover:bg-[#0066DD] text-white font-bold py-3 rounded-md disabled:opacity-50 transition-colors mb-4"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <div className="text-center">
            <p className="text-[#71717A] text-sm mb-2">Didn't get the email?</p>
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-[#007AFF] hover:text-[#0066DD] text-sm font-medium disabled:text-[#71717A] disabled:cursor-not-allowed transition-colors"
            >
              {cooldown > 0
                ? `Resend in ${cooldown}s`
                : resending ? 'Sending...' : 'Resend code'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}