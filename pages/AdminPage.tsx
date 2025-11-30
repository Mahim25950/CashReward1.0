import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ArrowLeft, Users, Wallet, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';

export const AdminPage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingWithdrawals: 0,
    totalWithdrawals: 0
  });
  const [loading, setLoading] = useState(true);

  // Security Check
  useEffect(() => {
    if (!userData || userData.email?.toLowerCase() !== '@mahim9780') {
      navigate('/home');
    }
  }, [userData, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Users Count
        const usersColl = collection(db, "users");
        const usersSnapshot = await getCountFromServer(usersColl);
        
        // Pending Withdrawals
        const withdrawalsColl = collection(db, "withdrawals");
        const pendingQuery = query(withdrawalsColl, where("status", "==", "pending"));
        const pendingSnapshot = await getCountFromServer(pendingQuery);
        
        // Total Withdrawals count
        const totalWithdrawalsSnapshot = await getCountFromServer(withdrawalsColl);

        setStats({
          totalUsers: usersSnapshot.data().count,
          pendingWithdrawals: pendingSnapshot.data().count,
          totalWithdrawals: totalWithdrawalsSnapshot.data().count
        });
      } catch (error) {
        console.error("Error fetching admin stats", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userData?.email?.toLowerCase() === '@mahim9780') {
        fetchStats();
    }
  }, [userData]);

  if (loading) {
    return <div className="p-10 text-center text-white">Loading Admin Panel...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center">
        <button onClick={() => navigate(-1)} className="mr-3 text-gray-400 hover:text-white p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-blue-600 text-white border-none">
          <div className="flex flex-col">
            <Users className="w-6 h-6 mb-2 opacity-80" />
            <span className="text-3xl font-bold">{stats.totalUsers}</span>
            <span className="text-xs opacity-80">Total Users</span>
          </div>
        </Card>
        
        <Card className="bg-orange-500 text-white border-none">
          <div className="flex flex-col">
            <AlertCircle className="w-6 h-6 mb-2 opacity-80" />
            <span className="text-3xl font-bold">{stats.pendingWithdrawals}</span>
            <span className="text-xs opacity-80">Pending Requests</span>
          </div>
        </Card>

        <Card className="col-span-2 bg-[#2c2c2c] text-white border border-[#444]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Wallet className="w-8 h-8 text-green-500" />
               <div>
                 <p className="font-bold text-lg">Total Transactions</p>
                 <p className="text-xs text-gray-400">{stats.totalWithdrawals} processed</p>
               </div>
            </div>
            <div className="text-right">
              {/* Placeholder for specific actions */}
              <span className="text-xs text-gray-500">View All</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-200 text-sm">
        <p className="font-bold mb-1">Admin Access</p>
        <p>You are logged in as Super Admin (@Mahim9780). You have full access to system metrics.</p>
      </div>
    </div>
  );
};