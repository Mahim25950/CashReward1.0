import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</label>}
      <input 
        className={`w-full p-3 rounded-lg bg-gray-50 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] text-gray-900 dark:text-white focus:outline-none focus:border-[#ff8c00] transition-colors ${className}`}
        {...props}
      />
    </div>
  );
};