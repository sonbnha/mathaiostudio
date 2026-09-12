import React from 'react';

export function MathAIOLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
      fill="none"
    >
      <rect width="100" height="100" rx="22" fill="#090d16" />
      <rect x="1.5" y="1.5" width="97" height="97" rx="20.5" stroke="#1e293b" stroke-width="1.5" />
      <g transform="translate(15, 15)">
        <circle cx="35" cy="35" r="32" stroke="#10b981" strokeWidth="3" strokeDasharray="160 40" strokeLinecap="round" opacity="0.9" />
        <circle cx="58" cy="13" r="3.5" fill="#34d399" />
        <line x1="18" y1="20" x2="18" y2="50" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="52" y1="20" x2="52" y2="50" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M18 50 L35 20 L52 50" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="25" y1="38" x2="45" y2="38" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        <path d="M18 20 L35 38 L52 20" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      </g>
    </svg>
  );
}

export default MathAIOLogo;
