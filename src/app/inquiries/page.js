// app/inquiries/page.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/Button';
import { useAuth } from '@/context/AuthContext';
import { inquiriesAPI } from '@/utils/api';
import {
  Eye,
  Trash2,
  Table,
  LayoutGrid,
  RefreshCw,
  Download,
  Search,
  MoreVertical,
  User,
  Mail,
  Phone,
  Calendar,
  Users,
  ChevronRight,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  Check,
  XCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Plus,
  Globe,
  Edit,
  Search as SearchIcon,
  PhoneCall,
  Mail as MailIcon,
  Users as UsersRef,
  Building,
  Tag,
  Filter,
  BarChart3,
  MessageSquare,
  MapPin,
  Loader2,
  ArrowUpDown,
  CalendarDays,
  X,
  UserCheck,
  UserX,
  Shield,
  Menu,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedItem, setCopiedItem] = useState({ type: null, id: null });
  const { user, token, isAuthenticated, loading } = useAuth();
  
  // Tabs state with individual search terms
  const [activeTab, setActiveTab] = useState('all');
  const [tabSearchTerms, setTabSearchTerms] = useState({
    all: '',
    website: '',
    manual: '',
    assigned: ''
  });
  
  // Date filter states
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Sorting state
  const [sortBy, setSortBy] = useState('newest');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Mobile menu state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (token) {
      fetchInquiries();
    }
  }, [loading, isAuthenticated, token, router]);

  const fetchInquiries = async () => {
    if (!token) {
      console.error('❌ No token available for API call');
      toast.error('Authentication token missing. Please login again.');
      return;
    }
    
    try {
      setLoadingPage(true);
      const data = await inquiriesAPI.getAll(token);
      
      // Filter inquiries based on user role and assignment
      let filteredInquiries = data.inquiries || [];
      
      if (user?.role !== 'admin') {
        // Regular users only see inquiries assigned to them or unassigned inquiries
        filteredInquiries = filteredInquiries.filter(inquiry => 
          !inquiry.assignedTo || 
          inquiry.assignedTo._id === user?._id || 
          inquiry.assignedTo === user?._id
        );
      }
      
      setInquiries(filteredInquiries);
      setCurrentPage(1);
    } catch (error) {
      console.error('❌ Error fetching inquiries:', error);
      toast.error(error.message || 'Failed to fetch inquiries');
    } finally {
      setLoadingPage(false);
    }
  };

  // Handle assignment when viewing inquiry details
  const handleAssignInquiry = async (inquiryId) => {
    if (!token) {
      toast.error('Authentication required. Please login again.');
      return;
    }
    
    try {
      const response = await inquiriesAPI.assign(inquiryId, user._id, token);
      if (response.success) {
        // Update local state
        setInquiries(prevInquiries =>
          prevInquiries.map(inquiry =>
            inquiry._id === inquiryId
              ? { ...inquiry, assignedTo: user }
              : inquiry
          )
        );
        
        // Update selected inquiry if it's the same one
        if (selectedInquiry && selectedInquiry._id === inquiryId) {
          setSelectedInquiry(prev => ({ ...prev, assignedTo: user }));
        }
        
        toast.success('Inquiry assigned to you');
      }
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error(error.message || 'Failed to assign inquiry');
    }
  };

  // Handle unassignment (admin only)
  const handleUnassignInquiry = async (inquiryId) => {
    if (!token || user?.role !== 'admin') {
      toast.error('Only administrators can unassign inquiries.');
      return;
    }
    
    try {
      const response = await inquiriesAPI.unassign(inquiryId, token);
      if (response.success) {
        // Update local state
        setInquiries(prevInquiries =>
          prevInquiries.map(inquiry =>
            inquiry._id === inquiryId
              ? { ...inquiry, assignedTo: null }
              : inquiry
          )
        );
        
        // Update selected inquiry if it's the same one
        if (selectedInquiry && selectedInquiry._id === inquiryId) {
          setSelectedInquiry(prev => ({ ...prev, assignedTo: null }));
        }
        
        toast.success('Inquiry unassigned successfully');
      }
    } catch (error) {
      console.error('Unassignment error:', error);
      toast.error(error.message || 'Failed to unassign inquiry');
    }
  };

  const handleCopy = (text, type, id) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedItem({ type, id });
        toast.success(`${type === 'email' ? 'Email' : 'Phone number'} copied!`);
        setTimeout(() => setCopiedItem({ type: null, id: null }), 2000);
      })
      .catch(() => {
        toast.error('Failed to copy to clipboard');
      });
  };

  const handleDelete = async (inquiryId) => {
    if (!token) {
      toast.error('Authentication required. Please login again.');
      return;
    }
    
    try {
      await inquiriesAPI.delete(inquiryId, token);
      toast.success('Inquiry deleted successfully');
      fetchInquiries();
    } catch (error) {
      console.error('Delete error:', error);
      
      if (error.message.includes('Access denied') || error.message.includes('Only administrators')) {
        toast.error('Access denied. Only administrators can delete inquiries.');
      } else if (error.message.includes('Not authorized')) {
        toast.error('You are not authorized. Please login again.');
      } else {
        toast.error(error.message || 'Failed to delete inquiry');
      }
    }
  };

  const handleViewDetails = async (inquiry) => {
    setSelectedInquiry(inquiry);
    setIsModalOpen(true);
    
    // Auto-assign the inquiry to the current user when viewing details
    if (!inquiry.assignedTo && user?._id && user?.role !== 'admin') {
      await handleAssignInquiry(inquiry._id);
    }
  };

  const handleNavigateToDetails = async (inquiryId) => {
    // Auto-assign the inquiry to the current user when navigating to details
    if (user?._id && user?.role !== 'admin') {
      const inquiry = inquiries.find(i => i._id === inquiryId);
      if (inquiry && !inquiry.assignedTo) {
        await handleAssignInquiry(inquiryId);
      }
    }
    router.push(`/inquiries/${inquiryId}`);
  };

  // Handle date filter change
  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    setCurrentPage(1);
    
    if (filter !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  // Handle sort change
  const handleSortChange = (sortType) => {
    setSortBy(sortType);
    setCurrentPage(1);
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get date range for filtering
  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (dateFilter) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        };
      case 'yesterday': {
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: yesterday,
          end: today
        };
      }
      case 'week': {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          start: weekAgo,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        };
      }
      case 'month': {
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        return {
          start: monthAgo,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        };
      }
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: new Date(customStartDate),
            end: new Date(new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000)
          };
        }
        break;
    }
    return null;
  };

  // Format date for display
  const formatDate = (dateString, useInquiryDate = true) => {
    if (!dateString) return 'N/A';
    
    if (useInquiryDate && typeof dateString === 'object') {
      if (dateString.inquiryDate) {
        return new Date(dateString.inquiryDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      return new Date(dateString.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Memoized calculations for performance
  const assignedInquiries = useMemo(() => {
    return inquiries.filter(inquiry => 
      inquiry.assignedTo && (
        inquiry.assignedTo._id === user?._id || 
        inquiry.assignedTo === user?._id
      )
    );
  }, [inquiries, user]);

  const websiteInquiries = useMemo(() => {
    return inquiries.filter(i => !i.isManual);
  }, [inquiries]);

  const manualInquiries = useMemo(() => {
    return inquiries.filter(i => i.isManual);
  }, [inquiries]);

  // Calculate statistics based on active tab
  const calculateStats = useMemo(() => {
    let tabInquiries = [];
    
    switch (activeTab) {
      case 'all':
        tabInquiries = inquiries;
        break;
      case 'website':
        tabInquiries = websiteInquiries;
        break;
      case 'manual':
        tabInquiries = manualInquiries;
        break;
      case 'assigned':
        tabInquiries = assignedInquiries;
        break;
      default:
        tabInquiries = inquiries;
    }

    const today = new Date().toDateString();
    const todayInquiries = tabInquiries.filter(i => 
      new Date(i.createdAt).toDateString() === today
    );
    
    const newInquiries = tabInquiries.filter(i => i.status === 'new').length;
    const contactedInquiries = tabInquiries.filter(i => i.status === 'contacted').length;
    const followupInquiries = tabInquiries.filter(i => i.status === 'followup').length;
    const convertedInquiries = tabInquiries.filter(i => i.status === 'converted').length;
    const rejectedInquiries = tabInquiries.filter(i => i.status === 'rejected').length;
    
    // For "assigned" tab, show assignments breakdown
    const assignedToMeCount = assignedInquiries.length;
    
    return {
      total: tabInquiries.length,
      newToday: todayInquiries.length,
      new: newInquiries,
      contacted: contactedInquiries,
      followup: followupInquiries,
      converted: convertedInquiries,
      rejected: rejectedInquiries,
      pending: newInquiries + contactedInquiries + followupInquiries,
      assignedToMe: assignedToMeCount
    };
  }, [activeTab, inquiries, websiteInquiries, manualInquiries, assignedInquiries]);

  // Calculate statistics for the stats cards (showing all inquiries stats)
  const calculateGlobalStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayInquiries = inquiries.filter(i => 
      new Date(i.createdAt).toDateString() === today
    );
    
    const newInquiries = inquiries.filter(i => i.status === 'new').length;
    const contactedInquiries = inquiries.filter(i => i.status === 'contacted').length;
    const followupInquiries = inquiries.filter(i => i.status === 'followup').length;
    const convertedInquiries = inquiries.filter(i => i.status === 'converted').length;
    
    return {
      total: inquiries.length,
      newToday: todayInquiries.length,
      pending: newInquiries + contactedInquiries + followupInquiries,
      followup: followupInquiries,
      converted: convertedInquiries,
      assignedToMe: assignedInquiries.length,
      // Additional stats for the assigned tab
      assignedNew: assignedInquiries.filter(i => i.status === 'new').length,
      assignedContacted: assignedInquiries.filter(i => i.status === 'contacted').length,
      assignedFollowup: assignedInquiries.filter(i => i.status === 'followup').length,
      assignedConverted: assignedInquiries.filter(i => i.status === 'converted').length
    };
  }, [inquiries, assignedInquiries]);

  // Get current tab search term
  const getCurrentSearchTerm = () => tabSearchTerms[activeTab];

  // Handle search input change for current tab
  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setTabSearchTerms(prev => ({
      ...prev,
      [activeTab]: newValue
    }));
    setCurrentPage(1);
  };

  // Clear search for current tab
  const clearSearch = () => {
    setTabSearchTerms(prev => ({
      ...prev,
      [activeTab]: ''
    }));
    setCurrentPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter('all');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('newest');
    setTabSearchTerms({
      all: '',
      website: '',
      manual: '',
      assigned: ''
    });
    setCurrentPage(1);
    setShowMobileFilters(false);
  };

  // Filter inquiries based on tab, search, status, and date
  const filteredInquiries = useMemo(() => {
    return inquiries.filter(inquiry => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === 'website') {
        matchesTab = !inquiry.isManual;
      } else if (activeTab === 'manual') {
        matchesTab = inquiry.isManual;
      } else if (activeTab === 'assigned') {
        matchesTab = inquiry.assignedTo && (
          inquiry.assignedTo._id === user?._id || 
          inquiry.assignedTo === user?._id
        );
      }
      
      // Search filter for current tab
      const searchTerm = getCurrentSearchTerm();
      const matchesSearch = 
        !searchTerm ||
        inquiry.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.sourceDetails?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inquiry.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inquiry.assignedTo?.email?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const dateRange = getDateRange();
        if (dateRange) {
          const inquiryDate = new Date(inquiry.createdAt);
          matchesDate = inquiryDate >= dateRange.start && inquiryDate < dateRange.end;
        }
      }
      
      return matchesTab && matchesSearch && matchesStatus && matchesDate;
    });
  }, [inquiries, activeTab, statusFilter, dateFilter, customStartDate, customEndDate, tabSearchTerms, user]);

  // Sort filtered inquiries
  const sortedInquiries = useMemo(() => {
    return [...filteredInquiries].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      
      switch (sortBy) {
        case 'newest':
          return dateB - dateA;
        case 'oldest':
          return dateA - dateB;
        case 'name-asc':
          return a.fullName.localeCompare(b.fullName);
        case 'name-desc':
          return b.fullName.localeCompare(a.fullName);
        case 'assigned':
          if (a.assignedTo && !b.assignedTo) return -1;
          if (!a.assignedTo && b.assignedTo) return 1;
          return dateB - dateA;
        default:
          return dateB - dateA;
      }
    });
  }, [filteredInquiries, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(sortedInquiries.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInquiries = sortedInquiries.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const getStatusBadge = (status) => {
    const statuses = {
      'new': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock, label: 'New' },
      'contacted': { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertCircle, label: 'Contacted' },
      'followup': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: TrendingUp, label: 'Follow-up' },
      'converted': { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle, label: 'Converted' },
      'rejected': { color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400', icon: XCircle, label: 'Rejected' }
    };
    return statuses[status] || statuses['new'];
  };

  const getSourceBadge = (source, sourceDetails = '') => {
    const sources = {
      'website': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Globe, label: 'Website' },
      'google ads': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: SearchIcon, label: 'Google Ads' },
      'phone': { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: PhoneCall, label: 'Phone' },
      'email': { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: MailIcon, label: 'Email' },
      'reference': { color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400', icon: UsersRef, label: 'Reference' },
      'other': { color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400', icon: Building, label: sourceDetails || 'Other' }
    };
    return sources[source] || sources['website'];
  };

  // Get assignment badge
  const getAssignmentBadge = (inquiry) => {
    if (!inquiry.assignedTo) {
      return { 
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', 
        icon: UserX, 
        label: 'Unassigned' 
      };
    }
    
    const isAssignedToMe = inquiry.assignedTo._id === user?._id || inquiry.assignedTo === user?._id;
    
    if (isAssignedToMe) {
      return { 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', 
        icon: UserCheck, 
        label: 'Assigned to me' 
      };
    } else {
      return { 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', 
        icon: User, 
        label: `Assigned to ${inquiry.assignedTo.username || inquiry.assignedTo.email || 'another user'}` 
      };
    }
  };

  const stats = calculateStats;
  const globalStats = calculateGlobalStats;

  if (loading || (isAuthenticated && !token)) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              {loading ? 'Checking authentication...' : 'Loading inquiries...'}
            </p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Inquiries Management</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage all customer inquiries with real-time statistics
            </p>
            {user?.role === 'admin' && (
              <div className="mt-1 flex items-center text-sm text-primary-600 dark:text-primary-400">
                <Shield className="h-4 w-4 mr-2" />
                Administrator view - You can see all inquiries and assignments
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex gap-2">
              {/* View Toggle */}
              <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Table View"
                >
                  <Table className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'card'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-600'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => {
                    const csvData = sortedInquiries.map(inquiry => [
                      `"${inquiry.fullName}"`,
                      `"${inquiry.email}"`,
                      `"${inquiry.phoneNumber}"`,
                      `"${inquiry.origin}"`,
                      `"${inquiry.destination}"`,
                      inquiry.adults,
                      inquiry.children,
                      inquiry.infants,
                      inquiry.status || 'new',
                      `"${formatDate(inquiry.createdAt)}"`,
                      `"${inquiry.message?.replace(/"/g, '""') || ''}"`,
                      inquiry.source || 'website',
                      `"${inquiry.sourceDetails?.replace(/"/g, '""') || ''}"`,
                      inquiry.isManual ? 'Yes' : 'No',
                      inquiry.assignedTo ? `"${inquiry.assignedTo.name || inquiry.assignedTo.email || 'Assigned'}"` : 'Unassigned'
                    ].join(','));
                    
                    const headers = ['Name', 'Email', 'Phone', 'Origin', 'Destination', 'Adults', 'Children', 'Infants', 'Status', 'Submission Date', 'Message', 'Source', 'Source Details', 'Manual', 'Assigned To'];
                    const csvContent = [headers.join(','), ...csvData].join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    
                    link.setAttribute('href', url);
                    link.setAttribute('download', `inquiries_${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    toast.success('CSV exported successfully');
                  }} 
                  variant="outline" 
                  size="sm"
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  title="Export CSV"
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button 
                  onClick={fetchInquiries}
                  size="sm"
                  disabled={loadingPage}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
                  title="Refresh Data"
                >
                  {loadingPage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                
                <Link href="/add-new-inquiry">
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Inquiry</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filters Toggle */}
        <div className="lg:hidden">
          <Button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            variant="outline"
            className="w-full justify-between border-gray-300 dark:border-gray-600"
          >
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters & Search
            </div>
            {showMobileFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Tabs with Integrated Search - Responsive Layout */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1 ${!showMobileFilters && 'lg:block hidden'}`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-2">
            {/* Tabs Navigation - Scrollable on mobile */}
            <div className="overflow-x-auto pb-2 -mx-2 px-2">
              <nav className="flex space-x-1 min-w-max" aria-label="Tabs">
                <button
                  onClick={() => {
                    setActiveTab('all');
                    setCurrentPage(1);
                  }}
                  className={`relative py-2.5 px-3 sm:px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === 'all'
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">All</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium min-w-[2rem] justify-center ${
                      activeTab === 'all' 
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {globalStats.total}
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('website');
                    setCurrentPage(1);
                  }}
                  className={`relative py-2.5 px-3 sm:px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === 'website'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">Website</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium min-w-[2rem] justify-center ${
                      activeTab === 'website' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {websiteInquiries.length}
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('manual');
                    setCurrentPage(1);
                  }}
                  className={`relative py-2.5 px-3 sm:px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === 'manual'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">Manual</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium min-w-[2rem] justify-center ${
                      activeTab === 'manual' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {manualInquiries.length}
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('assigned');
                    setCurrentPage(1);
                  }}
                  className={`relative py-2.5 px-3 sm:px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === 'assigned'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">My Inquiries</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium min-w-[2rem] justify-center ${
                      activeTab === 'assigned' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {globalStats.assignedToMe}
                    </span>
                  </div>
                </button>
              </nav>
            </div>
            
            {/* Tab-specific Search Bar and Filters - Stacked on mobile */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full lg:min-w-[280px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab} inquiries...`}
                  value={getCurrentSearchTerm()}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                />
                {getCurrentSearchTerm() && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Status Filter Dropdown */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none w-full sm:w-auto pl-10 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="followup">Follow-up</option>
                  <option value="converted">Converted</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className="w-2 h-2 border-b-2 border-r-2 border-gray-400 rotate-45"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Filters Content */}
          <div className={`lg:hidden ${showMobileFilters ? 'block' : 'hidden'} mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 px-2`}>
            {/* Date Filter */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Date Filter
                </label>
                <button
                  onClick={() => {
                    setDateFilter('all');
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setCurrentPage(1);
                  }}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'today', label: 'Today' },
                  { value: 'yesterday', label: 'Yesterday' },
                  { value: 'week', label: '7 Days' },
                  { value: 'month', label: '30 Days' },
                  { value: 'custom', label: 'Custom' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDateFilterChange(option.value)}
                    className={`px-3 py-2 text-xs rounded-lg transition-all ${
                      dateFilter === option.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              {/* Custom Date Range Inputs */}
              {dateFilter === 'custom' && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => {
                          setCustomStartDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        max={customEndDate || getTodayDate()}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => {
                          setCustomEndDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        min={customStartDate}
                        max={getTodayDate()}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sorting Options */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort By
                </label>
                <button
                  onClick={() => handleSortChange('newest')}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  Reset
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'newest', label: 'Newest' },
                  { value: 'oldest', label: 'Oldest' },
                  { value: 'name-asc', label: 'Name A-Z' },
                  { value: 'name-desc', label: 'Name Z-A' },
                  { value: 'assigned', label: 'Assigned' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`px-3 py-2 text-xs rounded-lg transition-all ${
                      sortBy === option.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Summary */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {sortedInquiries.length} inquiries match your criteria
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {dateFilter === 'all' ? 'All Time' : 
                   dateFilter === 'today' ? 'Today' :
                   dateFilter === 'yesterday' ? 'Yesterday' :
                   dateFilter === 'week' ? 'Last 7 Days' :
                   dateFilter === 'month' ? 'Last 30 Days' :
                   customStartDate && customEndDate ? 
                   `${formatDate(customStartDate)} - ${formatDate(customEndDate)}` : 
                   'Select Date Range'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Filters Section */}
        <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <CalendarDays className="h-4 w-4 mr-2" />
                Date Filter
              </label>
              <button
                onClick={() => {
                  setDateFilter('all');
                  setCustomStartDate('');
                  setCustomEndDate('');
                  setCurrentPage(1);
                }}
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'yesterday', label: 'Yesterday' },
                { value: 'week', label: 'Last 7 Days' },
                { value: 'month', label: 'Last 30 Days' },
                { value: 'custom', label: 'Custom Range' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDateFilterChange(option.value)}
                  className={`px-3 py-2 text-xs rounded-lg transition-all ${
                    dateFilter === option.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {/* Custom Date Range Inputs */}
            {dateFilter === 'custom' && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      max={customEndDate || getTodayDate()}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={customStartDate}
                      max={getTodayDate()}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sorting Options */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Sort By
              </label>
              <button
                onClick={() => handleSortChange('newest')}
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'name-asc', label: 'Name A-Z' },
                { value: 'name-desc', label: 'Name Z-A' },
                { value: 'assigned', label: 'Assigned First' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`px-3 py-2 text-xs rounded-lg transition-all ${
                    sortBy === option.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Filtered Results
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {sortedInquiries.length} inquiries match your criteria
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Date Range
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {dateFilter === 'all' ? 'All Time' : 
                   dateFilter === 'today' ? 'Today' :
                   dateFilter === 'yesterday' ? 'Yesterday' :
                   dateFilter === 'week' ? 'Last 7 Days' :
                   dateFilter === 'month' ? 'Last 30 Days' :
                   customStartDate && customEndDate ? 
                   `${formatDate(customStartDate)} - ${formatDate(customEndDate)}` : 
                   'Select Date Range'}
                </div>
              </div>
            </div>
            
            {/* Active Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Status: {statusFilter}
                </span>
              )}
              {getCurrentSearchTerm() && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  Search: "{getCurrentSearchTerm()}"
                </span>
              )}
              {activeTab !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Type: {activeTab === 'website' ? 'Website' : activeTab === 'manual' ? 'Manual' : 'My Inquiries'}
                </span>
              )}
              {sortBy !== 'newest' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                  Sorted: {
                    sortBy === 'oldest' ? 'Oldest First' :
                    sortBy === 'name-asc' ? 'Name A-Z' :
                    sortBy === 'name-desc' ? 'Name Z-A' :
                    'Assigned First'
                  }
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Clear All Filters Button */}
        {(statusFilter !== 'all' || dateFilter !== 'all' || getCurrentSearchTerm() || activeTab !== 'all' || sortBy !== 'newest') && (
          <div className="flex justify-end">
            <Button
              onClick={clearAllFilters}
              variant="outline"
              size="sm"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Stats Overview - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {activeTab === 'assigned' ? (
            // Special stats for "My Inquiries" tab
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm sm:hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total Assigned</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{globalStats.assignedToMe}</p>
                  </div>
                  <div className={`p-1.5 sm:p-2.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex-shrink-0`}>
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white`}>
                      <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm sm:hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">New</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{globalStats.assignedNew}</p>
                  </div>
                  <div className={`p-1.5 sm:p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex-shrink-0`}>
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white`}>
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm sm:hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Contacted</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{globalStats.assignedContacted}</p>
                  </div>
                  <div className={`p-1.5 sm:p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex-shrink-0`}>
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white`}>
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm sm:hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Follow-up</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{globalStats.assignedFollowup}</p>
                  </div>
                  <div className={`p-1.5 sm:p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex-shrink-0`}>
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white`}>
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm sm:hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Converted</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{globalStats.assignedConverted}</p>
                  </div>
                  <div className={`p-1.5 sm:p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex-shrink-0`}>
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white`}>
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm sm:hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Pending</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {globalStats.assignedNew + globalStats.assignedContacted + globalStats.assignedFollowup}
                    </p>
                  </div>
                  <div className={`p-1.5 sm:p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex-shrink-0`}>
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 text-white`}>
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Regular stats for other tabs
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm sm:hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Total</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{globalStats.total}</p>
                  </div>
                  <div className={`p-1.5 sm:p-2.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex-shrink-0`}>
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white`}>
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm sm:hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">My Inquiries</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{globalStats.assignedToMe}</p>
                  </div>
                  <div className={`p-1.5 sm:p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 flex-shrink-0`}>
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white`}>
                      <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm sm:hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">New Today</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{globalStats.newToday}</p>
                  </div>
                  <div className={`p-1.5 sm:p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex-shrink-0`}>
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white`}>
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm sm:hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Pending</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{globalStats.pending}</p>
                  </div>
                  <div className={`p-1.5 sm:p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex-shrink-0`}>
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white`}>
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm sm:hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Follow-up</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{globalStats.followup}</p>
                  </div>
                  <div className={`p-1.5 sm:p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex-shrink-0`}>
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white`}>
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm sm:hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">Converted</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{globalStats.converted}</p>
                  </div>
                  <div className={`p-1.5 sm:p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex-shrink-0`}>
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white`}>
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {getCurrentSearchTerm() ? (
              <span>
                Found <span className="font-semibold text-primary-600 dark:text-primary-400">{sortedInquiries.length}</span> results for "<span className="font-medium text-gray-900 dark:text-white">{getCurrentSearchTerm()}</span>"
                {statusFilter !== 'all' && (
                  <span className="ml-2">
                    (filtered by: <span className="font-medium text-gray-900 dark:text-white">{statusFilter}</span>)
                  </span>
                )}
              </span>
            ) : (
              <span>
                Showing <span className="font-semibold text-primary-600 dark:text-primary-400">{sortedInquiries.length}</span> {activeTab === 'all' ? '' : activeTab} inquiries
                {statusFilter !== 'all' && (
                  <span className="ml-2">
                    (filtered by: <span className="font-medium text-gray-900 dark:text-white">{statusFilter}</span>)
                  </span>
                )}
              </span>
            )}
          </div>
          
          {getCurrentSearchTerm() && (
            <Button
              onClick={clearSearch}
              variant="outline"
              size="sm"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 sm:self-center"
            >
              Clear Search
            </Button>
          )}
        </div>

        {/* Table View */}
        {viewMode === 'table' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Travel
                    </th>
                    <th scope="col" className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Date & Source
                    </th>
                    <th scope="col" className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Assigned
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentInquiries.map((inquiry) => {
                    const status = getStatusBadge(inquiry.status || 'new');
                    const source = getSourceBadge(inquiry.source || 'website', inquiry.sourceDetails);
                    const assignment = getAssignmentBadge(inquiry);
                    const StatusIcon = status.icon;
                    const SourceIcon = source.icon;
                    const AssignmentIcon = assignment.icon;
                    const isEmailCopied = copiedItem.type === 'email' && copiedItem.id === inquiry._id;
                    const isPhoneCopied = copiedItem.type === 'phone' && copiedItem.id === inquiry._id;
                    const isAssignedToMe = inquiry.assignedTo && (
                      inquiry.assignedTo._id === user?._id || 
                      inquiry.assignedTo === user?._id
                    );
                    
                    return (
                      <tr key={inquiry._id} className={`hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all duration-150 group ${isAssignedToMe ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center mr-2 sm:mr-3 group-hover:scale-105 transition-transform ${
                              isAssignedToMe 
                                ? 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30'
                                : inquiry.assignedTo
                                ? 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30'
                                : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/30 dark:to-gray-800/30'
                            }`}>
                              <User className={`h-4 w-4 sm:h-5 sm:w-5 ${
                                isAssignedToMe 
                                  ? 'text-green-600 dark:text-green-400'
                                  : inquiry.assignedTo
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`} />
                            </div>
                            <div className="min-w-0">
                              <div className={`font-medium truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors ${
                                isAssignedToMe ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'
                              }`}>
                                {inquiry.fullName}
                                {isAssignedToMe && (
                                  <span className="ml-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${source.color}`}>
                                  <SourceIcon className="h-3 w-3 mr-1" />
                                  <span className="truncate max-w-[80px]">{source.label}</span>
                                </span>
                                {inquiry.isManual ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                                    <Edit className="h-3 w-3 mr-1" />
                                    M
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center group/email">
                              <Mail className="h-3.5 w-3.5 text-gray-400 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                                {inquiry.email}
                              </span>
                              <button
                                onClick={() => handleCopy(inquiry.email, 'email', inquiry._id)}
                                className="ml-1 p-0.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 opacity-0 group-hover/email:opacity-100 transition-all"
                                title="Copy email"
                              >
                                {isEmailCopied ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            
                            <div className="flex items-center group/phone">
                              <Phone className="h-3.5 w-3.5 text-gray-400 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                {inquiry.phoneNumber}
                              </span>
                              <button
                                onClick={() => handleCopy(inquiry.phoneNumber, 'phone', inquiry._id)}
                                className="ml-1 p-0.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 opacity-0 group-hover/phone:opacity-100 transition-all"
                                title="Copy phone number"
                              >
                                {isPhoneCopied ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {inquiry.origin} → {inquiry.destination}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span>
                                {inquiry.adults}A {inquiry.children > 0 ? `, ${inquiry.children}C` : ''} {inquiry.infants > 0 ? `, ${inquiry.infants}I` : ''}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-900 dark:text-white">
                              <Calendar className="h-3.5 w-3.5 mr-2 text-gray-400" />
                              <div>
                                <div className="font-medium truncate">{formatDate(inquiry.createdAt)}</div>
                                <div className="text-xs text-gray-500">{formatTime(inquiry.createdAt)}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <SourceIcon className="h-3 w-3 inline mr-1" />
                              {source.label}
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${assignment.color} transition-all group-hover:scale-105`}>
                            <AssignmentIcon className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[100px]">{assignment.label}</span>
                          </span>
                          {inquiry.assignedTo && user?.role === 'admin' && inquiry.assignedTo.name && (
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {inquiry.assignedTo.email}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color} transition-all group-hover:scale-105`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Button
                              onClick={() => handleNavigateToDetails(inquiry._id)}
                              variant="outline"
                              size="sm"
                              className="border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all px-2"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5 " />
                            </Button>
                            <Button
                              onClick={() => handleViewDetails(inquiry)}
                              variant="outline"
                              size="sm"
                              className="hidden sm:inline-flex border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                            >
                              Quick View
                            </Button>
                            {user?.role === 'admin' && (
                              <Button
                                onClick={() => handleDelete(inquiry._id)}
                                variant="danger"
                                size="sm"
                                className="hover:bg-rose-600 dark:hover:bg-rose-600 transition-all px-2"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            {user?.role !== 'admin' && (
                              <Button
                                disabled
                                title="Only administrators can delete inquiries"
                                variant="danger"
                                size="sm"
                                className="hover:bg-rose-600 dark:hover:bg-rose-600 transition-all px-2"
                              >
                               <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {currentInquiries.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {getCurrentSearchTerm() ? 'No results found' : `No ${activeTab === 'all' ? '' : activeTab} inquiries found`}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                  {getCurrentSearchTerm() 
                    ? 'Try adjusting your search or filter terms' 
                    : activeTab === 'manual' 
                      ? 'Create your first manual inquiry to get started'
                      : activeTab === 'assigned'
                      ? 'You have no assigned inquiries yet'
                      : 'No inquiries submitted yet'}
                </p>
                {activeTab === 'manual' && !getCurrentSearchTerm() && currentInquiries.length === 0 && (
                  <Link href="/inquiries/add">
                    <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Manual Inquiry
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Card View with improved responsive design */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {currentInquiries.map((inquiry) => {
              const status = getStatusBadge(inquiry.status || 'new');
              const source = getSourceBadge(inquiry.source || 'website', inquiry.sourceDetails);
              const assignment = getAssignmentBadge(inquiry);
              const StatusIcon = status.icon;
              const SourceIcon = source.icon;
              const AssignmentIcon = assignment.icon;
              const isEmailCopied = copiedItem.type === 'email' && copiedItem.id === inquiry._id;
              const isPhoneCopied = copiedItem.type === 'phone' && copiedItem.id === inquiry._id;
              const isAssignedToMe = inquiry.assignedTo && (
                inquiry.assignedTo._id === user?._id || 
                inquiry.assignedTo === user?._id
              );
              
              return (
                <div key={inquiry._id} className={`group bg-white dark:bg-gray-800 rounded-xl shadow-sm border hover:shadow-lg transition-all duration-200 overflow-hidden ${
                  isAssignedToMe 
                    ? 'border-green-300 dark:border-green-700 hover:border-green-400 dark:hover:border-green-600 bg-green-50/30 dark:bg-green-900/10' 
                    : inquiry.assignedTo
                    ? 'border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}>
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-2 sm:mr-3 group-hover:scale-105 transition-transform ${
                          isAssignedToMe 
                            ? 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30'
                            : inquiry.assignedTo
                            ? 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30'
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/30 dark:to-gray-800/30'
                        }`}>
                          <User className={`h-4 w-4 sm:h-5 sm:w-5 ${
                            isAssignedToMe 
                              ? 'text-green-600 dark:text-green-400'
                              : inquiry.assignedTo
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`} />
                        </div>
                        <div className="min-w-0">
                          <h3 className={`font-semibold text-sm sm:text-base group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate ${
                            isAssignedToMe ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'
                          }`}>
                            {inquiry.fullName}
                            {isAssignedToMe && (
                              <span className="ml-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${source.color}`}>
                              <SourceIcon className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-[60px] sm:max-w-[80px]">{source.label}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color} transition-transform group-hover:scale-105`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </span>
                    </div>
                    
                    {/* Assignment Badge */}
                    <div className="mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${assignment.color}`}>
                        <AssignmentIcon className="h-3 w-3 mr-1" />
                        <span className="truncate max-w-[120px]">{assignment.label}</span>
                      </span>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between group/email">
                        <div className="flex items-center min-w-0">
                          <Mail className="h-3.5 w-3.5 text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">
                            {inquiry.email}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(inquiry.email, 'email', inquiry._id)}
                          className="p-0.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 opacity-0 group-hover/email:opacity-100 transition-all flex-shrink-0"
                          title="Copy email"
                        >
                          {isEmailCopied ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between group/phone">
                        <div className="flex items-center min-w-0">
                          <Phone className="h-3.5 w-3.5 text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">
                            {inquiry.phoneNumber}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(inquiry.phoneNumber, 'phone', inquiry._id)}
                          className="p-0.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 opacity-0 group-hover/phone:opacity-100 transition-all flex-shrink-0"
                          title="Copy phone number"
                        >
                          {isPhoneCopied ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-4">
                    {/* Travel Route */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-3.5 w-3.5 mr-2" />
                          Travel Route
                        </div>
                        <div className="text-xs text-gray-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatDate(inquiry.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-2 sm:p-3">
                        <div className="text-center flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 truncate">{inquiry.origin}</div>
                          <div className="text-xs text-gray-500">Origin</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 mx-1 sm:mx-2" />
                        <div className="text-center flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 truncate">{inquiry.destination}</div>
                          <div className="text-xs text-gray-500">Destination</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Passenger Info */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                        <div className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">{inquiry.adults}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Adults</div>
                      </div>
                      <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                        <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{inquiry.children}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Children</div>
                      </div>
                      <div className="text-center bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
                        <div className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400">{inquiry.infants}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Infants</div>
                      </div>
                    </div>
                    
                    {/* Message Preview */}
                    {inquiry.message && (
                      <div className="mb-3">
                        <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <MessageSquare className="h-3.5 w-3.5 mr-2" />
                          Message Preview
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {inquiry.message}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Card Footer */}
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {inquiry.isManual ? (
                          <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
                            <Edit className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Manual</span>
                            <span className="sm:hidden">M</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-blue-600 dark:text-blue-400">
                            <Globe className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Website</span>
                            <span className="sm:hidden">W</span>
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          onClick={() => handleNavigateToDetails(inquiry._id)}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all px-2"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {user?.role === 'admin' && (
                          <>
                            {inquiry.assignedTo ? (
                              <Button
                                onClick={() => handleUnassignInquiry(inquiry._id)}
                                variant="outline"
                                size="sm"
                                className="border-amber-300 text-amber-600 dark:border-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 px-2"
                                title="Unassign Inquiry"
                              >
                                <UserX className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleAssignInquiry(inquiry._id)}
                                variant="outline"
                                size="sm"
                                className="border-green-300 text-green-600 dark:border-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 px-2"
                                title="Assign to Me"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              onClick={() => handleDelete(inquiry._id)}
                              variant="danger"
                              size="sm"
                              className="hover:bg-rose-600 dark:hover:bg-rose-600 transition-all px-2"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {user?.role !== 'admin' && (
                          <Button
                            disabled
                            title="Only administrators can delete inquiries"
                            variant="danger"
                            size="sm"
                            className="hover:bg-rose-600 dark:hover:bg-rose-600 transition-all px-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {currentInquiries.length === 0 && (
              <div className="col-span-full">
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {getCurrentSearchTerm() ? 'No results found' : `No ${activeTab === 'all' ? '' : activeTab} inquiries found`}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                    {getCurrentSearchTerm() 
                      ? 'Try adjusting your search or filter terms' 
                      : activeTab === 'manual' 
                        ? 'Create your first manual inquiry to get started'
                        : activeTab === 'assigned'
                        ? 'You have no assigned inquiries yet'
                        : 'No inquiries submitted yet'}
                  </p>
                  {activeTab === 'manual' && !getCurrentSearchTerm() && currentInquiries.length === 0 && (
                    <Link href="/inquiries/add">
                      <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Manual Inquiry
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {sortedInquiries.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-primary-600 dark:text-primary-400">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedInquiries.length)}</span> of{' '}
              <span className="font-semibold text-primary-600 dark:text-primary-400">{sortedInquiries.length}</span> {activeTab} inquiries
              {statusFilter !== 'all' && (
                <span className="ml-2">
                  (filtered by: <span className="font-medium text-gray-900 dark:text-white">{statusFilter}</span>)
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-1">
                {getPageNumbers().map((pageNumber, index) => (
                  pageNumber === '...' ? (
                    <span key={`dots-${index}`} className="px-3 py-1 text-gray-500">
                      ...
                    </span>
                  ) : (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all min-w-[2.5rem] ${
                        currentPage === pageNumber
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm'
                          : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {sortedInquiries.length > 0 && sortedInquiries.length <= itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing all <span className="font-semibold text-primary-600 dark:text-primary-400">{sortedInquiries.length}</span> {activeTab} inquiries
              {statusFilter !== 'all' && (
                <span className="ml-2">
                  (filtered by: <span className="font-medium text-gray-900 dark:text-white">{statusFilter}</span>)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal for Quick Inquiry Details */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Inquiry Details"
        size="lg"
      >
        {selectedInquiry && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                selectedInquiry.assignedTo && (selectedInquiry.assignedTo._id === user?._id || selectedInquiry.assignedTo === user?._id)
                  ? 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30'
                  : selectedInquiry.assignedTo
                  ? 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900/30 dark:to-gray-800/30'
              }`}>
                <User className={`h-6 w-6 ${
                  selectedInquiry.assignedTo && (selectedInquiry.assignedTo._id === user?._id || selectedInquiry.assignedTo === user?._id)
                    ? 'text-green-600 dark:text-green-400'
                    : selectedInquiry.assignedTo
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedInquiry.fullName}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedInquiry.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Assignment Info */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Assignment Status
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getAssignmentBadge(selectedInquiry).color}`}>
                      <AssignmentIcon className="h-3.5 w-3.5 mr-1.5" />
                      {getAssignmentBadge(selectedInquiry).label}
                    </span>
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <div>
                    {selectedInquiry.assignedTo ? (
                      <Button
                        onClick={() => handleUnassignInquiry(selectedInquiry._id)}
                        variant="outline"
                        size="sm"
                        className="border-amber-300 text-amber-600 dark:border-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Unassign
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          handleAssignInquiry(selectedInquiry._id);
                          setIsModalOpen(false);
                        }}
                        variant="outline"
                        size="sm"
                        className="border-green-300 text-green-600 dark:border-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Assign to Me
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {selectedInquiry.assignedTo && user?.role === 'admin' && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="font-medium">Assigned User Details:</div>
                  <div>Name: {selectedInquiry.assignedTo.name || 'N/A'}</div>
                  <div>Email: {selectedInquiry.assignedTo.email || 'N/A'}</div>
                  <div>Role: {selectedInquiry.assignedTo.role || 'N/A'}</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</label>
                <p className="text-sm text-gray-900 dark:text-white font-medium">{selectedInquiry.phoneNumber}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedInquiry.status || 'new').color}`}>
                  {getStatusBadge(selectedInquiry.status || 'new').label}
                </span>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submission Date</label>
                <p className="text-sm text-gray-900 dark:text-white font-medium">{formatDate(selectedInquiry.createdAt)}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</label>
                <p className="text-sm text-gray-900 dark:text-white font-medium">{formatTime(selectedInquiry.createdAt)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">Travel Route</label>
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-5">
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{selectedInquiry.origin}</p>
                  <p className="text-xs text-gray-500 mt-1">Origin</p>
                </div>
                <ChevronRight className="h-6 w-6 text-gray-400 mx-4" />
                <div className="text-center">
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{selectedInquiry.destination}</p>
                  <p className="text-xs text-gray-500 mt-1">Destination</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedInquiry.adults}</div>
                <p className="text-xs text-gray-500 mt-1">Adults</p>
              </div>
              <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{selectedInquiry.children}</div>
                <p className="text-xs text-gray-500 mt-1">Children</p>
              </div>
              <div className="text-center bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedInquiry.infants}</div>
                <p className="text-xs text-gray-500 mt-1">Infants</p>
              </div>
            </div>

            {selectedInquiry.message && (
              <div className="border-t pt-4">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">Message</label>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                  <p className="text-sm text-gray-900 dark:text-white">{selectedInquiry.message}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t">
              <Button 
                onClick={() => setIsModalOpen(false)} 
                variant="outline"
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 w-full sm:w-auto"
              >
                Close
              </Button>
              <Button
                onClick={() => handleNavigateToDetails(selectedInquiry._id)}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 w-full sm:w-auto"
              >
                View Full Details
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </LayoutWrapper>
  );
}