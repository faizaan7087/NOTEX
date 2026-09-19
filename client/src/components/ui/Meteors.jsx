import React from 'react';
import { motion } from 'framer-motion';

export const Meteors = ({ number = 15, className = '' }) => {
  const meteors = new Array(number).fill(true);
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {meteors.map((el, idx) => {
        const left = Math.floor(Math.random() * 800 - 200) + 'px';
        const delay = Math.random() * 2 + 0.2 + 's';
        const duration = Math.random() * 5 + 4 + 's';

        return (
          <span
            key={'meteor' + idx}
            className="absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg] before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent animate-meteor-effect"
            style={{
              top: 0,
              left: left,
              animationDelay: delay,
              animationDuration: duration,
            }}
          />
        );
      })}
    </div>
  );
};
