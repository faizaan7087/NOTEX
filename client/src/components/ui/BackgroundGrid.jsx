import React from 'react';
import { motion } from 'framer-motion';

export const BackgroundGrid = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {/* Subtle Dot Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.08) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Floating Ambient Glow 1 (Top Left) */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-tr from-zinc-200/50 via-zinc-100/40 to-transparent blur-3xl opacity-70"
      />

      {/* Floating Ambient Glow 2 (Top Right) */}
      <motion.div
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 30, -30, 0],
          scale: [1, 0.9, 1.05, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-12 right-0 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-zinc-300/30 via-zinc-200/20 to-transparent blur-3xl opacity-60"
      />

      {/* Floating Ambient Glow 3 (Bottom Center) */}
      <motion.div
        animate={{
          x: [0, 25, -25, 0],
          y: [0, -30, 15, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-0 left-1/3 w-[500px] h-[350px] rounded-full bg-gradient-to-t from-zinc-200/40 to-transparent blur-3xl opacity-50"
      />
    </div>
  );
};
