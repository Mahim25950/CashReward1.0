
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Copy, Share2, Award, Users, Gift, ChevronRight, Zap } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';

export const ReferPage: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, message: '', title: '' });

  // --- Tier System Logic ---
  const refCount = userData?.referralCount || 0;
  let tier = 'Starter';
  let tierGradient = 'from-blue-600 to-blue-400';
  let nextTier = 'Bronze';
  let progress = 0;
  let benefit = '10%';

  if (refCount >= 20) {
    tier = 'Gold';
    tierGradient = 'from-yellow-500 to-amber-600';
    nextTier = 'Max Level';
    progress = 100;
    benefit = '30%';
  } else if (refCount >= 5) {
    tier = 'Bronze';
    tierGradient = 'from-orange-500 to-red-500';
    nextTier = 'Gold';
    progress = ((refCount - 5) / (20 - 5)) * 100;
    benefit = '20%';
  } else {
    progress = (refCount / 5) * 100;
  }

  const copyCode = () => {
    if (userData?.referralCode) {
      navigator.clipboard.writeText(userData.referralCode);
      setModal({ isOpen: true, message: "Referral code copied to clipboard!", title: "Copied" });
    }
  };

  const shareCode = async () => {
    const text = `Join CashReward and earn money! Use my referral code: ${userData?.referralCode}. Get 100 coins instantly!`;
    const url = window.location.href;
    const shareData = { title: 'Join CashReward!', text: text, url: url };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed or canceled", err);
      }
    } else {
      // Fallback: Copy full message to clipboard
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setModal({ isOpen: true, message: "Referral link & message copied to clipboard.", title: "Share" });
      } catch (err) {
        // Simple fallback to just the code if clipboard API acts up
        copyCode(); 
      }
    }
  };

  const applyCode = async () => {
    if (!userData) return;
    const code = inputCode.trim().toUpperCase();

    if (userData.referredBy) {
      setModal({ isOpen: true, message: "You have already used a referral code.", title: "Error" });
      return;
    }
    if (!code) {
      setModal({ isOpen: true, message: "Please enter a code.", title: "Empty" });
      return;
    }
    if (code === userData.referralCode) {
      setModal({ isOpen: true, message: "You cannot use your own code.", title: "Invalid" });
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("referralCode", "==", code));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // 1. Reward Referrer
        const referrerDoc = snapshot.docs[0];
        const referrerRef = doc(db, "users", referrerDoc.id);
        
        await updateDoc(referrerRef, { 
          balance: increment(100),
          referralCount: increment(1),
          weeklyEarnings: increment(100),
          lifetimeEarnings: increment(100)
        });

        // 2. Reward Current User
        const currentUserRef = doc(db, "users", userData.uid);
        await updateDoc(currentUserRef, { 
          balance: increment(100),
          weeklyEarnings: increment(100),
          lifetimeEarnings: increment(100),
          referredBy: code 
        });

        await refreshUserData();
        setModal({ isOpen: true, message: "Code applied! You + Friend earned 100 coins.", title: "Success" });
        setInputCode('');
      } else {
        setModal({ isOpen: true, message: "Invalid referral code.", title: "Error" });
      }
    } catch (error) {
      console.error(error);
      setModal({ isOpen: true, message: "Error applying code.", title: "Error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invite & Earn Big</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Get lifetime commissions from every friend you invite!</p>
      </div>
      
      {/* Hero Tier Card */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tierGradient} p-6 text-white shadow-xl`}>
         {/* Background Decoration */}
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
         <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

         <div className="relative z-10 flex justify-between items-start mb-6">
            <div>
               <p className="text-xs font-medium uppercase tracking-wider opacity-90 mb-1">Current Status</p>
               <h3 className="text-3xl font-extrabold flex items-center gap-2">
                  <Award className="w-8 h-8" /> {tier}
               </h3>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-lg p-2 text-center min-w-[80px]">
               <p className="text-xs opacity-80">Commission</p>
               <p className="text-xl font-bold">{benefit}</p>
            </div>
         </div>
         
         <div className="relative z-10">
            <div className="flex justify-between text-xs font-medium mb-2 opacity-90">
               <span>{refCount} Referrals</span>
               <span>{nextTier === 'Max Level' ? 'Maxed Out!' : `Next: ${nextTier}`}</span>
            </div>
            <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden backdrop-blur-sm">
               <div 
                 className="h-full bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out rounded-full" 
                 style={{ width: `${progress}%` }}
               ></div>
            </div>
            {nextTier !== 'Max Level' && (
              <p className="text-[10px] mt-2 opacity-80 text-right">
                Invite {tier === 'Starter' ? 5 - refCount : 20 - refCount} more to upgrade
              </p>
            )}
         </div>
      </div>

      {/* How It Works Steps */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Share2, title: "Share", desc: "Send your link" },
          { icon: Users, title: "Friend Joins", desc: "Sign up via link" },
          { icon: Gift, title: "Earn", desc: "Both get 100" }
        ].map((step, i) => (
          <div key={i} className="bg-white dark:bg-[#1e1e1e] p-3 rounded-xl shadow-sm border border-gray-100 dark:border-[#2c2c2c] flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-2 text-[#ff8c00]">
              <step.icon className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-xs text-gray-900 dark:text-white">{step.title}</h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-1">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Referral Code Section */}
      <Card className="p-6 relative overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff8c00] to-transparent opacity-50"></div>
        
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 font-medium uppercase tracking-wide">Your Referral Code</p>
          
          <div 
            onClick={copyCode}
            className="bg-white dark:bg-black border border-gray-200 dark:border-[#333] rounded-xl p-4 mb-4 flex items-center justify-center gap-3 cursor-pointer group hover:border-[#ff8c00] transition-colors shadow-sm"
          >
            <span className="text-3xl font-black tracking-widest text-[#ff8c00] font-mono group-hover:scale-105 transition-transform">
              {userData?.referralCode || "..."}
            </span>
            <Copy className="w-5 h-5 text-gray-400 group-hover:text-[#ff8c00]" />
          </div>

          <Button onClick={shareCode} className="w-full flex items-center justify-center gap-2 py-3 shadow-lg shadow-orange-500/20">
            <Share2 className="w-5 h-5" />
            Share Referral Link
          </Button>
          <p className="text-xs text-gray-400 mt-3">Tap code to copy</p>
        </div>
      </Card>

      {/* Enter Code Section */}
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[#2c2c2c]">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
            <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">Received an invite?</h3>
        </div>

        {userData?.referredBy ? (
          <div className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg border border-green-200 dark:border-green-800/50">
            <Award className="w-5 h-5" />
            <span className="font-medium">Referral Bonus Claimed!</span>
          </div>
        ) : (
          <div className="flex gap-2">
             <div className="flex-grow">
               <Input 
                 placeholder="Enter friend's code" 
                 value={inputCode} 
                 onChange={(e) => setInputCode(e.target.value)}
                 className="mb-0 h-full"
               />
             </div>
             <Button 
               variant="outline" 
               onClick={applyCode}
               disabled={loading}
               className="whitespace-nowrap px-6"
             >
               {loading ? "..." : "Redeem"}
             </Button>
          </div>
        )}
      </div>

      <Modal 
        isOpen={modal.isOpen} 
        message={modal.message} 
        title={modal.title} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />
    </div>
  );
};
