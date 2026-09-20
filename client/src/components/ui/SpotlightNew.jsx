import React from 'react';
import { motion } from 'framer-motion';

/**
 * Aceternity UI Spotlight (New) Component
 * Dual dynamic lighting spotlight beams with subtle sweeping motion and gradients.
 */
export const Spotlight = ({
  gradientFirst = 'radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(0, 0%, 100%, 0.16) 0, hsla(0, 0%, 90%, 0.04) 50%, hsla(0, 0%, 80%, 0) 80%)',
  gradientSecond = 'radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, 0.12) 0, hsla(0, 0%, 90%, 0.03) 80%, transparent 100%)',
  gradientThird = 'radial-gradient(50% 50% at 50% 50%, hsla(0, 0%, 100%, 0.08) 0, hsla(0, 0%, 90%, 0.02) 80%, transparent 100%)',
  translateY = -280,
  width = 520,
  height = 1100,
  smallWidth = 220,
  duration = 8,
  xOffset = 80,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Left Spotlight Beam */}
      <motion.div
        animate={{
          x: [0, xOffset, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(-42deg)`,
            background: gradientFirst,
            width: `${width}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 left-0 rounded-full blur-2xl opacity-90"
        />
        <div
          style={{
            transform: 'rotate(-42deg) translate(5%, -45%)',
            background: gradientSecond,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 left-0 origin-top-left rounded-full blur-xl opacity-80"
        />
        <div
          style={{
            transform: 'rotate(-42deg) translate(-140%, -60%)',
            background: gradientThird,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 left-0 origin-top-left rounded-full blur-2xl opacity-60"
        />
      </motion.div>

      {/* Right Spotlight Beam */}
      <motion.div
        animate={{
          x: [0, -xOffset, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
        className="absolute top-0 right-0 w-full h-full pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(42deg)`,
            background: gradientFirst,
            width: `${width}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 right-0 rounded-full blur-2xl opacity-90"
        />
        <div
          style={{
            transform: 'rotate(42deg) translate(-5%, -45%)',
            background: gradientSecond,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 right-0 origin-top-right rounded-full blur-xl opacity-80"
        />
        <div
          style={{
            transform: 'rotate(42deg) translate(140%, -60%)',
            background: gradientThird,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 right-0 origin-top-right rounded-full blur-2xl opacity-60"
        />
      </motion.div>
    </motion.div>
  );
};
