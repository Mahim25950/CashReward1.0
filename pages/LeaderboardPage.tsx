import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Card } from '../components/ui/Card';
import { UserData } from '../types';
import { Trophy, Medal, Crown, User as UserIcon, TrendingUp } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const [leaders, setLeaders] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        // Query by weeklyEarnings
        const q = query(
          collection(db, "users"),
          orderBy("weeklyEarnings", "desc"), 
          limit(20)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => doc.data() as UserData);
        setLeaders(data);
      } catch (error) {
        console.warn("Weekly earnings sort failed, falling back to balance", error);
        try {
             const q2 = query(collection(db, "users"), orderBy("balance", "desc"), limit(20));
             const snapshot2 = await getDocs(q2);
             setLeaders(snapshot2.docs.map(d => d.data() as UserData));
        } catch(e) { console.error(e); }
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, []);

  const TopPlayer = ({ user, rank }: { user: UserData, rank: number }) => {
    let borderColor = 'border-gray-700';
    let iconColor = 'text-gray-400';
    let bgColor = 'bg-gray-800';
    let height = 'h-32';
    let scale = 'scale-100';
    let glow = '';

    if (rank === 1) {
      borderColor = 'border-yellow-400';
      iconColor = 'text-yellow-400';
      bgColor = 'bg-gradient-to-b from-yellow-900/40 to-[#1e1e1e]';
      height = 'h-40';
      scale = 'scale-110 z-10';
      glow = 'shadow-[0_0_20px_rgba(250,204,21,0.3)]';
    } else if (rank === 2) {
      borderColor = 'border-gray-300';
      iconColor = 'text-gray-300';
      bgColor = 'bg-gradient-to-b from-gray-700/40 to-[#1e1e1e]';
      height = 'h-36';
      scale = 'scale-100 mt-4';
    } else if (rank === 3) {
      borderColor = 'border-orange-500';
      iconColor = 'text-orange-500';
      bgColor = 'bg-gradient-to-b from-orange-900/40 to-[#1e1e1e]';
      height = 'h-32';
      scale = 'scale-95 mt-8';
    }

    return (
      <div className={`relative flex flex-col items-center justify-end w-1/3 p-2 rounded-t-xl border-t-4 ${borderColor} ${bgColor} ${height} ${scale} ${glow} transition-all duration-500`}>
        <div className="absolute -top-6">
          {rank === 1 && <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-bounce" />}
        </div>
        
        <div className={`w-12 h-12 rounded-full border-2 ${borderColor} flex items-center justify-center bg-[#2c2c2c] mb-2 overflow-hidden shadow-lg`}>
          <UserIcon className={`w-6 h-6 ${iconColor}`} />
        </div>
        
        <p className="text-xs font-bold text-white text-center truncate w-full px-1">
          {user.name?.split(' ')[0] || 'User'}
        </p>
        <p className={`text-[10px] font-bold ${iconColor} mt-0.5`}>
          {user.weeklyEarnings || user.balance}
        </p>
        
        <div className={`absolute -bottom-3 w-6 h-6 rounded-full ${borderColor} bg-[#121212] border-2 flex items-center justify-center text-[10px] font-bold text-white z-20`}>
          {rank}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 min-h-screen">
      {/* Header Banner */}
      <div className="relative bg-[#1e1e1e] rounded-b-3xl p-6 shadow-xl border-b border-[#333] -mx-4 -mt-4 pt-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            LEADERBOARD
          </h2>
          <p className="text-gray-400 text-xs">Compete for Weekly Rewards!</p>
        </div>

        {/* Podium Section */}
        {!loading && leaders.length >= 3 && (
          <div className="flex justify-center items-end gap-2 px-2 pb-4">
             <TopPlayer user={leaders[1]} rank={2} />
             <TopPlayer user={leaders[0]} rank={1} />
             <TopPlayer user={leaders[2]} rank={3} />
          </div>
        )}
        
        {loading && (
           <div className="flex justify-center py-10">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#ff8c00]"></div>
           </div>
        )}
      </div>

      {/* List Section (Rank 4+) */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between px-2 mb-2">
           <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider">Top Runners</h3>
           <div className="flex items-center text-[#ff8c00] text-xs">
              <TrendingUp className="w-3 h-3 mr-1" /> Live
           </div>
        </div>

        {leaders.slice(3).map((user, index) => (
          <div 
            key={index + 3} 
            className="flex items-center justify-between p-3 bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-100 dark:border-[#2c2c2c] shadow-sm transform transition-transform active:scale-98"
          >
            <div className="flex items-center gap-4">
              <div className="text-gray-500 font-bold w-6 text-center text-sm">{index + 4}</div>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#2c2c2c] flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                 </div>
                 <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {user.name || 'Anonymous'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      ID: {user.uid.slice(0, 4)}...
                    </p>
                 </div>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-[#ff8c00] text-sm">
                {user.weeklyEarnings || user.balance}
              </span>
              <p className="text-[9px] text-gray-400">COINS</p>
            </div>
          </div>
        ))}

        {!loading && leaders.length === 0 && (
            <div className="text-center py-10 opacity-50">
                <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                <p className="text-gray-500">No data available</p>
            </div>
        )}
      </div>
    </div>
  );
};