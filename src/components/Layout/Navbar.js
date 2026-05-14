// components/Navbar.js
'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { 
  Menu as MenuIcon, 
  X, 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Trash2,
  UserCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import UserPrfile from "../../images/man.png";
import { toast } from 'react-hot-toast';

export const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    immediatelyAddNotification // Use the immediate function
  } = useNotification();
  
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const dropdownRef = useRef(null);
  const lastOpenTime = useRef(0);
  const previousUnreadCount = useRef(0);

  // Watch for unread count changes to trigger badge animation
  useEffect(() => {
    if (unreadCount > previousUnreadCount.current) {
      console.log(`🎯 Unread count increased from ${previousUnreadCount.current} to ${unreadCount}`);
      // Trigger badge pulse animation
      setBadgePulse(true);
      
      // Remove pulse after animation
      setTimeout(() => {
        setBadgePulse(false);
      }, 2000);
    }
    
    previousUnreadCount.current = unreadCount;
  }, [unreadCount]);

  // Listen for immediate notification updates (for real-time badge updates)
  useEffect(() => {
    const handleImmediateNotification = (event) => {
      console.log('🎯 Navbar: Received immediate notification update');
      // The notification count will be updated automatically via context
      // We just need to trigger a badge pulse
      if (event.detail?.action === 'ADD') {
        setBadgePulse(true);
        setTimeout(() => setBadgePulse(false), 2000);
      }
    };

    window.addEventListener('immediate-notification-update', handleImmediateNotification);
    
    return () => {
      window.removeEventListener('immediate-notification-update', handleImmediateNotification);
    };
  }, []);

  // Handle dropdown open/close
  const handleDropdownToggle = (open) => {
    const now = Date.now();
    
    // Prevent rapid toggling (debounce)
    if (now - lastOpenTime.current < 300) {
      return;
    }
    
    lastOpenTime.current = now;
    setNotificationMenuOpen(open);
    
    if (open && !loading) {
      console.log('🔄 Fetching notifications on dropdown open');
      setRefreshing(true);
      
      // Use setTimeout to prevent blocking UI
      setTimeout(() => {
        fetchNotifications(true); // Force refresh
        setRefreshing(false);
      }, 100);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to handle mark as read
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await markAsRead(notificationId);
    } catch (error) {
      // Error is already handled in the context
    }
  };

  // Function to handle delete
  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      // Error is already handled in the context
    }
  };

  // Function to mark all as read
  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await markAllAsRead();
    } catch (error) {
      // Error is already handled in the context
    }
  };

  // Function to handle notification click
  const handleNotificationClick = async (notification, e) => {
    e.stopPropagation();
    
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    
    // Navigate if link exists
    if (notification.link) {
      window.location.href = notification.link;
    }
    
    // Close dropdown
    setNotificationMenuOpen(false);
  };

  // Manual refresh function
  const handleRefresh = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      setRefreshing(true);
      await fetchNotifications(true); // Force refresh
      toast.success('Notifications refreshed');
    } catch (error) {
      toast.error('Failed to refresh notifications');
    } finally {
      setRefreshing(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '🟢';
      case 'warning':
        return '🟡';
      case 'error':
        return '🔴';
      default:
        return '🔵';
    }
  };

  // Loading skeleton component
  const NotificationSkeleton = () => (
    <div className="px-4 py-3 animate-pulse">
      <div className="flex items-start space-x-3">
        <div className="h-2 w-2 rounded-full bg-gray-200 mt-1"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-2 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );

  return (
    <nav className="fixed top-0 right-0 left-0 z-40 bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Toggle button and title */}
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              {sidebarOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <MenuIcon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
            
            <div className="hidden md:block ml-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Dashboard
              </h1>
            </div>
          </div>

          {/* Right side - Notifications and User menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                className="relative p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 group"
                onClick={() => handleDropdownToggle(!notificationMenuOpen)}
                aria-label="Notifications"
              >
                {unreadCount > 0 ? (
                  <BellRing className="h-6 w-6 text-primary-600 group-hover:scale-110 transition-transform" />
                ) : (
                  <Bell className="h-6 w-6 group-hover:scale-110 transition-transform" />
                )}
                
                {/* Notification badge with pulse animation */}
                {unreadCount > 0 && (
                  <span className={`absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full ${
                    badgePulse ? 'animate-ping' : ''
                  }`}>
                    <span className={`absolute h-full w-full rounded-full bg-red-500 ${
                      badgePulse ? 'animate-ping' : ''
                    }`}></span>
                    <span className="relative z-10">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
                )}
              </button>
              
              {/* Dropdown Panel */}
              {notificationMenuOpen && (
                <div className="absolute right-0 mt-2 w-96 origin-top-right rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={handleRefresh}
                          disabled={refreshing || loading}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Refresh notifications"
                        >
                          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        {notifications.some(n => !n.read) && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-primary-600 hover:text-primary-800 flex items-center space-x-1 transition-colors"
                          >
                            <CheckCheck className="h-4 w-4" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="flex-1 overflow-y-auto">
                    {loading && refreshing ? (
                      // Show skeletons only during initial load/refresh
                      <div className="divide-y divide-gray-100">
                        {[1, 2, 3].map((i) => (
                          <NotificationSkeleton key={i} />
                        ))}
                      </div>
                    ) : notifications.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                              !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                            onClick={(e) => handleNotificationClick(notification, e)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 text-sm">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <p className={`text-sm font-medium ${
                                    !notification.read ? 'text-gray-900' : 'text-gray-700'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <div className="flex items-center space-x-1 ml-2">
                                    {!notification.read && (
                                      <button
                                        onClick={(e) => handleMarkAsRead(notification._id, e)}
                                        className="p-1 text-primary-600 hover:text-primary-800"
                                        title="Mark as read"
                                      >
                                        <Check className="h-3 w-3" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => handleDelete(notification._id, e)}
                                      className="p-1 text-red-600 hover:text-red-800"
                                      title="Delete notification"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                                <p className="mt-1 text-sm text-gray-600">
                                  {notification.message}
                                </p>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-xs text-gray-400">
                                    {formatDate(notification.createdAt)}
                                  </span>
                                  {notification.link && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.location.href = notification.link;
                                      }}
                                      className="text-xs text-primary-600 hover:text-primary-800 flex items-center space-x-1"
                                      title="Open link"
                                    >
                                      <span>View</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No notifications yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                          You're all caught up!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-4 border-t border-gray-100 flex-shrink-0">
                      <button
                        onClick={() => {
                          window.location.href = '/notifications';
                          setNotificationMenuOpen(false);
                        }}
                        className="w-full text-center text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <Menu as="div" className="relative">
              <div>
                <Menu.Button className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                  <div className="flex items-center space-x-3">
                    <div className="hidden md:flex flex-col items-end">
                      <span className="text-sm font-medium text-gray-700">
                        {user?.username || 'User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {user?.email}
                      </span>
                    </div>
                    <div className="relative">
                      <Image 
                        src={UserPrfile} 
                        alt='User Profile' 
                        width={40} 
                        height={40}
                        className="rounded-full"
                      />
                    </div>
                  </div>
                </Menu.Button>
              </div>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="/profile"
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } block px-4 py-2 text-sm text-gray-700 flex items-center space-x-2`}
                      >
                        <UserCircle className="h-4 w-4" />
                        <span>Your Profile</span>
                      </a>
                    )}
                  </Menu.Item>
                  <div className="border-t border-gray-100">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={logout}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
};