import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { WithdrawalRequest } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { 
  CreditCard, Smartphone, Globe, Clock, CheckCircle, 
  XCircle, History, Wallet, ArrowRight 
} from 'lucide-react';

export const WalletPage: React.FC = () => {
  const { userData, appConfig, refreshUserData } = useAuth();
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [method, setMethod] = useState<string>(appConfig.paymentMethods[0] || 'bKash');
  const [paymentDetail, setPaymentDetail] = useState('');
  const [history, setHistory] = useState<WithdrawalRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, message: '', title: '' });

  useEffect(() => {
    if (userData?.uid) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.uid]);

  const loadHistory = async () => {
    if (!userData) return;
    setLoadingHistory(true);
    try {
      // Optimized Query: Only filter by userId to avoid composite index issues
      const q = query(
        collection(db, "withdrawals"), 
        where("userId", "==", userData.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const data: WithdrawalRequest[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WithdrawalRequest[];

      // Client-side sorting
      data.sort((a, b) => {
          const tA = (a.requestedAt as any)?.seconds || 0;
          const tB = (b.requestedAt as any)?.seconds || 0;
          return tB - tA;
      });

      setHistory(data);
    } catch (error) {
      console.error("Error loading history", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!userData) return;

    const amount = parseInt(withdrawAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setModal({ isOpen: true, message: "Please enter a valid amount.", title: "Invalid Input" });
      return;
    }

    if (amount < appConfig.minWithdrawal) {
      setModal({ isOpen: true, message: `Minimum withdrawal is ${appConfig.minWithdrawal} coins.`, title: "Minimum Limit" });
      return;
    }

    if (amount > userData.balance) {
      setModal({ isOpen: true, message: "Insufficient balance.", title: "Error" });
      return;
    }

    if (!paymentDetail.trim()) {
      setModal({ isOpen: true, message: "Please enter payment details.", title: "Missing Info" });
      return;
    }

    setProcessing(true);
    try {
      // 1. Deduct balance first
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, { balance: increment(-amount) });

      // 2. Create Request
      await addDoc(collection(db, "withdrawals"), {
        userId: userData.uid,
        userName: userData.name,
        userEmail: userData.email,
        amount: amount,
        method: method,
        paymentDetail: paymentDetail,
        status: "pending",
        requestedAt: serverTimestamp()
      });

      await refreshUserData();
      await loadHistory();
      setWithdrawAmount('');
      setPaymentDetail('');
      setModal({ isOpen: true, message: "Withdrawal request submitted successfully!", title: "Success" });

    } catch (error: any) {
      console.error(error);
      setModal({ isOpen: true, message: "Error processing request. Please try again.", title: "Error" });
    } finally {
      setProcessing(false);
    }
  };

  const getPlaceholder = () => {
    const m = method.toLowerCase();
    if (m.includes('upi')) return "Enter UPI ID";
    if (m.includes('bkash')) return "Enter bKash Number";
    if (m.includes('nagad')) return "Enter Nagad Number";
    if (m.includes('rocket')) return "Enter Rocket Number";
    return "Enter Account Details";
  };

  // Updated quick amounts based on 10,000 min withdrawal
  const quickAmounts = [10000, 20000, 50000];

  return (
    <div className="space-y-6 pb-20">
      {/* Glassmorphism Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e1e1e] to-gray-900 p-6 shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff8c00]/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
        <div className="relative z-10 text-center">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Balance</p>
            <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-4xl font-black text-white">{userData?.balance || 0}</span>
                <span className="text-[#ff8c00] font-bold">CP</span>
            </div>
            <div className="inline-block bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                <p className="text-xs text-white font-medium">
                   ≈ ৳{((userData?.balance || 0) / (appConfig.coinValueCoins / appConfig.coinValueInr)).toFixed(2)} BDT
                </p>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2c2c2c]">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#ff8c00]" />
            Withdraw Method
        </h3>
        
        {/* Visual Payment Selector */}
        <div className="grid grid-cols-3 gap-2 mb-6">
            {appConfig.paymentMethods.map((m) => {
                const isSelected = method === m;
                return (
                    <button
                        key={m}
                        onClick={() => setMethod(m)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                            isSelected 
                            ? 'bg-[#ff8c00]/10 border-[#ff8c00] text-[#ff8c00]' 
                            : 'bg-gray-50 dark:bg-[#2c2c2c] border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#333]'
                        }`}
                    >
                        {m.toLowerCase().includes('bkash') ? <Smartphone className="w-6 h-6 mb-1" /> :
                         m.toLowerCase().includes('nagad') ? <Wallet className="w-6 h-6 mb-1" /> :
                         <Globe className="w-6 h-6 mb-1" />}
                        <span className="text-[10px] font-bold">{m}</span>
                    </button>
                )
            })}
        </div>

        {/* Amount Input & Quick Chips */}
        <div className="space-y-3">
             <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Amount</span>
                <span>Min: {appConfig.minWithdrawal}</span>
             </div>
             <Input 
                type="number" 
                placeholder="0" 
                value={withdrawAmount} 
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="text-center text-lg font-bold tracking-wider" 
             />
             <div className="flex gap-2 justify-center">
                {quickAmounts.map(amt => (
                    <button
                        key={amt}
                        onClick={() => setWithdrawAmount(amt.toString())}
                        className="px-3 py-1 bg-gray-100 dark:bg-[#2c2c2c] text-xs font-medium rounded-full text-gray-600 dark:text-gray-300 hover:bg-[#ff8c00] hover:text-white transition-colors"
                    >
                        {amt}
                    </button>
                ))}
             </div>
        </div>

        {/* Payment Details */}
        <div className="mt-4">
            <Input 
                type="text" 
                placeholder={getPlaceholder()} 
                value={paymentDetail} 
                onChange={(e) => setPaymentDetail(e.target.value)} 
            />
        </div>

        <Button 
          fullWidth 
          onClick={handleWithdrawal} 
          disabled={processing}
          className="mt-4 py-4 text-sm uppercase tracking-wide shadow-lg shadow-orange-500/20"
        >
          {processing ? "Processing Request..." : "Confirm Withdraw"}
        </Button>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2 px-2">
            <History className="w-5 h-5" /> Transaction History
        </h3>
        
        <div className="space-y-3">
          {loadingHistory && <div className="text-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-[#ff8c00] mx-auto"></div></div>}
          
          {!loadingHistory && history.length === 0 && (
            <div className="text-center py-8 opacity-50 bg-white dark:bg-[#1e1e1e] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">No transactions yet</p>
            </div>
          )}

          {history.map((item) => (
            <div key={item.id} className="bg-white dark:bg-[#1e1e1e] rounded-xl p-4 flex items-center justify-between border border-gray-100 dark:border-[#2c2c2c] shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.status === 'approved' ? 'bg-green-100 dark:bg-green-900/20 text-green-500' :
                    item.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/20 text-red-500' :
                    'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-500'
                }`}>
                    {item.status === 'approved' ? <CheckCircle className="w-5 h-5" /> :
                     item.status === 'rejected' ? <XCircle className="w-5 h-5" /> :
                     <Clock className="w-5 h-5" />}
                </div>
                <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{item.method}</p>
                    <p className="text-[10px] text-gray-400">
                        {item.requestedAt ? new Date((item.requestedAt as any).seconds * 1000).toLocaleDateString() : 'Date N/A'}
                    </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-white">-{item.amount}</p>
                <p className={`text-[10px] font-bold capitalize ${
                    item.status === 'approved' ? 'text-green-500' :
                    item.status === 'rejected' ? 'text-red-500' :
                    'text-yellow-500'
                }`}>
                    {item.status}
                </p>
              </div>
            </div>
          ))}
        </div>
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