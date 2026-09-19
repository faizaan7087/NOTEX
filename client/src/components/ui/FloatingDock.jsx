import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { 
  PlusCircle, 
  FolderPlus, 
  Search, 
  Star, 
  Settings, 
  BookOpen,
  LayoutDashboard
} from 'lucide-react';

const DockIcon = ({ mouseX, icon: Icon, label, onClick, isActive }) => {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-120, 0, 120], [40, 56, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.button
      ref={ref}
      style={{ width, height: width }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-2xl transition-colors ${
        isActive
          ? 'bg-black text-white shadow-md'
          : 'bg-white/90 text-zinc-700 hover:text-black hover:bg-white border border-zinc-200/90 shadow-2xs'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />

      {/* Floating Tooltip Pill */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: -38, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-2 px-2.5 py-1 rounded-xl bg-black text-white text-[11px] font-semibold tracking-wide whitespace-nowrap shadow-xl pointer-events-none z-50"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export const FloatingDock = ({
  activePage,
  navigateTo,
  onOpenCreateFolder,
  onOpenSearch,
  onToggleFavorites,
  showFavoritesOnly
}) => {
  const mouseX = useMotionValue(Infinity);
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  // Auto-hide dock on scroll down, show on scroll up or top
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 80) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const items = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      onClick: () => navigateTo('dashboard'),
      isActive: activePage === 'dashboard'
    },
    {
      id: 'notes',
      label: 'All Notes',
      icon: BookOpen,
      onClick: () => navigateTo('notes'),
      isActive: activePage === 'notes' && !showFavoritesOnly
    },
    {
      id: 'new-note',
      label: 'Create Note',
      icon: PlusCircle,
      onClick: () => navigateTo('new-note'),
      isActive: activePage === 'new-note'
    },
    {
      id: 'folder',
      label: 'New Folder',
      icon: FolderPlus,
      onClick: () => onOpenCreateFolder?.(),
      isActive: false
    },
    {
      id: 'starred',
      label: showFavoritesOnly ? 'Show All' : 'Starred Only',
      icon: Star,
      onClick: () => onToggleFavorites?.(),
      isActive: showFavoritesOnly
    },
    {
      id: 'settings',
      label: 'Settings & Drive',
      icon: Settings,
      onClick: () => navigateTo('settings'),
      isActive: activePage === 'settings'
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 hidden md:block">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        initial={{ y: 50, opacity: 0 }}
        animate={{ 
          y: hidden ? 90 : 0, 
          opacity: hidden ? 0 : 1,
          scale: hidden ? 0.95 : 1
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="flex items-end gap-3 px-4 py-2.5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-zinc-200/90 shadow-2xl"
      >
        {items.map((item) => (
          <DockIcon
            key={item.id}
            mouseX={mouseX}
            icon={item.icon}
            label={item.label}
            onClick={item.onClick}
            isActive={item.isActive}
          />
        ))}
      </motion.div>
    </div>
  );
};
