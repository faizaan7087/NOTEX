import React, { useState, useRef, useEffect } from 'react';
import { 
  motion, 
  AnimatePresence, 
  useScroll, 
  useMotionValueEvent 
} from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME, APP_CONFIG } from '../../constants/app';
import { 
  BookOpen, 
  LayoutDashboard,
  FileCode2,
  Search, 
  Settings as SettingsIcon,
  LogOut, 
  GraduationCap, 
  Menu,
  ChevronDown,
  User,
  PlusCircle,
  FolderPlus
} from 'lucide-react';
import { cn } from '../../utils/cn';

export const Navbar = ({
  onToggleSidebar,
  activePage,
  navigateTo,
  onOpenSearch,
  searchQuery,
  onSearchChange,
  className
}) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const dropdownRef = useRef(null);

  const { scrollY } = useScroll();

  // Smart Aceternity scroll behavior: show when scrolling up or at top, hide on scroll down
  useMotionValueEvent(scrollY, "change", (current) => {
    if (typeof current === "number") {
      const previous = scrollY.getPrevious() ?? 0;
      const direction = current - previous;

      // Always show near the top
      if (current < 50) {
        setVisible(true);
      } else {
        if (direction < 0) {
          setVisible(true); // Scrolling up
        } else if (direction > 0 && current > 80) {
          setVisible(false); // Scrolling down
          setDropdownOpen(false); // Close dropdown if open
        }
      }
    }
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      onClick: () => navigateTo('dashboard'),
    },
    {
      id: 'notes',
      name: 'Notes',
      icon: <BookOpen className="w-4 h-4" />,
      onClick: () => navigateTo('notes'),
    },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.header
        initial={{
          opacity: 1,
          y: -100,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.22,
          ease: "easeOut"
        }}
        className={cn(
          "fixed top-4 sm:top-5 inset-x-0 mx-auto z-50 w-[94%] max-w-4xl",
          className
        )}
      >
        <div className="relative flex items-center justify-between px-3 sm:px-4 py-2 rounded-full bg-white/85 backdrop-blur-xl border border-zinc-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
          
          {/* Left: Mobile Toggle & Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Sidebar Hamburger */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 rounded-full text-zinc-600 hover:text-black hover:bg-zinc-100 transition-colors focus:outline-none"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Brand Logo Pill */}
            <button
              onClick={() => navigateTo('dashboard')}
              className="flex items-center gap-2 group text-left focus:outline-none select-none pl-1"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-black text-white shadow-xs group-hover:scale-105 transition-transform">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <span className="font-display font-extrabold text-sm sm:text-base tracking-tight text-zinc-950">
                {APP_NAME}
              </span>
              <span className="hidden md:inline-flex text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                Vault
              </span>
            </button>
          </div>

          {/* Center: Aceternity Nav Tabs with Active Pill Highlight */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors z-10",
                    isActive
                      ? "text-black"
                      : "text-zinc-600 hover:text-black hover:bg-zinc-100/70"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="floatingNavActivePill"
                      className="absolute inset-0 rounded-full bg-zinc-100 border border-zinc-200/80 -z-10 shadow-2xs"
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    />
                  )}
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Quick Search Button & User Avatar Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Quick Search Action */}
            <button
              onClick={() => onOpenSearch?.()}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-zinc-100/90 hover:bg-zinc-200/80 text-zinc-600 hover:text-black text-xs font-medium border border-zinc-200/80 transition-all shadow-2xs"
              title="Search notes (⌘K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden md:inline-block text-[11px] text-zinc-500">Search...</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-white border border-zinc-200 text-zinc-500 shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Quick Create Note Button */}
            <button
              onClick={() => navigateTo('new-note')}
              className={cn(
                "hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs",
                activePage === 'new-note'
                  ? "bg-zinc-800 text-white"
                  : "bg-black hover:bg-zinc-800 text-white hover:shadow-md"
              )}
              title="Create New Note"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            {/* User Profile Avatar with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-zinc-100 border border-transparent hover:border-zinc-200 transition-all focus:outline-none"
                aria-expanded={dropdownOpen}
              >
                <div className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <ChevronDown className="w-3 h-3 text-zinc-400 hidden sm:block" />
              </button>

              {/* Floating Dropdown Menu */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-56 rounded-2xl bg-white/95 backdrop-blur-xl p-2 z-50 border border-zinc-200/90 shadow-2xl text-zinc-900"
                  >
                    <div className="px-3 py-2 border-b border-zinc-200/60">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{user?.name || 'Student'}</p>
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
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-800 hover:text-black hover:bg-zinc-100 rounded-xl transition-colors text-left"
                      >
                        <SettingsIcon className="w-4 h-4 text-zinc-500" />
                        <span>Settings &amp; Drive</span>
                      </button>

                      <button
                        onClick={() => {
                          navigateTo('xml-demo');
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-800 hover:text-black hover:bg-zinc-100 rounded-xl transition-colors text-left"
                      >
                        <FileCode2 className="w-4 h-4 text-zinc-500" />
                        <span>XML Practical Engine</span>
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Aceternity Specular Gradient Highlight at Bottom */}
          <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-zinc-950/20 to-transparent h-px pointer-events-none" />
        </div>
      </motion.header>
    </AnimatePresence>
  );
};
