import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { WalletPage } from './pages/WalletPage';
import { ReferPage } from './pages/ReferPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SpinPage } from './pages/SpinPage';
import { ScratchPage } from './pages/ScratchPage';
import { SupportPage } from './pages/SupportPage';
import { AdminPage } from './pages/AdminPage'; // Import AdminPage
import { collection, query, where, getDocs, limit, doc, updateDoc } from 'firebase/firestore';
import { db, messaging } from './services/firebase';
import { getToken } from 'firebase/messaging';

const AppRoutes: React.FC = () => {
  const { currentUser, userData, loading } = useAuth();
  const [hasNotifs, setHasNotifs] = useState(false);

  useEffect(() => {
    const checkNotifications = async () => {
      if (!userData?.lastNotificationCheck) return;
      try {
        const q = query(
          collection(db, "notifications"), 
          where("createdAt", ">", userData.lastNotificationCheck), 
          limit(1)
        );
        const snapshot = await getDocs(q);
        setHasNotifs(!snapshot.empty);
      } catch (err) {
        console.error(err);
      }
    };

    const registerPushNotifications = async () => {
        if (!messaging || !userData || userData.fcmToken) return;
        
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const token = await getToken(messaging, { 
                    // This VAPID key is a placeholder. In a real app, generate this pair in Firebase Console.
                    // Without it, getToken may still work with default config if the project is set up right.
                    vapidKey: 'BMD_X_PLACEHOLDER_VAPID_KEY_HERE_FOR_DEMO' 
                }).catch(e => {
                     console.warn("Failed to get token (missing config or SW):", e);
                     return null;
                });

                if (token) {
                    await updateDoc(doc(db, "users", userData.uid), {
                        fcmToken: token
                    });
                }
            }
        } catch (err) {
            console.error("Notification permission error:", err);
        }
    };

    if (userData) {
      checkNotifications();
      registerPushNotifications();
    }
  }, [userData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#ff8c00]"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <Layout showNotifBadge={hasNotifs}>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/refer" element={<ReferPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/spin" element={<SpinPage />} />
        <Route path="/scratch" element={<ScratchPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;