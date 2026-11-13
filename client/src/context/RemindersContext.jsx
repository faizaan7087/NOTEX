import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendBrowserNotification 
} from '../utils/notificationHelper';

const RemindersContext = createContext(null);

export const RemindersProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const notifiedIdsRef = useRef(new Set());

  // Fetch reminders from backend
  const fetchReminders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getReminders();
      if (res.success) {
        setReminders(res.reminders || []);
      }
    } catch (err) {
      console.error('[Fetch Reminders Error]:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReminders();
    } else {
      setReminders([]);
      notifiedIdsRef.current.clear();
    }
  }, [isAuthenticated, fetchReminders]);

  // Request browser permission
  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      toast.success('Browser notifications enabled! You will be alerted when reminders are due.');
      sendBrowserNotification('NOTEX Notifications Active', {
        body: 'You will receive study reminders and revision alerts here.'
      });
    } else if (res === 'denied') {
      toast.error('Notification permission was blocked in browser settings.');
    }
    return res;
  };

  // Create Reminder
  const createReminder = async (data) => {
    setLoading(true);
    try {
      const res = await api.createReminder(data);
      if (res.success) {
        toast.success('Reminder scheduled!');
        fetchReminders();
        return res.reminder;
      }
    } catch (err) {
      console.error('[Create Reminder Error]:', err);
      toast.error(err.message || 'Failed to schedule reminder');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Toggle Complete status
  const toggleComplete = async (reminder) => {
    try {
      const reminderId = reminder._id || reminder.id;
      const newStatus = !reminder.isCompleted;
      const res = await api.updateReminder(reminderId, { isCompleted: newStatus });
      if (res.success) {
        toast.success(newStatus ? 'Reminder marked as completed!' : 'Reminder reopened');
        setReminders(prev => prev.map(r => (r._id === reminderId || r.id === reminderId ? { ...r, isCompleted: newStatus } : r)));
      }
    } catch (err) {
      console.error('[Toggle Reminder Error]:', err);
      toast.error('Failed to update reminder');
    }
  };

  // Delete Reminder
  const deleteReminder = async (id) => {
    try {
      const res = await api.deleteReminder(id);
      if (res.success) {
        toast.success('Reminder removed');
        setReminders(prev => prev.filter(r => r._id !== id && r.id !== id));
      }
    } catch (err) {
      console.error('[Delete Reminder Error]:', err);
      toast.error('Failed to delete reminder');
    }
  };

  // Periodic Reminder Checker (checks every 20 seconds for due items)
  useEffect(() => {
    if (!isAuthenticated || reminders.length === 0) return;

    const checkDueReminders = () => {
      const now = Date.now();

      reminders.forEach(r => {
        const id = r._id || r.id;
        if (r.isCompleted || notifiedIdsRef.current.has(id)) return;

        const dueTime = new Date(r.dueDate).getTime();
        // If due within the last 15 minutes or up to 30 seconds into the future
        const timeDiff = dueTime - now;

        if (timeDiff <= 30000 && timeDiff >= -900000) {
          notifiedIdsRef.current.add(id);

          // 1. Send native browser notification
          sendBrowserNotification(`⏰ NOTEX Reminder: ${r.title}`, {
            body: `${r.subject ? `[${r.subject}] ` : ''}${r.description || 'It is time for your scheduled revision!'}`,
            tag: `reminder-${id}`,
            onClickUrl: '/reminders'
          });

          // 2. Also trigger app toast
          toast.info(`⏰ Reminder: ${r.title}${r.subject ? ` (${r.subject})` : ''}`);

          // 3. Mark as notified in backend
          api.updateReminder(id, { notified: true }).catch(() => {});
        }
      });
    };

    checkDueReminders();
    const interval = setInterval(checkDueReminders, 20000);
    return () => clearInterval(interval);
  }, [isAuthenticated, reminders, toast]);

  // Derived stats
  const activeReminders = reminders.filter(r => !r.isCompleted);
  const completedReminders = reminders.filter(r => r.isCompleted);
  const overdueReminders = activeReminders.filter(r => new Date(r.dueDate).getTime() < Date.now());

  return (
    <RemindersContext.Provider
      value={{
        reminders,
        activeReminders,
        completedReminders,
        overdueReminders,
        loading,
        permission,
        fetchReminders,
        createReminder,
        toggleComplete,
        deleteReminder,
        requestPermission: handleRequestPermission
      }}
    >
      {children}
    </RemindersContext.Provider>
  );
};

export const useReminders = () => {
  const context = useContext(RemindersContext);
  if (!context) {
    throw new Error('useReminders must be used within a RemindersProvider');
  }
  return context;
};
