import { Timestamp } from 'firebase/firestore';

export interface UserData {
  uid: string;
  telegramId?: string; // New field for Telegram ID
  name: string;
  email: string;
  balance: number;
  referralCode: string;
  referredBy: string | null;
  lastNotificationCheck?: Timestamp | Date;
  createdAt: Timestamp | Date;
  dailyAdCount: number;
  lastAdWatchDate: string;
  isBlocked: boolean;
  fcmToken?: string; 
  
  // Gamification Fields
  currentStreak?: number;
  lastCheckInDate?: string; 
  spinsAvailable?: number;
  lastFreeSpinDate?: string; 
  
  // Scratch Card Fields
  scratchCardsAvailable?: number;
  coinsProgressToScratch?: number; // Kept for legacy, but UI will focus on Milestone
  
  // Milestone System (New)
  nextMilestone?: number; // Tracks 1000 -> 3000 -> 10000

  // New Social & Engagement Fields
  referralCount?: number;
  lifetimeEarnings?: number; 
  weeklyEarnings?: number; 
  
  // Micro-Task Challenge
  dailyChallenge?: {
    date: string;
    adsWatched: number;
    scratchesDone: number;
    claimed: boolean;
  };
}

export interface WithdrawalRequest {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method: string;
  paymentDetail: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Timestamp | Date;
}

export interface NotificationMsg {
  id: string;
  title: string;
  message: string;
  createdAt: Timestamp | Date;
}

export interface SupportTicket {
  id?: string;
  userId: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  createdAt: Timestamp | Date;
}

export interface AppConfig {
  minWithdrawal: number;
  paymentMethods: string[];
  dailyAdLimit: number;
  coinValueCoins: number;
  coinValueInr: number;
}

// --- Telegram Web App Types ---
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date?: string;
    hash?: string;
    start_param?: string;
  };
  version: string;
  platform: string;
  themeParams: any;
  ready: () => void;
  expand: () => void;
  close: () => void;
  openLink: (url: string) => void;
}

// Extend Window interface
declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
    show_9299851: (options?: any) => Promise<void>;
    show_8690632: () => Promise<void>; 
  }
}