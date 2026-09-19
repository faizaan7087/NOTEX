import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { APP_NAME, APP_CONFIG } from '../../constants/app';
import { 
  Lock, 
  Mail, 
  BookOpen, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

export const LoginForm = ({ onSwitchToRegister, onToggleMode }) => {
  const { login, loginWithGoogle } = useAuth();
  const toast = useToast();
  const handleSwitch = onSwitchToRegister || onToggleMode;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = 'Please provide a valid email';
    }

    if (!password) {
      errs.password = 'Password is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success(`Welcome back to ${APP_NAME}!`);
    } catch (err) {
      console.error('[Login Error]:', err);
      toast.error(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Real Google OAuth Popup Login
  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        // Fetch user profile from Google's OpenID / userinfo endpoint
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`
          }
        });

        if (!userInfoRes.ok) {
          throw new Error('Could not retrieve user info from Google.');
        }

        const googleUser = await userInfoRes.json();

        const res = await loginWithGoogle({
          accessToken: tokenResponse.access_token,
          userInfo: {
            id: googleUser.sub,
            name: googleUser.name,
            email: googleUser.email,
            picture: googleUser.picture
          }
        });

        if (res.success) {
          toast.success(`Welcome back, ${googleUser.name}!`);
        }
      } catch (err) {
        console.error('[Google OAuth Error]:', err);
        toast.error(err.message || 'Google Sign-In failed.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error('[Google OAuth Popup Error]:', errorResponse);
      setGoogleLoading(false);
      if (errorResponse.error === 'popup_closed_by_user') {
        toast.info('Google Sign-In was closed.');
      } else {
        toast.error(`Google Sign-In Error: ${errorResponse.error_description || errorResponse.error || 'Please check Google Cloud configuration.'}`);
      }
    },
    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file'
  });

  const handleQuickDemoFill = () => {
    setEmail('student@notex.edu');
    setPassword('password123');
    setErrors({});
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black text-white p-0.5 shadow-lg mb-4 animate-float">
          <BookOpen className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-display tracking-tight">
          Welcome to <span className="underline underline-offset-4 decoration-black/30">{APP_NAME}</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-1 font-mono">
          "{APP_CONFIG.TAGLINE}"
        </p>
      </div>

      {/* Login Card */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-5">
        
        {/* Google One-Click Login Button */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => triggerGoogleLogin()}
            disabled={googleLoading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 font-bold flex items-center justify-center gap-3 transition-all shadow-2xs hover:border-black group"
          >
            {/* Official Google G Logo SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span className="text-sm font-semibold">
              {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </span>
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
            <HardDrive className="w-3 h-3 text-emerald-600" />
            <span>Stores notes &amp; folders directly in your Google Drive</span>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-zinc-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 shrink-0">
            or sign in with email
          </span>
          <div className="border-t border-zinc-200 w-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="College Email"
            type="email"
            icon={Mail}
            placeholder="student@college.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            error={errors.email}
            required
          />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: null });
            }}
            error={errors.password}
            required
          />

          <Button
            type="submit"
            variant="default"
            size="lg"
            loading={loading}
            className="w-full font-bold mt-2 shadow-sm"
          >
            <span>Sign In to {APP_NAME}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          {/* Quick Demo Autofill Button */}
          <button
            type="button"
            onClick={handleQuickDemoFill}
            className="w-full py-2 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 border border-zinc-200 flex items-center justify-center gap-2 transition-all mt-3"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
            <span>Fill Demo Credentials (Auto-Fill)</span>
          </button>
        </form>

        {/* Switch to Register */}
        <div className="pt-4 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-500">
            Don't have a student account yet?{' '}
            <button
              type="button"
              onClick={handleSwitch}
              className="font-semibold text-black hover:text-zinc-700 underline underline-offset-4 transition-colors"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
