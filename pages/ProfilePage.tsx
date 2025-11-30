import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import { doc, deleteDoc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db } from '../services/firebase';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import { 
  User, Wallet, Shield, FileText, 
  HelpCircle, Trash2, LogOut, ChevronRight,
  Activity, Moon, Sun, BookOpen, Download, ShieldCheck
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { userData, currentUser, logout, appConfig } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if user is the specific Admin
  // Note: userData.email stores "@username" for Telegram users
  const isAdmin = userData?.email?.toLowerCase() === '@mahim9780';

  // Generic Modal Handlers
  const openPrivacy = () => setModal({
    isOpen: true,
    title: 'Privacy Policy',
    message: 'Privacy Policy\n\n1. Data Collection: We collect your Telegram ID and Name for account management.\n2. Usage: We use your data to track earnings and process withdrawals.\n3. Third Parties: We use third-party ad networks which may collect device identifiers.\n4. GDPR/CCPA: You have the right to request data deletion or export your data.'
  });

  const openTerms = () => setModal({
    isOpen: true,
    title: 'Terms of Service',
    message: 'Terms of Service\n\n1. Eligibility: You must be 18+ to use this app.\n2. Fair Play: Automation, bots, or VPNs are strictly prohibited and will result in a ban.\n3. Payments: Withdrawals are processed within 24-48 hours.\n4. Rights: We reserve the right to suspend accounts for suspicious activity.'
  });

  // Export Data for GDPR
  const handleExportData = () => {
    if(!userData) return;
    const dataStr = JSON.stringify(userData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cashreward_data_${userData.uid}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setModal({
      isOpen: true, 
      title: "Data Exported", 
      message: "Your account data has been downloaded as a JSON file."
    });
  };

  // Delete Account (Simplified for TG)
  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm("Are you sure you want to delete your account? This action is permanent.");
    if (!confirm1) return;
    
    const confirm2 = window.confirm("GDPR Warning: All your data (balance, history, streak) will be permanently wiped from our servers. Recovering this data will be impossible. Do you wish to proceed?");
    if (!confirm2 || !currentUser) return;

    // No password check needed for Anonymous/TG auth delete, but we should be careful.
    
    try {
      // Delete Firestore Data
      await deleteDoc(doc(db, "users", userData!.uid));
      
      // Delete Auth User
      await deleteUser(currentUser);
      
      // Context will handle logout/redirect via onAuthStateChanged
    } catch (error: any) {
      console.error(error);
      setModal({ isOpen: true, title: 'Error', message: 'Failed to delete account. ' + error.message });
    }
  };

  const MenuRow = ({ icon: Icon, label, onClick, danger = false, highlight = false }: any) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 bg-white dark:bg-[#1e1e1e] border-b border-gray-100 dark:border-[#2c2c2c] first:rounded-t-lg last:rounded-b-lg last:border-0 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors ${danger ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}
    >
      <div className="flex items-center space-x-3">
        <Icon className={`w-5 h-5 ${danger ? 'text-red-500' : highlight ? 'text-[#ff8c00]' : 'text-gray-500 dark:text-gray-400'}`} />
        <span className={`font-medium ${highlight ? 'text-[#ff8c00]' : ''}`}>{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
    </button>
  );

  return (
    <div className="space-y-6">
      <TutorialOverlay isOpen={showTutorial} onComplete={() => setShowTutorial(false)} />

      {/* Profile Header */}
      <div className="flex flex-col items-center pt-4">
        <div className="w-24 h-24 rounded-full bg-white dark:bg-[#2c2c2c] border-2 border-[#ff8c00] flex items-center justify-center text-3xl font-bold text-[#ff8c00] mb-4 shadow-lg relative">
          {userData?.name?.charAt(0).toUpperCase() || <User />}
          <div className="absolute bottom-0 right-0 bg-white dark:bg-[#1e1e1e] p-1.5 rounded-full border border-gray-200 dark:border-[#444]">
             <User className="w-4 h-4 text-gray-500 dark:text-gray-300" />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mb-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{userData?.name || 'Telegram User'}</h2>
          {isAdmin && <ShieldCheck className="w-5 h-5 text-blue-500" />}
        </div>
        
        {userData?.email && userData.email.startsWith('@') && (
            <p className="text-[#ff8c00] text-sm font-medium">{userData.email}</p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">ID: {userData?.uid}</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-lg text-center shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Current Balance</p>
          <p className="text-xl font-bold text-[#ff8c00]">{userData?.balance || 0}</p>
        </div>
        <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-lg text-center shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Ads Watched Today</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {userData?.dailyAdCount || 0} <span className="text-gray-400 dark:text-gray-500 text-xs">/ {appConfig.dailyAdLimit}</span>
          </p>
        </div>
      </div>

      {/* ADMIN PANEL BUTTON - ONLY FOR SPECIFIC USER */}
      {isAdmin && (
        <div className="rounded-lg overflow-hidden shadow-sm bg-white dark:bg-[#1e1e1e] border border-blue-500/30 relative">
          <div className="absolute top-0 right-0 px-2 py-0.5 bg-blue-500 text-[10px] text-white font-bold rounded-bl-lg">ADMIN</div>
          <MenuRow icon={ShieldCheck} label="Admin Dashboard" onClick={() => navigate('/admin')} highlight />
        </div>
      )}

      {/* Settings Row: Theme & Tutorial */}
      <div className="flex space-x-3">
        <button 
          onClick={toggleTheme}
          className="flex-1 flex items-center justify-center space-x-2 p-3 bg-white dark:bg-[#1e1e1e] rounded-lg shadow-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525]"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-600" />}
          <span className="font-medium text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button 
          onClick={() => setShowTutorial(true)}
          className="flex-1 flex items-center justify-center space-x-2 p-3 bg-white dark:bg-[#1e1e1e] rounded-lg shadow-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525]"
        >
          <BookOpen className="w-5 h-5 text-[#ff8c00]" />
          <span className="font-medium text-sm">How to Play</span>
        </button>
      </div>

      {/* Menu List */}
      <div className="rounded-lg overflow-hidden shadow-sm bg-white dark:bg-[#1e1e1e]">
        <MenuRow icon={Wallet} label="My Wallet" onClick={() => navigate('/wallet')} />
        <MenuRow icon={Activity} label="Activity History" onClick={() => navigate('/wallet')} />
        <MenuRow icon={HelpCircle} label="Help & Support" onClick={() => navigate('/support')} />
      </div>

       {/* Legal & Privacy */}
      <div className="rounded-lg overflow-hidden shadow-sm bg-white dark:bg-[#1e1e1e] mt-4">
        <MenuRow icon={Shield} label="Privacy Policy" onClick={openPrivacy} />
        <MenuRow icon={FileText} label="Terms of Service" onClick={openTerms} />
        <MenuRow icon={Download} label="Export My Data (GDPR)" onClick={handleExportData} />
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg overflow-hidden shadow-sm bg-white dark:bg-[#1e1e1e] mt-4">
        <MenuRow icon={Trash2} label="Delete Account" onClick={handleDeleteAccount} danger />
      </div>

      {/* Only show Logout if useful for dev, usually hidden in Prod TG Apps */}
      <Button variant="secondary" fullWidth onClick={logout} className="mt-4 flex items-center justify-center space-x-2">
        <LogOut className="w-5 h-5" />
        <span>Close Session</span>
      </Button>

      <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">
        Version 1.4.1 (Telegram)
      </div>

      <Modal 
        isOpen={modal.isOpen} 
        title={modal.title} 
        message={modal.message} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />
    </div>
  );
};