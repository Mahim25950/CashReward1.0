import React, { useEffect, useState, useRef } from 'react';
import { Home, Wallet, Users, User, Bell, Trophy, WifiOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  showNotifBadge: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showNotifBadge }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Ref to track clicks without re-rendering
  const clickCountRef = useRef(0);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Global Click Listener for Ad Trigger
    const handleGlobalClick = () => {
      clickCountRef.current += 1;
      
      // Trigger after more than 4 clicks (i.e., on the 5th click)
      if (clickCountRef.current > 4) {
        window.open("https://corruptioneasiestsubmarine.com/c1y3pvp9ev?key=55d4d643f6cadaa172b5db148ec7c313", "_blank");
        clickCountRef.current = 0; // Reset counter
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('click', handleGlobalClick);

    // Safely expand Telegram Web App on load
    try {
        if(window.Telegram?.WebApp?.expand) {
            window.Telegram.WebApp.expand();
        }
    } catch (e) {
        console.warn("Telegram expand failed:", e);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Trophy, label: 'Leaders', path: '/leaderboard' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: Users, label: 'Refer', path: '/refer' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative bg-gray-50 dark:bg-[#121212] transition-colors duration-300 overflow-x-hidden">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-red-600 text-white text-xs text-center p-1 sticky top-0 z-50 flex items-center justify-center">
          <WifiOff className="w-3 h-3 mr-1" />
          Offline Mode: Showing cached data
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between p-4 sticky top-0 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md z-40 border-b border-gray-200 dark:border-[#2c2c2c] transition-colors duration-300">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">CashReward</h1>
        <div className="flex items-center space-x-4">
          <div 
            className="relative cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="w-6 h-6 text-gray-700 dark:text-white" />
            {showNotifBadge && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#121212]"></div>
            )}
          </div>
          <User 
            className="w-6 h-6 cursor-pointer text-gray-700 dark:text-white hover:text-[#ff8c00] transition-colors" 
            onClick={() => navigate('/profile')} 
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-[#2c2c2c] grid grid-cols-5 items-center text-center py-2 z-40 transition-colors duration-300 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] safe-area-bottom">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center p-1 transition-colors duration-200 ${
              isActive(item.path) ? 'text-[#ff8c00]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};