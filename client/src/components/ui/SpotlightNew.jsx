import React from 'react';
import { motion } from 'framer-motion';

/**
 * Optimized Aceternity UI Spotlight Component
 * Dual dynamic lighting spotlight beams with smooth hardware-accelerated sweeping motion.
 * Eliminates heavy Gaussian blur filter rasterization while maintaining gorgeous specular lighting.
 */
export const Spotlight = ({
  translateY = -280,
  width = 520,
  height = 1100,
  smallWidth = 220,
  duration = 8,
  xOffset = 60,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}
    >
      {/* Left Spotlight Beam - Hardware Accelerated */}
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
        style={{ willChange: 'transform' }}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(-42deg) translateZ(0)`,
            background: 'radial-gradient(ellipse 65% 55% at 50% 40%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 45%, transparent 75%)',
            width: `${width}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 left-0 rounded-full opacity-90"
        />
        <div
          style={{
            transform: 'rotate(-42deg) translate(5%, -45%) translateZ(0)',
            background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 55%, transparent 80%)',
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 left-0 origin-top-left rounded-full opacity-80"
        />
      </motion.div>

      {/* Right Spotlight Beam - Hardware Accelerated */}
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
        style={{ willChange: 'transform' }}
        className="absolute top-0 right-0 w-full h-full pointer-events-none"
      >
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(42deg) translateZ(0)`,
            background: 'radial-gradient(ellipse 65% 55% at 50% 40%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 45%, transparent 75%)',
            width: `${width}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 right-0 rounded-full opacity-90"
        />
        <div
          style={{
            transform: 'rotate(42deg) translate(-5%, -45%) translateZ(0)',
            background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 55%, transparent 80%)',
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 right-0 origin-top-right rounded-full opacity-80"
        />
      </motion.div>
    </motion.div>
  );
};
