import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME, APP_CONFIG } from '../../constants/app';
import { GooeyInput } from '../ui/GooeyInput';
import { 
  BookOpen, 
  Settings as SettingsIcon,
  LogOut, 
  GraduationCap, 
  Menu,
  ChevronDown,
  User,
  FileCode2
} from 'lucide-react';

export const Navbar = ({
  onToggleSidebar,
  activePage,
  navigateTo,
  searchQuery,
  onSearchChange,
  onSearchSubmit
}) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (val) => {
    onSearchChange?.(val);
    if (activePage !== 'notes') {
      navigateTo('notes');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Left: Mobile Sidebar Toggle + Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-zinc-600 hover:text-black hover:bg-white/80 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => navigateTo('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-black text-white p-0.5 shadow-sm group-hover:scale-105 transition-all">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-extrabold text-xl tracking-tight text-zinc-950">
                    {APP_NAME}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-white/80 text-zinc-900 border border-zinc-200 shadow-2xs">
                    Vault
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 hidden sm:block">
                  {APP_CONFIG.TAGLINE}
                </p>
              </div>
            </button>
          </div>

          {/* Center: Aceternity Gooey Search Bar */}
          <div className="flex-1 max-w-lg mx-2">
            <GooeyInput
              value={searchQuery || ''}
              onChange={(val) => {
                onSearchChange?.(val);
                if (val && activePage !== 'notes') {
                  navigateTo('notes');
                }
              }}
              onSubmit={handleSearchSubmit}
              onClear={() => onSearchChange?.('')}
              className="w-full"
            />
          </div>

          {/* Right: Settings Icon & User Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Settings Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateTo('settings')}
              className={`p-2.5 rounded-2xl border transition-all ${
                activePage === 'settings'
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white/80 text-zinc-700 hover:text-black hover:bg-white border-zinc-200/90 shadow-2xs'
              }`}
              title="Workspace & Google Drive Settings"
            >
              <SettingsIcon className={`w-4 h-4 ${activePage === 'settings' ? 'animate-spin-slow' : ''}`} />
            </motion.button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-white/80 border border-transparent hover:border-zinc-200 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-zinc-900 leading-tight">
                    {user?.name ? user.name.split(' ')[0] : 'Student'}
                  </p>
                  <p className="text-[10px] text-zinc-400 leading-tight truncate max-w-[90px]">
                    {user?.semester || 'Vault User'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden lg:block" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-modal p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-zinc-900 shadow-2xl">
                  <div className="px-3 py-2 border-b border-zinc-200/60">
                    <p className="text-xs font-semibold text-zinc-900">{user?.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-zinc-600">
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{user?.college || 'University'}</span>
                    </div>
                  </div>

                  <div className="pt-1.5 space-y-1">
                    <button
                      onClick={() => {
                        navigateTo('settings');
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-800 hover:text-black hover:bg-white/90 rounded-xl transition-colors"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      <span>Settings &amp; Google Drive</span>
                    </button>

                    <button
                      onClick={() => {
                        navigateTo('xml-demo');
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 hover:text-black hover:bg-white/90 rounded-xl transition-colors"
                    >
                      <FileCode2 className="w-4 h-4" />
                      <span>XML Practical Engine</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
