import React from 'react';

interface ProfileIconProps {
  size?: number;
  className?: string;
}

const ProfileIcon: React.FC<ProfileIconProps> = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M6.21 15.89c1.39-1.48 3.25-2.39 5.79-2.39s4.4.91 5.79 2.39" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
};

export default ProfileIcon;