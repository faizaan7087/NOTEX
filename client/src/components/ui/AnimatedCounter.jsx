import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export const AnimatedCounter = ({ value = 0, className = '' }) => {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
};
