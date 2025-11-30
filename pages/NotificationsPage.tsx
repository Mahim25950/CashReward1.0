import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { NotificationMsg } from '../types';
import { Card } from '../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as NotificationMsg[];
        setNotifications(data);

        // Update last checked time
        if (userData) {
          await updateDoc(doc(db, "users", userData.uid), {
            lastNotificationCheck: serverTimestamp()
          });
        }
      } catch (err) {
        console.error("Error loading notifications", err);
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate(-1)} className="mr-3 text-gray-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-white">Notifications</h2>
      </div>

      <div className="space-y-3">
        {loading && <p className="text-gray-400 text-center">Loading...</p>}
        {!loading && notifications.length === 0 && (
          <p className="text-gray-400 text-center">No notifications available.</p>
        )}
        {notifications.map((msg) => (
          <Card key={msg.id} className="p-4">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-[#ff8c00]">{msg.title}</h3>
              <p className="text-xs text-gray-400">
                {msg.createdAt ? new Date((msg.createdAt as any).seconds * 1000).toLocaleDateString() : ''}
              </p>
            </div>
            <p className="text-sm text-gray-300">{msg.message}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};