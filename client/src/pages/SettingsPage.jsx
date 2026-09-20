import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { AnimatedTabs } from '../components/ui/AnimatedTabs';
import { 
  Settings as SettingsIcon,
  HardDrive, 
  User, 
  Share2, 
  Sliders, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  Building2,
  MapPin,
  FileText,
  Clock,
  LogOut,
  FolderSync
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
];

export const SettingsPage = ({ onNavigate }) => {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('drive'); // 'drive' | 'profile' | 'sharing' | 'preferences'

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(user?.college || '');
  const [semester, setSemester] = useState(user?.semester || '');
  const [location, setLocation] = useState(user?.location || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || AVATAR_PRESETS[0]);
  const [profileLoading, setProfileLoading] = useState(false);

  // Sync Loading State
  const [syncLoading, setSyncLoading] = useState(false);

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setProfileLoading(true);
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
        toast.success('Profile settings updated successfully!');
      }
    } catch (err) {
      console.error('[Update Profile Error]:', err);
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleManualSyncDrive = async () => {
    setSyncLoading(true);
    try {
      const res = await api.syncDriveVault();
      if (res.success) {
        toast.success(res.message || 'All notes successfully synced to Google Drive!');
      } else {
        toast.error(res.message || 'Google Drive sync was not completed.');
      }
    } catch (err) {
      console.error('[Sync Drive Error]:', err);
      toast.error(err.message || 'Failed to sync with Google Drive.');
    } finally {
      setSyncLoading(false);
    }
  };

  const isDriveConnected = user?.driveConnected || !!user?.driveRootFolderId || !!user?.googleId;

  const tabs = [
    { id: 'drive', label: 'Google Drive & Vault', icon: HardDrive },
    { id: 'profile', label: 'Profile & Identity', icon: User },
    { id: 'sharing', label: 'Cloud Sharing', icon: Share2 },
    { id: 'preferences', label: 'Workspace Preferences', icon: Sliders },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-display tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-black" />
            <span>Settings</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage your Google Drive synchronization, student identity, and workspace defaults
          </p>
        </div>
      </div>

      {/* Settings Tab Navigation */}
      <AnimatedTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content Panels */}
      <AnimatePresence mode="wait">
        
        {/* 1. Google Drive & Vault Settings */}
        {activeTab === 'drive' && (
          <motion.div
            key="drive-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Status Card */}
            <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-zinc-200/90 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${
                    isDriveConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-zinc-100 border-zinc-200 text-zinc-400'
                  }`}>
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-zinc-950 font-display">
                        Google Drive Integration
                      </h3>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isDriveConnected
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isDriveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                        <span>{isDriveConnected ? 'Connected & Active' : 'Disconnected'}</span>
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {isDriveConnected
                        ? `Connected to ${user?.email || 'Google Account'}`
                        : 'Connect your Google account to sync all lecture notes and folders'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="default"
                    size="sm"
                    loading={syncLoading}
                    onClick={handleManualSyncDrive}
                    className="text-xs font-semibold shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1 ${syncLoading ? 'animate-spin' : ''}`} />
                    <span>Sync All Notes Now</span>
                  </Button>
                </div>
              </div>

              {/* Vault Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Drive Vault Folder
                  </span>
                  <p className="text-sm font-bold text-zinc-900 font-mono">
                    /NOTEX_Vault/
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Dedicated folder in your Google Drive root
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Sync Behavior
                  </span>
                  <p className="text-sm font-bold text-zinc-900">
                    Automatic Real-Time
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Saves, renames, and deletions sync instantly
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Privacy &amp; Security
                  </span>
                  <p className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>drive.file Scope</span>
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Only accesses files created by NOTEX
                  </p>
                </div>
              </div>

              {/* Info Alert */}
              <div className="p-4 rounded-2xl bg-zinc-100/80 border border-zinc-200 text-xs text-zinc-600 leading-relaxed">
                <p className="font-semibold text-zinc-900 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
                  <span>How Google Drive Sync Works in NOTEX</span>
                </p>
                Every folder, subfolder, and note you create is mapped to an isolated <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-zinc-200">NOTEX_Vault</code> folder in your personal Google Drive. When you edit a note or delete a folder, changes are automatically propagated to your Google Drive in the background.
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. Profile & Student Identity */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleUpdateProfile} className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-zinc-200/90 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-zinc-950 font-display">
                  Student Profile &amp; Identity
                </h3>
                <p className="text-xs text-zinc-500">
                  Update your public name, university, and academic details
                </p>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Avatar Preset
                </label>
                <div className="flex items-center gap-3">
                  {AVATAR_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(p)}
                      className={`relative w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all ${
                        avatar === p
                          ? 'border-black scale-105 shadow-sm'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p} alt="avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  label="College / University"
                  placeholder="e.g. Stanford University / IIT"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                />

                <Input
                  label="Semester / Year"
                  placeholder="e.g. 5th Sem, Computer Science"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                />

                <Input
                  label="City / Location"
                  placeholder="e.g. Hyderabad, India"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Short Bio / Academic Focus
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Computer Science undergrad focused on Systems & Algorithms"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-300 bg-white p-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-zinc-100">
                <Button
                  type="submit"
                  variant="default"
                  loading={profileLoading}
                  className="text-xs px-5 font-semibold"
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* 3. Temporary Cloud Sharing Tab */}
        {activeTab === 'sharing' && (
          <motion.div
            key="sharing-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-zinc-200/90 shadow-xs space-y-6"
          >
            <div>
              <h3 className="text-base font-bold text-zinc-950 font-display">
                Temporary Cloud Sharing Vault
              </h3>
              <p className="text-xs text-zinc-500">
                Share folders with fellow students via temporary 1-hour cloud links
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-black text-white">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">1-Hour Ephemeral Storage Window</h4>
                  <p className="text-xs text-zinc-500">Links expire automatically after 60 minutes for security</p>
                </div>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                When you share a course folder, NOTEX generates a temporary cloud repository copy. Another logged-in user can paste your 6-character code to clone that entire unit and all notes directly into their personal Google Drive vault.
              </p>
            </div>
          </motion.div>
        )}

        {/* 4. Workspace Preferences */}
        {activeTab === 'preferences' && (
          <motion.div
            key="preferences-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-zinc-200/90 shadow-xs space-y-6"
          >
            <div>
              <h3 className="text-base font-bold text-zinc-950 font-display">
                Workspace Preferences
              </h3>
              <p className="text-xs text-zinc-500">
                Configure default note ordering, XML exports, and session controls
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div>
                  <p className="text-xs font-bold text-zinc-900">XML Practical Demo Mode</p>
                  <p className="text-[11px] text-zinc-500">W3C Compliant XML export engine for lab syllabus</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('xml-demo')}
                  className="text-xs"
                >
                  Open XML Lab
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80">
                <div>
                  <p className="text-xs font-bold text-rose-950">Log Out of Workspace</p>
                  <p className="text-[11px] text-rose-600">End your current session on this device</p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={logout}
                  className="text-xs"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  <span>Log Out</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
