import React from 'react';

interface BangladeshFlagProps {
  className?: string;
}

/**
 * Official National Flag of Bangladesh SVG component.
 * Exact official specifications: 10:6 ratio, bottle-green field (#006A4E),
 * and red disc (#F42A41) with radius 4 shifted slightly toward the hoist (cx=9, cy=6).
 */
export const BangladeshFlag: React.FC<BangladeshFlagProps> = ({ className = 'w-4 h-2.5' }) => {
  return (
    <svg
      className={`rounded-[2px] shadow-2xs shrink-0 overflow-hidden inline-block align-middle ${className}`}
      viewBox="0 0 20 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Bangladesh Flag"
    >
      <rect width="20" height="12" fill="#006A4E" />
      <circle cx="9" cy="6" r="4" fill="#F42A41" />
    </svg>
  );
};
