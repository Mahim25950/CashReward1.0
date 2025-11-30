import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const ScratchPage: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isScratching, setIsScratching] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reward, setReward] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStartedScratching, setHasStartedScratching] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, message: '', title: '' });

  const initCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#CCCCCC'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#999999';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Scratch Here!", canvas.width / 2, canvas.height / 2);

    setRevealed(false);
    setHasStartedScratching(false);
    
    // Reward Range: 150 to 200
    const randomReward = Math.floor(Math.random() * 51) + 150;
    setReward(randomReward);
  };

  useEffect(() => {
    if (userData && (userData.scratchCardsAvailable || 0) > 0) {
      initCanvas();
    }
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, [userData]);

  const handleScratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (revealed || !isScratching) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    if (!hasStartedScratching) setHasStartedScratching(true);

    checkRevealProgress();
  };

  const checkRevealProgress = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let transparentPixels = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4 * 20) { 
      if (data[i + 3] === 0) {
        transparentPixels++;
      }
    }

    const percentage = (transparentPixels / (totalPixels / 20)) * 100;
    
    if (percentage > 40) {
      setRevealed(true);
      claimReward();
    }
  };

  const claimReward = async () => {
    if (isProcessing || !userData) return;
    setIsProcessing(true);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    try {
      const userRef = doc(db, "users", userData.uid);
      
      const updates: any = {
        scratchCardsAvailable: increment(-1),
        balance: increment(reward),
        lifetimeEarnings: increment(reward),
        weeklyEarnings: increment(reward)
      };

      // Check Milestones
      const currentLifetime = userData.lifetimeEarnings || 0;
      const newLifetime = currentLifetime + reward;
      const currentMilestone = userData.nextMilestone || 1000;
      let milestoneMsg = "";

      if (newLifetime >= 10000 && currentMilestone < 10000) {
         updates.spinsAvailable = increment(3);
         updates.scratchCardsAvailable = increment(3 - 1); // +3 earned, -1 used
         updates.nextMilestone = 20000;
         milestoneMsg = "\n🏆 10k Milestone: +3 Spins & +3 Scratch Cards!";
      } 
      else if (newLifetime >= 3000 && currentMilestone < 3000) {
         updates.spinsAvailable = increment(1);
         updates.scratchCardsAvailable = increment(1 - 1); // +1 earned, -1 used
         updates.nextMilestone = 10000;
         milestoneMsg = "\n🥈 3k Milestone: +1 Spin & +1 Scratch Card!";
      }
      else if (newLifetime >= 1000 && currentMilestone < 1000) {
         updates.spinsAvailable = increment(1);
         updates.nextMilestone = 3000;
         milestoneMsg = "\n🥉 1k Milestone: +1 Free Spin!";
      }

      await updateDoc(userRef, updates);
      await refreshUserData();
      
      let msg = `You won ${reward} Coins!`;
      if (milestoneMsg) msg += milestoneMsg;

      setModal({ isOpen: true, title: 'Yay!', message: msg });
    } catch (error) {
      console.error("Error claiming scratch reward", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const startScratch = () => setIsScratching(true);
  const endScratch = () => setIsScratching(false);

  const availableCards = userData?.scratchCardsAvailable || 0;

  return (
    <div className="flex flex-col items-center p-4 min-h-[80vh]">
      <div className="w-full flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-3 text-gray-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-white">Scratch Card</h2>
      </div>

      <div className="text-center mb-8">
        <p className="text-gray-400">Available Cards</p>
        <p className="text-4xl font-bold text-[#ff8c00]">{availableCards}</p>
        <p className="text-xs text-gray-500 mt-2">Earn 150-200 Coins Guaranteed!</p>
      </div>

      {availableCards > 0 || (revealed && reward > 0) ? (
        <div className="relative w-64 h-64 bg-gradient-to-br from-yellow-100 to-yellow-300 rounded-lg shadow-xl overflow-hidden select-none">
          <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
            <Sparkles className="w-12 h-12 text-[#ff8c00] mb-2 animate-bounce" />
            <h3 className="text-3xl font-bold text-gray-800">{reward}</h3>
            <p className="text-sm font-bold text-gray-600">COINS</p>
          </div>

          {!revealed && (
            <div ref={containerRef} className="absolute inset-0 z-10 w-full h-full">
              <canvas
                ref={canvasRef}
                onMouseDown={startScratch}
                onMouseUp={endScratch}
                onMouseMove={handleScratch}
                onMouseLeave={endScratch}
                onTouchStart={startScratch}
                onTouchEnd={endScratch}
                onTouchMove={handleScratch}
                className="w-full h-full cursor-pointer touch-none"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#2c2c2c] p-8 rounded-lg text-center border border-[#444] w-full max-w-xs">
          <p className="text-gray-400 mb-4">No cards available.</p>
          <p className="text-sm text-gray-500">Hit earning milestones (3k, 10k) to get more!</p>
          <Button onClick={() => navigate('/home')} className="mt-4" fullWidth>
            Back to Home
          </Button>
        </div>
      )}

      {revealed && availableCards > 0 && (
        <Button onClick={initCanvas} className="mt-8">
          Scratch Next Card
        </Button>
      )}

      <Modal 
        isOpen={modal.isOpen} 
        title={modal.title} 
        message={modal.message} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />
    </div>
  );
};