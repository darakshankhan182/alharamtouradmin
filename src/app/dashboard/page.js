'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  FileText, 
  DollarSign, 
  BarChart3,
  TrendingUp,
  Eye,
  RefreshCw
} from 'lucide-react';
import { inquiriesAPI } from '@/utils/api';
import Link from 'next/link';

export default function DashboardPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [stats, setStats] = useState({
    totalInquiries: 0,
    totalUsers: 0,
    totalRevenue: 0,
    conversionRate: 0
  });

  const { user, token, isAuthenticated, loading } = useAuth(); // <-- added loading
  const router = useRouter();

  // -------------------------------
  // FIXED AUTHENTICATION ISSUE HERE
  // -------------------------------
  useEffect(() => {
    if (loading) return; // WAIT for AuthContext to finish checking localStorage

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchInquiries();
  }, [loading, isAuthenticated, token]);
  // -------------------------------

  const fetchInquiries = async () => {
    if (!token) return;
    
    try {
      setLoadingData(true);
      const data = await inquiriesAPI.getAll(token);

      setInquiries(data.inquiries || []);
      setStats({
        totalInquiries: data.count || 0,
        totalUsers: 0,
        totalRevenue: 0,
        conversionRate: 0
      });

    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // -------------------------------
  // WAIT until both auth + data are ready
  // -------------------------------
  if (loading || !isAuthenticated || loadingData) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-primary-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }
  // -------------------------------

  return (
    <LayoutWrapper>
      <div className="space-y-8 ">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard Overview</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Welcome back, <span className="font-medium text-primary-600 dark:text-primary-400">{user?.username || 'Admin'}</span>. Here's your latest updates.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={fetchInquiries}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Inquiries */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                +12%
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Inquiries</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalInquiries}</p>
              <TrendingUp className="h-4 w-4 text-green-500 ml-2" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">From last month</p>
          </div>

          {/* Total Users */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                +8%
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalUsers}</p>
              <TrendingUp className="h-4 w-4 text-blue-500 ml-2" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Active users</p>
          </div>

          {/* Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                +24%
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
              <TrendingUp className="h-4 w-4 text-green-500 ml-2" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">This month</p>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                +5%
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Conversion Rate</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.conversionRate}%</p>
              <TrendingUp className="h-4 w-4 text-purple-500 ml-2" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">From inquiries to bookings</p>
          </div>
        </div>

        {/* Recent Inquiries Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Inquiries</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Latest customer inquiries for tours
                </p>
              </div>
              <a
                href="/inquiries"
                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                View all
              </a>
            </div>
          </div>

          {inquiries.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {inquiries.slice(0, 6).map((inquiry) => (
                <div key={inquiry._id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                              {inquiry.fullName?.charAt(0) || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {inquiry.fullName}
                          </p>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{inquiry.email}</span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{inquiry.phoneNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="hidden md:block ml-6">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                            {inquiry.origin} → {inquiry.destination}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {getTimeAgo(inquiry.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{inquiry.adults}</span> Adults
                          </span>
                          {inquiry.children > 0 && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium">{inquiry.children}</span> Children
                            </span>
                          )}
                          {inquiry.infants > 0 && (
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium">{inquiry.infants}</span> Infants
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      <Link
                        href={`/inquiries/${inquiry._id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        View
                      </Link>
                    </div>
                  </div>

                  {/* Mobile view */}
                  <div className="md:hidden mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                          {inquiry.origin} → {inquiry.destination}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getTimeAgo(inquiry.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {inquiry.adults} Adults
                        </span>
                        {inquiry.children > 0 && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {inquiry.children} Children
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No inquiries yet</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Customer inquiries will appear here once they start submitting tour requests.
              </p>
            </div>
          )}

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {Math.min(inquiries.length, 6)} of {inquiries.length} inquiries
              </div>
              <a
                href="/inquiries"
                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center"
              >
                View all inquiries
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
