import React, { useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

export const SpotlightCard = ({
  children,
  className = '',
  spotlightColor = 'rgba(0, 0, 0, 0.05)',
  borderColor = 'rgba(0, 0, 0, 0.15)',
  onClick,
  ...props
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = ({ currentTarget, clientX, clientY }) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
      className={`group relative rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-200/90 p-5 shadow-xs transition-all overflow-hidden ${className}`}
      {...props}
    >
      {/* Animated Spotlight Glow following cursor */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              320px circle at ${mouseX}px ${mouseY}px,
              ${spotlightColor},
              transparent 80%
            )
          `,
        }}
      />

      {/* Subtle border highlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: useMotionTemplate`
            inset 0 0 0 1px ${borderColor}
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
