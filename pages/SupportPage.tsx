import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle, HelpCircle } from 'lucide-react';

export const SupportPage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, message: '', title: '' });

  const faqs = [
    {
      q: "How do I earn coins?",
      a: "You can earn coins by watching daily ads, checking in daily for streak bonuses, referring friends, and playing the lucky spin or scratch card games."
    },
    {
      q: "When can I withdraw money?",
      a: "You can withdraw your earnings once you reach the minimum threshold of 5000 coins. Go to the Wallet page to request a withdrawal."
    },
    {
      q: "How long does withdrawal take?",
      a: "Withdrawals are typically processed within 24-48 hours. You can check the status in your Wallet history."
    },
    {
      q: "My ad didn't reward me. Why?",
      a: "Ensure you have a stable internet connection and watch the ad completely without skipping. If the problem persists, try restarting the app."
    },
    {
      q: "How do I delete my account?",
      a: "Go to Profile > Delete Account. Note that this action is permanent and you will lose all unwithdrawn coins."
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setModal({ isOpen: true, title: 'Error', message: 'Please fill in all fields.' });
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, "support_tickets"), {
        userId: userData?.uid || 'anonymous',
        userEmail: userData?.email || 'anonymous',
        subject: subject,
        message: message,
        status: 'open',
        createdAt: serverTimestamp()
      });
      setModal({ isOpen: true, title: 'Sent', message: 'Your message has been sent to our support team. We will contact you shortly.' });
      setSubject('');
      setMessage('');
    } catch (error) {
      setModal({ isOpen: true, title: 'Error', message: 'Failed to send message. Please try again later.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center">
        <button onClick={() => navigate(-1)} className="mr-3 text-gray-400 hover:text-white p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Help & Support</h2>
      </div>

      {/* FAQ Section */}
      <section>
        <div className="flex items-center space-x-2 mb-4 text-[#ff8c00]">
          <HelpCircle className="w-5 h-5" />
          <h3 className="font-bold text-lg">Frequently Asked Questions</h3>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <Card key={index} className="p-0 overflow-hidden">
              <button 
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                className="w-full flex justify-between items-center p-4 text-left font-medium text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
              >
                <span>{faq.q}</span>
                {activeFaq === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {activeFaq === index && (
                <div className="p-4 pt-0 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#252525]">
                  {faq.a}
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section className="pt-4">
        <div className="flex items-center space-x-2 mb-4 text-[#ff8c00]">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-bold text-lg">Contact Us</h3>
        </div>
        <Card className="p-4">
          <form onSubmit={handleSubmit}>
            <Input 
              label="Subject"
              placeholder="What do you need help with?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <div className="mb-4">
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Message</label>
              <textarea 
                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] text-gray-900 dark:text-white focus:outline-none focus:border-[#ff8c00] min-h-[100px]"
                placeholder="Describe your issue..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button type="submit" fullWidth disabled={sending}>
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </Card>
      </section>

      <Modal 
        isOpen={modal.isOpen} 
        title={modal.title} 
        message={modal.message} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />
    </div>
  );
};