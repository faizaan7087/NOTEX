import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { APP_NAME, APP_CONFIG } from '../constants/app';
import { 
  User, 
  Mail, 
  Building2, 
  GraduationCap, 
  MapPin, 
  FileText, 
  HardDrive, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Camera,
  Layers
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
];

export const ProfilePage = ({ onCompleteOnboarding, isFirstTime = false }) => {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(user?.college || '');
  const [semester, setSemester] = useState(user?.semester || '');
  const [location, setLocation] = useState(user?.location || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || AVATAR_PRESETS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCollege(user.college || '');
      setSemester(user.semester || '');
      setLocation(user.location || '');
      setBio(user.bio || '');
      if (user.avatar) setAvatar(user.avatar);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please provide your name.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.updateProfile({
        name: name.trim(),
        college: college.trim(),
        semester: semester.trim(),
        location: location.trim(),
        bio: bio.trim(),
        avatar
      });

      if (res.success) {
        setUser(res.user);
        toast.success(isFirstTime ? 'Welcome to your workspace! Profile setup complete.' : 'Profile updated successfully!');
        if (onCompleteOnboarding) {
          onCompleteOnboarding();
        }
      }
    } catch (err) {
      console.error('[Update Profile Error]:', err);
      toast.error(err.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  const isDriveConnected = user?.driveConnected || !!user?.driveRootFolderId || !!user?.googleId;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-zinc-200 text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>{isFirstTime ? 'First-Time Setup' : 'Student Identity & Workspace'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-display tracking-tight">
              {isFirstTime ? 'Complete Your Student Profile' : 'Account Details & Settings'}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-xl leading-relaxed">
              Personalize your academic identity. These details help attribute you as the author when you share folder repositories with classmates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-white/90 border border-zinc-200 shadow-2xs space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                <HardDrive className={`w-4 h-4 ${isDriveConnected ? 'text-emerald-600' : 'text-zinc-500'}`} />
                <span>{isDriveConnected ? 'Google Drive Active' : 'Local Workspace'}</span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                {isDriveConnected ? 'Vault: NOTEX_Vault' : 'Auto-sync ready'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Avatar Preset Selector */}
        <div className="p-6 rounded-3xl glass-card space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 font-display">
              Choose Profile Avatar
            </label>
            <p className="text-xs text-zinc-500">
              Select an avatar to represent you across notes, comments, and shared repositories.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {AVATAR_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatar(preset)}
                className={`relative w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all group ${
                  avatar === preset ? 'border-black ring-2 ring-black/20 scale-105 shadow-md' : 'border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={preset} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                {avatar === preset && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Core Personal Details Card */}
        <div className="p-6 sm:p-8 rounded-3xl glass-card space-y-6">
          <h3 className="text-base font-bold text-zinc-950 font-display flex items-center gap-2 border-b border-zinc-200/80 pb-3">
            <User className="w-4 h-4 text-black" />
            <span>Academic &amp; Student Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Full Name *"
              type="text"
              icon={User}
              placeholder="e.g. Faizaan Khan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="College Email Address (Read-only)"
              type="email"
              icon={Mail}
              value={user?.email || ''}
              disabled
              className="opacity-75 bg-zinc-100"
            />

            <Input
              label="College / Institute Name (Optional)"
              type="text"
              icon={Building2}
              placeholder="e.g. University Institute of Technology"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
            />

            <Input
              label="Semester / Branch (Optional)"
              type="text"
              icon={GraduationCap}
              placeholder="e.g. Semester 6 - Computer Science"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            />

            <div className="sm:col-span-2">
              <Input
                label="Where Do You Live / City (Optional)"
                type="text"
                icon={MapPin}
                placeholder="e.g. Bangalore, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 font-display flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-500" />
                <span>Short Bio / Academic Focus (Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Computer Science student focusing on Distributed Systems, Big Data Analytics, and Database Architectures."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3.5 text-sm bg-white/90 border border-zinc-300 rounded-2xl text-zinc-900 focus:outline-none focus:border-black shadow-2xs font-sans resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit / Proceed Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isFirstTime && (
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={onCompleteOnboarding}
            >
              Skip for now
            </Button>
          )}

          <Button
            type="submit"
            variant="default"
            size="lg"
            loading={loading}
            className="font-bold shadow-md px-8"
          >
            <span>{isFirstTime ? 'Save & Go to Dashboard' : 'Save Profile Changes'}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </form>

    </div>
  );
};
