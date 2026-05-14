// context/NotificationContext.js
'use client';

import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { notificationsAPI } from '@/utils/api';
import { initWebSocket } from '@/utils/websocket';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext({});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const { token, isAuthenticated, user } = useAuth();
  
  // Refs to prevent duplicate calls
  const lastFetchTime = useRef(0);
  const isFetching = useRef(false);
  const notificationCache = useRef([]);
  const wsCleanupRef = useRef(null);

  // Show toast for new notification
  const showNotificationToast = useCallback((notification) => {
    const notificationType = notification.type || 'info';
    
    // Different toast styles based on notification type
    const toastConfig = {
      duration: 5000,
      position: 'top-right',
    };

    switch (notificationType) {
      case 'success':
        toast.success(
          <div className="flex flex-col">
            <span className="font-semibold">✅ {notification.title}</span>
            <span className="text-sm text-gray-600">{notification.message}</span>
          </div>,
          toastConfig
        );
        break;
        
      case 'warning':
        toast.custom(
          (t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-yellow-50 border-l-4 border-yellow-500 p-4 shadow-lg`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 text-yellow-500">⚠️</div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">{notification.title}</p>
                  <p className="mt-1 text-sm text-yellow-700">{notification.message}</p>
                </div>
              </div>
            </div>
          ),
          toastConfig
        );
        break;
        
      case 'error':
        toast.error(
          <div className="flex flex-col">
            <span className="font-semibold">❌ {notification.title}</span>
            <span className="text-sm">{notification.message}</span>
          </div>,
          toastConfig
        );
        break;
        
      default: // info
        toast.custom(
          (t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-blue-50 border-l-4 border-blue-500 p-4 shadow-lg`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 text-blue-500">🔔</div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">{notification.title}</p>
                  <p className="mt-1 text-sm text-blue-700">{notification.message}</p>
                  {notification.link && (
                    <button
                      onClick={() => {
                        window.location.href = notification.link;
                        toast.dismiss(t.id);
                      }}
                      className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      View Details →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ),
          { ...toastConfig, duration: 6000 }
        );
        break;
    }
  }, []);

  // IMMEDIATELY update UI when new notification arrives (without fetching)
  const immediatelyAddNotification = useCallback((notification) => {
    console.log('⚡ IMMEDIATE: Adding notification to UI:', notification.title);
    
    // Check if notification already exists (prevent duplicates)
    const notificationExists = notifications.some(n => n._id === notification._id);
    
    if (!notificationExists) {
      // Add to beginning of array IMMEDIATELY
      setNotifications(prev => {
        const newNotifications = [notification, ...prev];
        // Keep only latest 20 notifications in state
        return newNotifications.slice(0, 20);
      });
      
      // Update unread count IMMEDIATELY
      if (!notification.read) {
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log(`⚡ IMMEDIATE: Unread count updated from ${prev} to ${newCount}`);
          return newCount;
        });
        
        // Show toast for new unread notifications
        showNotificationToast(notification);
      }
    }
  }, [notifications, showNotificationToast]);

  // Fetch notifications with debouncing and caching
  const fetchNotifications = useCallback(async (force = false) => {
    if (!token || !isAuthenticated) {
      console.log('🔔 Skipping notification fetch: No token or not authenticated');
      return;
    }

    // Prevent multiple simultaneous fetches
    if (isFetching.current && !force) {
      console.log('🔔 Already fetching, skipping...');
      return;
    }

    // Debounce: Don't fetch more than once every 2 seconds
    const now = Date.now();
    if (now - lastFetchTime.current < 2000 && !force) {
      console.log('🔔 Debouncing fetch...');
      return;
    }

    try {
      isFetching.current = true;
      lastFetchTime.current = now;
      
      // Only show loading spinner on initial load or forced refresh
      if (initialLoad || force) {
        setLoading(true);
      }
      
      console.log('🔔 Fetching notifications from API...');
      
      const data = await notificationsAPI.getAll(
        { limit: 10, page: 1, unreadOnly: false },
        token
      );
      
      console.log(`🔔 API Response: Received ${data.notifications?.length || 0} notifications`);
      
      // Cache the notifications
      notificationCache.current = data.notifications || [];
      
      // Update state
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      
      if (initialLoad) {
        setInitialLoad(false);
      }
      
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      
      if (error.message.includes('User ID not found') || error.message.includes('NO_USER_ID')) {
        toast.error('Session expired. Please log in again.');
      } else if (!error.message.includes('timeout')) {
        toast.error('Failed to load notifications');
      }
      
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [token, isAuthenticated, initialLoad]);

  // Add a new notification (normal way)
  const addNotification = useCallback((notification) => {
    console.log('🔔 Adding new notification:', notification.title);
    immediatelyAddNotification(notification);
  }, [immediatelyAddNotification]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      console.log(`📝 Marking notification ${notificationId} as read`);
      
      await notificationsAPI.markAsRead(notificationId, token);
      
      // Update local state IMMEDIATELY
      setNotifications(prev => prev.map(notif => 
        notif._id === notificationId ? { ...notif, read: true } : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      toast.success('Notification marked as read');
      
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      toast.error('Failed to mark as read');
      throw error;
    }
  }, [token]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      console.log('📝 Marking all notifications as read');
      
      const data = await notificationsAPI.markAllAsRead(token);
      
      // Update local state IMMEDIATELY
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
      
      return data;
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      toast.error('Failed to mark all as read');
      throw error;
    }
  }, [token]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      console.log(`🗑️ Deleting notification ${notificationId}`);
      
      await notificationsAPI.delete(notificationId, token);
      
      // Update local state IMMEDIATELY
      const deletedNotification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Notification deleted');
      
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      toast.error('Failed to delete notification');
      throw error;
    }
  }, [token, notifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      console.log('🗑️ Clearing all notifications');
      
      await notificationsAPI.clearAll(token);
      setNotifications([]);
      setUnreadCount(0);
      
      toast.success('All notifications cleared');
      
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
      throw error;
    }
  }, [token]);

  // Handle WebSocket connection and real-time updates
  useEffect(() => {
    if (!token || !isAuthenticated) {
      console.log('🔌 WebSocket: Skipping - No token or not authenticated');
      return;
    }

    console.log('🔌 Initializing WebSocket connection for real-time updates...');
    
    // Initialize WebSocket
    wsCleanupRef.current = initWebSocket(token);
    
    // Handle real-time notifications from WebSocket - IMMEDIATE UI UPDATE
    const handleImmediateNotificationUpdate = (event) => {
      console.log('⚡ IMMEDIATE: WebSocket notification update received');
      const { notification, action } = event.detail;
      
      if (action === 'ADD' && notification) {
        // Update UI IMMEDIATELY without fetching
        immediatelyAddNotification(notification);
      }
    };

    // Handle WebSocket notification events
    const handleWebSocketNotification = (event) => {
      console.log('🔔 WebSocket notification received');
      const { data } = event.detail;
      
      if (data) {
        // Update UI IMMEDIATELY
        immediatelyAddNotification(data);
        
        // Also refresh the full list after 2 seconds (background sync)
        setTimeout(() => {
          fetchNotifications(true);
        }, 2000);
      }
    };

    // Handle new inquiry creation events
    const handleNewInquiry = (event) => {
      console.log('📝 New inquiry created via WebSocket');
      const { data } = event.detail;
      
      if (data) {
        // Show toast for new inquiry
        toast.custom(
          (t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-green-50 border-l-4 border-green-500 p-4 shadow-lg`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 text-green-500">✈️</div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">New Travel Inquiry</p>
                  <p className="mt-1 text-sm text-green-700">
                    {data.customerName} from {data.origin} to {data.destination}
                  </p>
                  <button
                    onClick={() => {
                      window.location.href = `/inquiries/${data.inquiryId}`;
                      toast.dismiss(t.id);
                    }}
                    className="mt-2 text-sm font-medium text-green-600 hover:text-green-500"
                  >
                    View Inquiry →
                  </button>
                </div>
              </div>
            </div>
          ),
          { duration: 6000, position: 'top-right' }
        );
      }
    };

    // Handle WebSocket connection status
    const handleWebSocketConnected = () => {
      console.log('✅ WebSocket connected');
      setWebsocketConnected(true);
    };

    const handleWebSocketDisconnected = () => {
      console.log('❌ WebSocket disconnected');
      setWebsocketConnected(false);
    };

    // Listen for WebSocket events
    window.addEventListener('immediate-notification-update', handleImmediateNotificationUpdate);
    window.addEventListener('websocket-notification', handleWebSocketNotification);
    window.addEventListener('websocket-new-inquiry', handleNewInquiry);
    window.addEventListener('websocket-connected', handleWebSocketConnected);
    window.addEventListener('websocket-disconnected', handleWebSocketDisconnected);

    // Initial fetch
    fetchNotifications();

    // Auto-refresh every 30 seconds (fallback polling)
    const pollInterval = setInterval(() => {
      if (!isFetching.current) {
        fetchNotifications();
      }
    }, 30000);

    return () => {
      console.log('🔌 Cleaning up WebSocket and intervals');
      window.removeEventListener('immediate-notification-update', handleImmediateNotificationUpdate);
      window.removeEventListener('websocket-notification', handleWebSocketNotification);
      window.removeEventListener('websocket-new-inquiry', handleNewInquiry);
      window.removeEventListener('websocket-connected', handleWebSocketConnected);
      window.removeEventListener('websocket-disconnected', handleWebSocketDisconnected);
      
      if (wsCleanupRef.current) {
        wsCleanupRef.current();
      }
      
      clearInterval(pollInterval);
    };
  }, [token, isAuthenticated, fetchNotifications, immediatelyAddNotification]);

  // Manual refresh function with debouncing
  const refreshNotifications = useCallback((force = false) => {
    fetchNotifications(force);
  }, [fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    initialLoad,
    websocketConnected,
    fetchNotifications: refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification: immediatelyAddNotification, // Use immediate version
    showNotificationToast,
    // Expose immediate function for external use
    immediatelyAddNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};