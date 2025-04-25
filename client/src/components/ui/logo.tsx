import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className} 
      fill="currentColor"
    >
      {/* Silhueta estilizada de uma galinha */}
      <path d="M12 3c-1.1 0-2 .9-2 2 0 .74.4 1.38 1 1.72V8H9c-.55 0-1 .45-1 1v1H7c-.55 0-1 .45-1 1v1H5c-.55 0-1 .45-1 1v3c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4v-3c0-.55-.45-1-1-1h-1v-1c0-.55-.45-1-1-1h-1V9c0-.55-.45-1-1-1h-2V6.72c.6-.34 1-.98 1-1.72 0-1.1-.9-2-2-2zm-3 10c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
    </svg>
  );
};

export default Logo;