import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';

export const SpinPage: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [modal, setModal] = useState({ isOpen: false, message: '', title: '' });

  // Segments updated to range 150-200 as requested
  const segments = [
    { value: 150, color: '#ef4444', label: '150', textColor: 'white' },     // Red
    { value: 160, color: '#f59e0b', label: '160', textColor: 'black' },     // Amber
    { value: 170, color: '#10b981', label: '170', textColor: 'white' },     // Emerald
    { value: 180, color: '#3b82f6', label: '180', textColor: 'white' },     // Blue
    { value: 190, color: '#8b5cf6', label: '190', textColor: 'white' },     // Violet
    { value: 200, color: '#ec4899', label: '200', textColor: 'white' },     // Pink
  ];

  const handleSpin = async () => {
    if (!userData) return;
    if ((userData.spinsAvailable || 0) <= 0) {
      setModal({ isOpen: true, title: 'No Spins', message: 'You have no spins left! Watch ads to earn more spins.' });
      return;
    }

    setSpinning(true);

    // Random outcome logic
    const randomIndex = Math.floor(Math.random() * segments.length);
    const result = segments[randomIndex];
    
    // Each segment covers (360 / length) degrees
    const segmentAngle = 360 / segments.length;
    const randomOffset = Math.floor(Math.random() * (segmentAngle - 10)) - (segmentAngle/2 - 5);
    const targetAngle = 360 - (randomIndex * segmentAngle) - (segmentAngle / 2);
    const spinAmount = 1800 + targetAngle + randomOffset; 
    
    const newRotation = rotation + spinAmount;

    setRotation(newRotation);

    setTimeout(async () => {
      try {
        const userRef = doc(db, "users", userData.uid);
        
        const updates: any = {
          spinsAvailable: increment(-1),
          balance: increment(result.value),
          lifetimeEarnings: increment(result.value),
          weeklyEarnings: increment(result.value)
        };
        
        // Check Milestones
        const currentLifetime = userData.lifetimeEarnings || 0;
        const newLifetime = currentLifetime + result.value;
        const currentMilestone = userData.nextMilestone || 1000;
        let milestoneMsg = "";

        // Milestone Logic
        if (newLifetime >= 10000 && currentMilestone < 10000) {
           updates.spinsAvailable = increment(3 - 1); // +3 earned, -1 used
           updates.scratchCardsAvailable = increment(3);
           updates.nextMilestone = 20000; // Next goal (cap)
           milestoneMsg = "\n🏆 10k Milestone: +3 Spins & +3 Scratch Cards!";
        } 
        else if (newLifetime >= 3000 && currentMilestone < 3000) {
           updates.spinsAvailable = increment(1 - 1); // +1 earned, -1 used
           updates.scratchCardsAvailable = increment(1);
           updates.nextMilestone = 10000;
           milestoneMsg = "\n🥈 3k Milestone: +1 Spin & +1 Scratch Card!";
        }
        else if (newLifetime >= 1000 && currentMilestone < 1000) {
           updates.spinsAvailable = increment(1 - 1); // +1 earned, -1 used
           updates.nextMilestone = 3000;
           milestoneMsg = "\n🥉 1k Milestone: +1 Free Spin!";
        }

        await updateDoc(userRef, updates);
        await refreshUserData();
        
        let msg = `You won ${result.value} coins.`;
        if (milestoneMsg) msg += milestoneMsg;

        setModal({ 
          isOpen: true, 
          title: 'You Won!', 
          message: msg
        });

      } catch (error) {
        console.error("Spin error:", error);
      } finally {
        setSpinning(false);
      }
    }, 4000); // 4 seconds duration
  };

  const gradientString = `conic-gradient(${segments.map((s, i) => {
    const start = (i * 100) / segments.length;
    const end = ((i + 1) * 100) / segments.length;
    return `${s.color} ${start}% ${end}%`;
  }).join(', ')})`;

  return (
    <div className="flex flex-col items-center p-4 min-h-[90vh] bg-[#121212]">
       <div className="w-full flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-3 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-white flex items-center">
            <Star className="w-5 h-5 text-yellow-500 mr-2 fill-yellow-500" />
            Lucky Wheel
        </h2>
      </div>

      <div className="bg-[#1e1e1e] rounded-xl p-4 w-full max-w-sm mb-8 flex justify-between items-center shadow-lg border border-[#333]">
        <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider">Available Spins</p>
            <p className="text-2xl font-bold text-[#ff8c00]">{userData?.spinsAvailable || 0}</p>
        </div>
        <div className="text-right">
             <p className="text-xs text-gray-500">Every 150-200 Coins Guaranteed!</p>
        </div>
      </div>

      <div className="relative mb-12 transform scale-100 sm:scale-110">
        <div className="w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] rounded-full bg-gradient-to-b from-yellow-700 to-yellow-900 p-3 shadow-2xl relative flex items-center justify-center">
             <div className="absolute inset-2 rounded-full border-4 border-dashed border-yellow-400/30"></div>
             <div 
                className="w-full h-full rounded-full overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border-4 border-[#2c2c2c]"
                style={{ 
                    transition: 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)', 
                    transform: `rotate(${rotation}deg)`,
                    background: gradientString
                }}
             >
                {segments.map((seg, i) => (
                    <div 
                        key={i}
                        className="absolute top-0 left-1/2 w-[1px] h-[50%] origin-bottom"
                        style={{ transform: `rotate(${i * (360 / segments.length) + (360/segments.length)/2}deg)` }}
                    >
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 -rotate-90">
                            <span 
                                className="text-2xl font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" 
                                style={{ color: seg.textColor }}
                            >
                                {seg.label}
                            </span>
                        </div>
                    </div>
                ))}
             </div>

             <div className="absolute w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-300 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] border-4 border-gray-400 flex items-center justify-center z-10">
                 <div className="w-8 h-8 bg-[#1e1e1e] rounded-full flex items-center justify-center shadow-inner">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                 </div>
             </div>
        </div>

        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20 filter drop-shadow-lg">
            <div className="w-10 h-12 bg-gradient-to-b from-red-500 to-red-700 shadow-md" 
                 style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}>
            </div>
        </div>
        
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-48 h-8 bg-black/40 blur-xl rounded-[100%]"></div>
      </div>

      <Button 
        onClick={handleSpin} 
        disabled={spinning || (userData?.spinsAvailable || 0) <= 0}
        className={`w-full max-w-xs py-4 text-xl font-bold rounded-full transition-all transform active:scale-95 shadow-xl border-b-4 ${
            spinning || (userData?.spinsAvailable || 0) <= 0 
            ? 'bg-gray-700 border-gray-900 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-yellow-500 to-orange-600 border-orange-800 text-white hover:brightness-110'
        }`}
      >
        {spinning ? 'SPINNING...' : 'SPIN NOW'}
      </Button>

      <Modal 
        isOpen={modal.isOpen} 
        title={modal.title} 
        message={modal.message} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />
    </div>
  );
};