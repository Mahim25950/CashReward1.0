import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-[#1e1e1e] p-4 rounded-lg shadow-sm border border-gray-100 dark:border-none ${className}`}
    >
      {children}
    </div>
  );
};