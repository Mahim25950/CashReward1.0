import React from 'react';

interface ModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, message, onClose, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] border border-[#444] rounded-lg p-6 w-full max-w-sm text-center shadow-xl transform scale-100">
        {title && <h3 className="text-xl font-bold text-[#ff8c00] mb-2">{title}</h3>}
        <p className="text-white mb-6 whitespace-pre-wrap">{message}</p>
        <button 
          onClick={onClose}
          className="bg-[#ff8c00] text-[#121212] px-6 py-2 rounded-lg font-bold hover:bg-[#e67e00] transition-colors w-full"
        >
          OK
        </button>
      </div>
    </div>
  );
};