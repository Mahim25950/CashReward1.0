import React, { useState } from 'react';
import { Button } from './Button';

interface TutorialOverlayProps {
  onComplete: () => void;
  isOpen: boolean;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete, isOpen }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to CashReward!",
      content: "Earn money by completing simple tasks, watching ads, and playing games. Let's take a quick tour.",
      highlight: null
    },
    {
      title: "Daily Check-in",
      content: "Tap the Check-in button every day to build your streak and earn free coins.",
      highlight: "streak-section"
    },
    {
      title: "Task Wall",
      content: "Complete these tasks to earn huge rewards and scratch cards.",
      highlight: "task-section"
    },
    {
      title: "Withdraw",
      content: "Once you have enough coins, go to the Wallet tab to withdraw cash to your account.",
      highlight: "wallet-nav"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* Content Box */}
      <div className="relative bg-white dark:bg-[#1e1e1e] p-6 rounded-xl w-4/5 max-w-sm shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-[#ff8c00] uppercase tracking-wider">Step {step + 1}/{steps.length}</span>
          <button onClick={onComplete} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm">Skip</button>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{currentStep.title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          {currentStep.content}
        </p>

        <div className="flex justify-between">
           {step > 0 ? (
             <button onClick={() => setStep(step - 1)} className="text-gray-500 font-medium px-4">Back</button>
           ) : <div></div>}
           <Button onClick={handleNext} className="px-6 py-2">
             {step === steps.length - 1 ? "Get Started" : "Next"}
           </Button>
        </div>
      </div>
    </div>
  );
};