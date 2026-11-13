import React from 'react';
import { motion } from 'framer-motion';

/**
 * Optimized Background Grid & Ambient Lighting
 * Supports standard light theme and full-screen animated deep black theme for Agent Arex.
 */
export const BackgroundGrid = ({ isAIPage = false }) => {
  if (isAIPage) {
    return (
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-black">
        {/* Dot Matrix Cyber Grid (White dots on Pure Black) */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.4) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Ambient Glowing Orb 1 - Top Left Indigo */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.35, 0.55, 0.35],
            x: [0, 30, 0],
            y: [0, -20, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(79, 70, 229, 0.15) 45%, transparent 70%)',
            willChange: 'transform'
          }}
        />

        {/* Ambient Glowing Orb 2 - Top Right Violet / Purple */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.25, 0.45, 0.25],
            x: [0, -40, 0],
            y: [0, 30, 0]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute top-10 right-0 w-[620px] h-[620px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, rgba(126, 34, 206, 0.12) 50%, transparent 70%)',
            willChange: 'transform'
          }}
        />

        {/* Ambient Glowing Orb 3 - Center Emerald Accent */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 65%)',
            willChange: 'transform'
          }}
        />

        {/* Ambient Ground Lighting - Bottom Indigo Mesh */}
        <motion.div
          animate={{
            opacity: [0.2, 0.35, 0.2]
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute -bottom-28 left-1/4 w-[750px] h-[450px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(67, 56, 202, 0.3) 0%, transparent 65%)',
            willChange: 'transform'
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Subtle Dot Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.07) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Left Soft Glow */}
      <div
        className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full opacity-60 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(226, 232, 240, 0.75) 0%, rgba(241, 245, 249, 0.4) 45%, transparent 70%)',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
      />

      {/* Top Right Subtle Ambient Beam */}
      <div
        className="absolute top-10 right-0 w-[500px] h-[500px] rounded-full opacity-50 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(229, 231, 235, 0.6) 0%, rgba(243, 244, 246, 0.3) 50%, transparent 70%)',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
      />

      {/* Bottom Center Ground Lighting */}
      <div
        className="absolute -bottom-24 left-1/4 w-[600px] h-[400px] rounded-full opacity-45 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(226, 232, 240, 0.65) 0%, transparent 65%)',
          willChange: 'transform',
          transform: 'translateZ(0)'
        }}
      />
    </div>
  );
};
