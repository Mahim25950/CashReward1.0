import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInAnonymously, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserData, AppConfig } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  appConfig: AppConfig;
  loading: boolean;
  refreshUserData: () => Promise<void>;
  logout: () => Promise<void>;
  isTelegramUser: boolean;
  loginAsGuest: () => Promise<void>;
  resetPassword: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper to remove undefined fields recursively
const cleanPayload = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    // Handle Arrays
    if (Array.isArray(obj)) {
        return obj.map(cleanPayload);
    }

    const cleaned: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value !== undefined) {
                cleaned[key] = cleanPayload(value);
            }
        }
    }
    return cleaned;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isTelegramUser, setIsTelegramUser] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig>({
    minWithdrawal: 10000, // Updated to 10,000 Coins
    paymentMethods: ["bKash", "Nagad", "Rocket"],
    dailyAdLimit: 10,
    coinValueCoins: 1000,
    coinValueInr: 3 // Updated: 1000 Coins = 3 TK
  });
  const [loading, setLoading] = useState(true);

  const fetchAppConfig = async () => {
    try {
      const configRef = doc(db, "config", "main");
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        setAppConfig(configSnap.data() as AppConfig);
      }
    } catch (error) {
      console.error("Error fetching config", error);
    }
  };

  const loginAsGuest = async () => {
    setLoading(true);
    try {
      let firebaseUser = auth.currentUser;
      
      if (!firebaseUser) {
        try {
            // 1. Try Anonymous Auth first
            const cred = await signInAnonymously(auth);
            firebaseUser = cred.user;
        } catch (anonError: any) {
            console.warn("Anonymous auth failed (likely disabled in console), trying fallback:", anonError.code);
            
            // 2. Fallback: Check if it's a restricted operation (Anonymous disabled)
            if (anonError.code === 'auth/admin-restricted-operation' || anonError.code === 'auth/operation-not-allowed') {
                const randomId = Math.random().toString(36).substring(2, 10);
                const dummyEmail = `guest_${randomId}@cashreward.temp`;
                const dummyPass = `guest_${randomId}_pass`; // In a real app, don't hardcode logic like this, but this fixes the immediate crash
                
                // Create a generic email user to act as guest
                const cred = await createUserWithEmailAndPassword(auth, dummyEmail, dummyPass);
                firebaseUser = cred.user;
            } else {
                throw anonError;
            }
        }
      }

      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        // For guests, we use the Firebase UID as the document ID
        await fetchUserData(firebaseUser.uid); 
      }
    } catch (error: any) {
      console.error("Guest login fatal error:", error);
      alert(`Login failed: ${error.message}. Please contact support or try opening in Telegram.`);
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramAuth = async () => {
    try {
      // Check if window.Telegram exists before accessing WebApp
      if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
          setLoading(false);
          return;
      }

      const tg = window.Telegram.WebApp;
      
      // Check if actually running inside Telegram (initDataUnsafe must be populated)
      if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) {
        console.log("Not running in Telegram or no user data");
        setLoading(false);
        return;
      }

      // Safe call to ready
      if (tg.ready) tg.ready();
      if (tg.expand) tg.expand();

      const tgUser = tg.initDataUnsafe.user;

      if (tgUser) {
        setIsTelegramUser(true);
        
        // 1. Sign in anonymously to Firebase (to allow DB access)
        let firebaseUser = auth.currentUser;
        if (!firebaseUser) {
            try {
                const cred = await signInAnonymously(auth);
                firebaseUser = cred.user;
            } catch (err: any) {
                 // If anonymous is disabled, we must fallback even for Telegram users to an email-based account
                 if (err.code === 'auth/admin-restricted-operation') {
                     const email = `tg_${tgUser.id}@cashreward.app`;
                     const pass = `tg_secret_${tgUser.id}`; // deterministic password for auto-login
                     try {
                         const cred = await signInWithEmailAndPassword(auth, email, pass);
                         firebaseUser = cred.user;
                     } catch (loginErr) {
                         const cred = await createUserWithEmailAndPassword(auth, email, pass);
                         firebaseUser = cred.user;
                     }
                 } else {
                     throw err;
                 }
            }
        }

        if (firebaseUser) {
          setCurrentUser(firebaseUser);
          // 2. Fetch/Create User Data using TELEGRAM ID as the key
          await fetchUserData(tgUser.id.toString(), tgUser);
        }
      }
    } catch (error) {
      console.error("Telegram Auth Error:", error);
      setLoading(false);
    }
  };

  const fetchUserData = async (id: string, tgUser?: any) => {
    // id is either Telegram ID (for TG users) or Firebase UID (for guests)
    const userRef = doc(db, "users", id);
    const today = new Date().toISOString().split('T')[0];

    try {
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data() as UserData;
        
        const updates: any = {};
        let needsUpdate = false;

        // Update name/username if changed in Telegram
        const tgName = tgUser 
            ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') 
            : data.name; 
            
        if (tgUser && data.name !== tgName) {
            updates.name = tgName;
            needsUpdate = true;
        }

        // Initialize Milestone if missing
        if (!data.nextMilestone) {
            updates.nextMilestone = 1000;
            needsUpdate = true;
        }

        // Daily Reset Logic
        if (data.lastAdWatchDate !== today) {
          updates.dailyAdCount = 0;
          updates.lastAdWatchDate = today;
          needsUpdate = true;
        }
        if (data.lastFreeSpinDate !== today) {
          updates.spinsAvailable = (data.spinsAvailable || 0) + 1;
          updates.lastFreeSpinDate = today;
          needsUpdate = true;
        }
        if (!data.dailyChallenge || data.dailyChallenge.date !== today) {
          updates.dailyChallenge = {
            date: today,
            adsWatched: 0,
            scratchesDone: 0,
            claimed: false
          };
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateDoc(userRef, cleanPayload(updates));
          setUserData({ ...data, ...updates });
        } else {
          setUserData(data);
        }

        if (data.isBlocked) {
          setUserData(null);
          alert("Your account has been blocked.");
          return;
        }

      } else {
        // Create new user doc
        const ownReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const displayName = tgUser 
            ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') 
            : 'Guest User';
        
        // Define object without undefined fields for Firestore compatibility
        const defaultUserData: UserData = {
          uid: id,
          // telegramId is conditionally added below to avoid 'undefined'
          name: displayName,
          email: tgUser?.username ? `@${tgUser.username}` : '', 
          balance: 50,
          referralCode: ownReferralCode,
          referredBy: null,
          createdAt: serverTimestamp() as any,
          dailyAdCount: 0,
          lastAdWatchDate: today,
          isBlocked: false,
          lastNotificationCheck: new Date(),
          currentStreak: 0,
          lastCheckInDate: '',
          spinsAvailable: 1,
          lastFreeSpinDate: today,
          scratchCardsAvailable: 0,
          coinsProgressToScratch: 0,
          nextMilestone: 1000,
          referralCount: 0,
          lifetimeEarnings: 50,
          weeklyEarnings: 50,
          dailyChallenge: {
            date: today,
            adsWatched: 0,
            scratchesDone: 0,
            claimed: false
          }
        };

        // Explicitly check to avoid passing undefined
        if (tgUser && tgUser.id) {
            defaultUserData.telegramId = tgUser.id.toString();
        }

        await setDoc(userRef, cleanPayload(defaultUserData));
        setUserData(defaultUserData);
        
        // Check for start_param (referral code)
        const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
        if (startParam && startParam !== ownReferralCode && tgUser) {
           // Handle referral logic immediately if needed
           // Ideally, this should call an applyReferral function or similar logic
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (userData?.uid) {
        const userRef = doc(db, "users", userData.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            setUserData(userSnap.data() as UserData);
        }
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUserData(null);
    setCurrentUser(null);
    setIsTelegramUser(false);
  };

  useEffect(() => {
    fetchAppConfig();
    handleTelegramAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
        currentUser, 
        userData, 
        appConfig, 
        loading, 
        refreshUserData, 
        logout, 
        isTelegramUser,
        loginAsGuest,
        resetPassword: async () => {} 
    }}>
      {children}
    </AuthContext.Provider>
  );
};