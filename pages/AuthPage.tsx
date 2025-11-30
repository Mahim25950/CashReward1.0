import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const AuthPage: React.FC = () => {
  const { loading, isTelegramUser, loginAsGuest } = useAuth();

  const handleOpenTelegram = () => {
    window.location.href = "https://t.me/YOUR_BOT_NAME"; // Replace with your bot link
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-[#121212] text-center">
      <div className="mb-8 relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#ff8c00] to-orange-600 flex items-center justify-center animate-pulse">
            <span className="text-4xl font-bold text-white">CR</span>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-2">CashReward</h1>
      
      {loading ? (
        <div className="space-y-4">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ff8c00] mx-auto"></div>
             <p className="text-gray-400">Authenticating...</p>
        </div>
      ) : (
        <div className="max-w-xs animate-in fade-in duration-500 w-full">
            {!isTelegramUser ? (
                <>
                    <p className="text-gray-400 mb-6">
                        Welcome! This app is optimized for Telegram.
                    </p>
                    
                    <Button onClick={handleOpenTelegram} className="mb-4">
                        Open in Telegram
                    </Button>
                    
                    <div className="flex items-center justify-center my-4">
                        <div className="h-px bg-gray-700 w-full"></div>
                        <span className="px-3 text-xs text-gray-500 uppercase">OR</span>
                        <div className="h-px bg-gray-700 w-full"></div>
                    </div>

                    <Button variant="secondary" onClick={loginAsGuest}>
                        Continue as Guest
                    </Button>
                </>
            ) : (
                <p className="text-green-400">Login Successful! Redirecting...</p>
            )}
        </div>
      )}
      
      <div className="mt-10 text-xs text-gray-600">
        Secure Login via Firebase
      </div>
    </div>
  );
};