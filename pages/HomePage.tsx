import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { TutorialOverlay } from '../components/ui/TutorialOverlay';
import { Flame, Gift, Sparkles, Target, CheckCircle, Play, MousePointer, Video, Gamepad2, ChevronRight, Zap, Trophy } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { userData, appConfig, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [modalInfo, setModalInfo] = useState<{isOpen: boolean, message: string, title?: string}>({
    isOpen: false, 
    message: ''
  });

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenTutorial');
    if (!hasSeen) {
      setShowTutorial(true);
    }
  }, []);

  const finishTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  const closeModal = () => setModalInfo(prev => ({ ...prev, isOpen: false }));

  // --- Streak Logic ---
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  let displayStreak = userData?.currentStreak || 0;
  const isClaimedToday = userData?.lastCheckInDate === today;
  if (userData?.lastCheckInDate && userData.lastCheckInDate !== today && userData.lastCheckInDate !== yesterday) {
    displayStreak = 0;
  }

  // --- Helper to Check Milestones ---
  const checkMilestone = (currentEarnings: number, amountAdded: number, currentNextMilestone: number = 1000) => {
      const newTotal = currentEarnings + amountAdded;
      let earnedSpins = 0;
      let earnedCards = 0;
      let nextTarget = currentNextMilestone;
      let msg = "";

      if (newTotal >= 10000 && currentNextMilestone < 10000) {
          earnedSpins = 3;
          earnedCards = 3;
          nextTarget = 20000;
          msg = "\n🏆 10k Coins Milestone: +3 Spins & +3 Scratch Cards!";
      } else if (newTotal >= 3000 && currentNextMilestone < 3000) {
          earnedSpins = 1;
          earnedCards = 1;
          nextTarget = 10000;
          msg = "\n🥈 3k Coins Milestone: +1 Spin & +1 Scratch Card!";
      } else if (newTotal >= 1000 && currentNextMilestone < 1000) {
          earnedSpins = 1;
          nextTarget = 3000;
          msg = "\n🥉 1k Coins Milestone: +1 Free Spin!";
      }

      return { earnedSpins, earnedCards, nextTarget, msg };
  };

  const handleDailyCheckIn = async () => {
    if (!userData || isClaimedToday) return;

    setIsLoading(true);
    try {
      const userRef = doc(db, "users", userData.uid);
      let newStreak = (userData.lastCheckInDate === yesterday) ? (userData.currentStreak || 0) + 1 : 1;
      const reward = 10 + (newStreak * 5); 

      const { earnedSpins, earnedCards, nextTarget, msg } = checkMilestone(
          userData.lifetimeEarnings || 0, 
          reward, 
          userData.nextMilestone
      );

      await updateDoc(userRef, {
        lastCheckInDate: today,
        currentStreak: newStreak,
        balance: increment(reward),
        weeklyEarnings: increment(reward),
        lifetimeEarnings: increment(reward),
        spinsAvailable: increment(earnedSpins),
        scratchCardsAvailable: increment(earnedCards),
        nextMilestone: nextTarget
      });
      
      await refreshUserData();
      let alertMsg = `Checked in for Day ${newStreak}! You earned ${reward} coins.`;
      if (msg) alertMsg += msg;
      
      setModalInfo({ isOpen: true, title: "Daily Bonus", message: alertMsg });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Micro-Task Challenge Logic ---
  const challenge = userData?.dailyChallenge || { adsWatched: 0, scratchesDone: 0, claimed: false, date: today };
  const challengeTargetAds = 3;
  const isChallengeComplete = challenge.adsWatched >= challengeTargetAds;
  const isChallengeClaimed = challenge.claimed;

  const claimChallengeBonus = async () => {
    if (!isChallengeComplete || isChallengeClaimed || !userData) return;
    setIsLoading(true);
    try {
      const bonus = 50;
      
      const { earnedSpins, earnedCards, nextTarget, msg } = checkMilestone(
          userData.lifetimeEarnings || 0, 
          bonus, 
          userData.nextMilestone
      );

      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, {
        balance: increment(bonus),
        weeklyEarnings: increment(bonus),
        lifetimeEarnings: increment(bonus),
        "dailyChallenge.claimed": true,
        spinsAvailable: increment(earnedSpins),
        scratchCardsAvailable: increment(earnedCards),
        nextMilestone: nextTarget
      });
      await refreshUserData();
      
      let alertMsg = `You claimed your ${bonus} coin bonus!`;
      if (msg) alertMsg += msg;

      setModalInfo({ isOpen: true, title: "Challenge Complete!", message: alertMsg });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Ad Logic ---
  const calculateAdsLeft = () => {
    if (!userData) return 0;
    const userDate = userData.lastAdWatchDate;
    const currentCount = userDate === today ? userData.dailyAdCount : 0;
    return Math.max(0, appConfig.dailyAdLimit - currentCount);
  };

  const handleClaimReward = async (taskType: 'interstitial' | 'popup' | 'inApp' | 'miniApp') => {
    if (!userData) return;

    const userRef = doc(db, "users", userData.uid);
    let currentDailyCount = userData.lastAdWatchDate === today ? userData.dailyAdCount : 0;

    if (currentDailyCount >= appConfig.dailyAdLimit) {
      setModalInfo({ isOpen: true, message: "You have reached your daily ad watch limit.", title: "Limit Reached" });
      return;
    }

    if (!navigator.onLine) {
        setModalInfo({ isOpen: true, message: "You need an internet connection to watch ads.", title: "Offline" });
        return;
    }

    if (typeof window.show_9299851 !== 'function') {
      setModalInfo({ isOpen: true, message: "Ad service is initializing or unavailable. Please try again.", title: "Error" });
      return;
    }

    setIsLoading(true);

    try {
      let adPromise;
      switch(taskType) {
          case 'interstitial': adPromise = window.show_9299851(); break;
          case 'popup': adPromise = window.show_9299851('pop'); break;
          case 'inApp': 
             adPromise = window.show_9299851({ 
               type: 'inApp', 
               inAppSettings: { frequency: 2, capping: 0.1, interval: 30, timeout: 5, everyPage: false } 
             }); 
             break;
          case 'miniApp': adPromise = window.show_9299851(); break;
      }

      await adPromise;

      let rewardAmount = 0;
      if (taskType === 'miniApp') rewardAmount = 100;
      else if (taskType !== 'inApp') rewardAmount = 50;

      const newDailyCount = currentDailyCount + 1;
      const updates: any = {
        dailyAdCount: newDailyCount,
        lastAdWatchDate: today,
        "dailyChallenge.adsWatched": increment(1)
      };

      let milestoneMsg = "";

      if (rewardAmount > 0) {
        updates.balance = increment(rewardAmount);
        updates.weeklyEarnings = increment(rewardAmount);
        updates.lifetimeEarnings = increment(rewardAmount);
        
        const { earnedSpins, earnedCards, nextTarget, msg } = checkMilestone(
            userData.lifetimeEarnings || 0, 
            rewardAmount, 
            userData.nextMilestone
        );
        
        if (earnedSpins > 0) updates.spinsAvailable = increment(earnedSpins);
        if (earnedCards > 0) updates.scratchCardsAvailable = increment(earnedCards);
        updates.nextMilestone = nextTarget;
        milestoneMsg = msg;
      }
      
      let spinEarned = false;
      if (newDailyCount % 3 === 0) {
        updates.spinsAvailable = increment(1);
        spinEarned = true;
      }

      if (newDailyCount % 2 === 0) {
        window.open("https://corruptioneasiestsubmarine.com/rr5m2xntt?key=56d2ab4ba16a5e923e573756dcd10c33", "_blank");
      }

      await updateDoc(userRef, updates);
      await refreshUserData();
      
      let msg = "";
      if (rewardAmount > 0) msg += `You won ${rewardAmount} coins. `;
      if (spinEarned) msg += " You also earned a Lucky Spin!";
      if (milestoneMsg) msg += milestoneMsg;
      
      if (msg) setModalInfo({ isOpen: true, message: msg, title: "Reward Claimed" });

    } catch (error) {
      console.error("Ad error:", error);
      setModalInfo({ isOpen: true, message: "Could not show ad. Please check your connection.", title: "Ad Error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Milestone Progress Visual
  const milestoneTarget = userData?.nextMilestone || 1000;
  const currentLifetime = userData?.lifetimeEarnings || 0;
  // Calculate relative progress for the specific tier to make the bar meaningful
  // e.g. if I am at 1500 and target is 3000, and previous tier was 1000.
  let prevMilestone = 0;
  if (milestoneTarget === 3000) prevMilestone = 1000;
  if (milestoneTarget === 10000) prevMilestone = 3000;
  
  const progressPercent = Math.min(100, Math.max(0, ((currentLifetime - prevMilestone) / (milestoneTarget - prevMilestone)) * 100));

  return (
    <div className="space-y-6 pb-24 max-w-full overflow-x-hidden">
      <TutorialOverlay isOpen={showTutorial} onComplete={finishTutorial} />

      {/* Balance Section */}
      <div className="relative pt-2 px-2">
        <div className="bg-gradient-to-br from-[#1c1c1c] via-[#2a2a2a] to-[#121212] rounded-3xl p-6 shadow-2xl border border-gray-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10 group-hover:bg-orange-500/20 transition-all duration-500"></div>
          
          <div className="flex flex-col relative z-10">
            <div className="flex justify-between items-start">
              <div>
                 <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   Available Balance
                 </p>
                 <div className="flex items-baseline gap-2">
                   <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{userData?.balance || 0}</h1>
                   <span className="text-orange-500 font-bold text-lg">CP</span>
                 </div>
              </div>
              <div onClick={() => navigate('/wallet')} className="bg-[#333] hover:bg-[#444] p-3 rounded-2xl cursor-pointer transition-colors border border-gray-700">
                <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
               <div className="flex-1 bg-black/30 rounded-xl p-3 backdrop-blur-sm border border-white/5">
                 <p className="text-[10px] text-gray-500 uppercase">Est. Value</p>
                 <p className="text-white font-bold">৳{((userData?.balance || 0) / (appConfig.coinValueCoins / appConfig.coinValueInr)).toFixed(2)}</p>
               </div>
               <button 
                onClick={() => navigate('/wallet')}
                className="flex-1 bg-gradient-to-r from-[#ff8c00] to-orange-600 text-black py-3 rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-orange-500/20 transition-all active:scale-95"
              >
                WITHDRAW
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Strip */}
      <div id="streak-section" className="bg-white dark:bg-[#1e1e1e] mx-2 p-4 rounded-2xl border border-gray-100 dark:border-[#2c2c2c] shadow-sm relative overflow-hidden">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
               <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
               Daily Streak
            </h3>
            <span className="text-xs font-medium text-gray-400">Day {displayStreak}</span>
         </div>
         
         <div className="flex justify-between items-center relative z-10">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-[#2c2c2c] -z-10 rounded-full"></div>
            <div className="absolute top-1/2 left-0 h-1 bg-orange-500 -z-10 rounded-full transition-all duration-500" style={{ width: `${(Math.min(displayStreak, 7) / 7) * 100}%` }}></div>

            {[1,2,3,4,5,6,7].map((day) => (
                <div key={day} className={`flex flex-col items-center gap-1 transition-all duration-300 ${day <= displayStreak ? 'opacity-100' : 'opacity-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-4 transition-all ${
                        day <= displayStreak 
                        ? 'bg-orange-500 border-white dark:border-[#1e1e1e] text-white shadow-lg scale-110' 
                        : 'bg-gray-200 dark:bg-[#333] border-white dark:border-[#1e1e1e] text-gray-400'
                    }`}>
                        {day <= displayStreak ? <CheckCircle className="w-4 h-4" /> : day}
                    </div>
                </div>
            ))}
         </div>
         
         <Button 
            fullWidth 
            onClick={handleDailyCheckIn}
            disabled={isClaimedToday || isLoading}
            className={`mt-5 py-3 rounded-xl font-bold text-sm ${isClaimedToday ? 'bg-green-500/10 text-green-500' : ''}`}
         >
            {isClaimedToday ? "Streak Active" : "Check In Now"}
         </Button>
      </div>

      {/* Challenge Banner */}
      <div className="mx-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
         <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
            <Target className="w-32 h-32" />
         </div>
         <div className="relative z-10 flex justify-between items-center">
            <div>
               <h3 className="font-bold text-lg mb-1">Daily Goal</h3>
               <p className="text-xs text-indigo-100 opacity-90">Watch 3 Ads today</p>
               <div className="mt-2 bg-black/20 rounded-full h-1.5 w-24 overflow-hidden">
                  <div className="h-full bg-white transition-all duration-500" style={{ width: `${Math.min(100, (challenge.adsWatched / challengeTargetAds) * 100)}%` }}></div>
               </div>
            </div>
            <div className="text-right">
               {isChallengeClaimed ? (
                  <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                     <CheckCircle className="w-3 h-3" /> Done
                  </span>
               ) : (
                  <Button 
                     onClick={claimChallengeBonus}
                     disabled={!isChallengeComplete || isLoading}
                     className="py-2 px-4 text-xs bg-white text-indigo-600 hover:bg-indigo-50"
                  >
                     {isChallengeComplete ? "Claim 50" : `${challenge.adsWatched}/3`}
                  </Button>
               )}
            </div>
         </div>
      </div>

      {/* Games Section */}
      <div className="grid grid-cols-2 gap-3 px-2">
         <div onClick={() => navigate('/spin')} className="bg-[#1e1e1e] border border-[#333] rounded-2xl p-4 relative overflow-hidden group cursor-pointer hover:border-orange-500/50 transition-colors">
            <div className="absolute -right-4 -top-4 bg-purple-500/20 w-20 h-20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-all"></div>
            <Gift className="w-8 h-8 text-purple-400 mb-2 relative z-10" />
            <h4 className="font-bold text-white relative z-10">Lucky Wheel</h4>
            <p className="text-[10px] text-gray-500 mb-2 relative z-10">{userData?.spinsAvailable || 0} Spins Left</p>
            <div className="inline-block bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/20">Win 150-200</div>
         </div>

         <div onClick={() => navigate('/scratch')} className="bg-[#1e1e1e] border border-[#333] rounded-2xl p-4 relative overflow-hidden group cursor-pointer hover:border-pink-500/50 transition-colors">
            <div className="absolute -right-4 -top-4 bg-pink-500/20 w-20 h-20 rounded-full blur-xl group-hover:bg-pink-500/30 transition-all"></div>
            <Sparkles className="w-8 h-8 text-pink-400 mb-2 relative z-10" />
            <h4 className="font-bold text-white relative z-10">Scratch Card</h4>
            <p className="text-[10px] text-gray-500 mb-2 relative z-10">{userData?.scratchCardsAvailable || 0} Cards</p>
            <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
               <div className="h-full bg-pink-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="text-[9px] text-pink-400 mt-1 font-bold">Next Goal: {milestoneTarget}</p>
         </div>
      </div>

      {/* Task List */}
      <div id="task-section" className="px-2">
         <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white">Earn Coins</h3>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-2 py-0.5 rounded-md font-bold">
               {calculateAdsLeft()} left
            </span>
         </div>

         <div className="space-y-3">
            {/* Primary Task */}
            <div className="bg-white dark:bg-[#1e1e1e] border border-orange-200 dark:border-orange-900/30 p-3 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
               <div className="absolute left-0 top-0 w-1 h-full bg-orange-500"></div>
               <div className="flex items-center gap-3 pl-2">
                  <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                     <Play className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                     <h4 className="font-bold text-sm text-gray-900 dark:text-white">Watch Ad</h4>
                     <p className="text-[10px] text-gray-500">+50 Coins • Instant</p>
                  </div>
               </div>
               <Button 
                  onClick={() => handleClaimReward('interstitial')}
                  disabled={isLoading}
                  className="py-2 px-5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/30"
               >
                  CLAIM
               </Button>
            </div>

            {/* Other Tasks */}
            {[
               { title: "Visit & Earn", icon: MousePointer, reward: "50", action: 'popup', color: 'blue' },
               { title: "Watch Video", icon: Video, reward: "50", action: 'inApp', color: 'indigo' },
               { title: "Play Mini Game", icon: Gamepad2, reward: "100", action: 'miniApp', color: 'emerald' },
            ].map((task, i) => (
               <div key={i} className="bg-white dark:bg-[#1e1e1e] p-3 rounded-2xl border border-gray-100 dark:border-[#2c2c2c] flex items-center justify-between shadow-sm active:scale-[0.99] transition-transform cursor-pointer" onClick={() => handleClaimReward(task.action as any)}>
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        task.color === 'blue' ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/20' :
                        task.color === 'indigo' ? 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20' :
                        'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20'
                     }`}>
                        <task.icon className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{task.title}</h4>
                        <p className="text-[10px] text-gray-500">Reward: {task.reward} Coins</p>
                     </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
               </div>
            ))}
         </div>
      </div>

      <Modal 
        isOpen={modalInfo.isOpen} 
        message={modalInfo.message} 
        title={modalInfo.title}
        onClose={closeModal} 
      />
    </div>
  );
};