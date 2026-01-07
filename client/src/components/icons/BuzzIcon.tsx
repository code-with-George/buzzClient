import React from 'react';

interface BuzzIconProps {
  className?: string;
  size?: number;
}

export function BuzzIcon({ className = '', size = 48 }: BuzzIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      width={size}
      height={size}
      className={className}
    >
      <rect width="100" height="100" rx="20" fill="#1a1a24" />
      <path d="M50 20L65 35H35L50 20Z" fill="#a855f7" />
      <rect x="35" y="35" width="30" height="30" rx="4" fill="#a855f7" />
      <path d="M50 80L35 65H65L50 80Z" fill="#a855f7" />
      <circle cx="50" cy="50" r="8" fill="#1a1a24" />
      <circle cx="50" cy="50" r="4" fill="#22c55e" />
      <rect x="20" y="45" width="10" height="10" rx="2" fill="#a855f7" opacity="0.6" />
      <rect x="70" y="45" width="10" height="10" rx="2" fill="#a855f7" opacity="0.6" />
    </svg>
  );
}

// Smaller drone icon for markers and lists
export function DroneIcon({ className = '', size = 24 }: BuzzIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      className={className}
    >
      <path
        d="M12 4L15 7H9L12 4Z"
        fill="currentColor"
      />
      <rect x="9" y="7" width="6" height="6" rx="1" fill="currentColor" />
      <path
        d="M12 20L9 17H15L12 20Z"
        fill="currentColor"
      />
      <rect x="4" y="9" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.6" />
      <rect x="17" y="9" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

// Controller icon
export function ControllerIcon({ className = '', size = 24 }: BuzzIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      className={className}
    >
      <rect x="4" y="6" width="16" height="12" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="8" cy="12" r="2" fill="currentColor" />
      <circle cx="16" cy="12" r="2" fill="currentColor" />
      <rect x="10" y="3" width="4" height="3" rx="1" fill="currentColor" />
    </svg>
  );
}

