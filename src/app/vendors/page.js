'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/Button';
import { useAuth } from '@/context/AuthContext';
import { vendorsAPI, financialAPI } from '@/utils/api';
import {
  Eye,
  Trash2,
  Table,
  LayoutGrid,
  RefreshCw,
  Download,
  Search,
  User,
  Mail,
  Phone,
  Calendar,
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
  Building,
  Edit,
  Filter,
  Loader2,
  ArrowUpDown,
  CalendarDays,
  X,
  Banknote,
  FileCheck,
  Building2,
  Briefcase,
  Shield,
  CreditCard,
  DollarSign,
  BadgeCheck,
  AlertTriangle,
  Package,
  Truck,
  Hotel,
  Plane,
  Car,
  FileWarning,
  Receipt,
  PieChart,
  TrendingDown,
  CheckSquare,
  AlertOctagon,
  Building as BuildingIcon,
  Landmark,
  Wallet,
  FileText as FileTextIcon,
  BarChart3,
  Calculator
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [typeFilter, setTypeFilter] = useState('all');
  const [copiedItem, setCopiedItem] = useState({ type: null, id: null });
  const { user, token, isAuthenticated, loading } = useAuth();
  
  // Tabs state with individual search terms
  const [activeTab, setActiveTab] = useState('all');
  const [tabSearchTerms, setTabSearchTerms] = useState({
    all: '',
    airline: '',
    hotel: '',
    transport: '',
    visa: '',
    insurance: '',
    tour: '',
    other: ''
  });
  
  // Active filter state
  const [activeFilter, setActiveFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Sorting state
  const [sortBy, setSortBy] = useState('name-asc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Financial stats state
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (token) {
      fetchVendors();
      fetchFinancialSummary();
    }
  }, [loading, isAuthenticated, token, router]);

  const fetchVendors = async () => {
    if (!token) {
      console.error('❌ No token available for API call');
      toast.error('Authentication token missing. Please login again.');
      return;
    }
    
    try {
      setLoadingPage(true);
      const data = await vendorsAPI.getAll(token);
      setVendors(data.vendors || []);
      setCurrentPage(1);
    } catch (error) {
      console.error('❌ Error fetching vendors:', error);
      toast.error(error.message || 'Failed to fetch vendors');
    } finally {
      setLoadingPage(false);
    }
  };

  const fetchFinancialSummary = async () => {
    if (!token) return;
    
    try {
      setLoadingStats(true);
      const data = await financialAPI.getVendorSummary(token);
      setFinancialSummary(data);
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCopy = (text, type, id) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedItem({ type, id });
        toast.success(`${type === 'email' ? 'Email' : 'Tax ID'} copied!`);
        setTimeout(() => setCopiedItem({ type: null, id: null }), 2000);
      })
      .catch(() => {
        toast.error('Failed to copy to clipboard');
      });
  };

  const confirmDelete = (vendor) => {
    if (!token) {
      toast.error('Authentication required. Please login again.');
      return;
    }
    
    // Check if user is admin
    if (user?.role !== 'admin') {
      toast.error('Only administrators can delete vendors');
      return;
    }
    
    // Show confirmation modal
    setVendorToDelete(vendor);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!vendorToDelete || !token) return;
    
    try {
      setDeleting(true);
      
      // Use the vendorsAPI utility or fetch directly
      await vendorsAPI.delete(vendorToDelete._id, token);
      
      toast.success('Vendor deleted successfully');
      
      // Close modals and refresh data
      setIsDeleteModalOpen(false);
      setVendorToDelete(null);
      fetchVendors();
      
    } catch (error) {
      console.error('Delete error:', error);
      
      // Error handling
      if (error.message.includes('Access denied')) {
        toast.error('Access denied. Only administrators can delete vendors.');
      } else {
        toast.error(error.message || 'Failed to delete vendor');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleViewDetails = (vendor) => {
    setSelectedVendor(vendor);
    setIsModalOpen(true);
  };

  // Handle type filter change
  const handleTypeFilterChange = (type) => {
    setTypeFilter(type);
    setCurrentPage(1);
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate statistics for each tab
  const calculateStats = () => {
    // Filter vendors based on active tab
    const tabVendors = activeTab === 'all' ? vendors : 
                       vendors.filter(v => v.vendorType === activeTab);
    
    const activeVendors = tabVendors.filter(v => v.isActive);
    const inactiveVendors = tabVendors.filter(v => !v.isActive);
    const requires1099 = tabVendors.filter(v => v.requires1099 || (v.ytdTotal > 600));
    
    // Calculate total YTD payments
    const totalYTD = tabVendors.reduce((sum, vendor) => sum + (vendor.ytdTotal || 0), 0);
    
    // Count by vendor type for all vendors
    const vendorTypeCounts = {};
    vendors.forEach(vendor => {
      if (!vendorTypeCounts[vendor.vendorType]) {
        vendorTypeCounts[vendor.vendorType] = 0;
      }
      vendorTypeCounts[vendor.vendorType]++;
    });
    
    return {
      total: tabVendors.length,
      active: activeVendors.length,
      inactive: inactiveVendors.length,
      requires1099: requires1099.length,
      totalYTD: totalYTD,
      byType: vendorTypeCounts
    };
  };

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
    setTypeFilter('all');
    setActiveFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('name-asc');
    setTabSearchTerms({
      all: '',
      airline: '',
      hotel: '',
      transport: '',
      visa: '',
      insurance: '',
      tour: '',
      other: ''
    });
    setCurrentPage(1);
  };

  // Filter vendors based on tab, search, type, and status
  const filteredVendors = vendors.filter(vendor => {
    // Tab filter
    let matchesTab = true;
    if (activeTab !== 'all') {
      matchesTab = vendor.vendorType === activeTab;
    }
    
    // Search filter for current tab
    const searchTerm = getCurrentSearchTerm();
    const matchesSearch = 
      !searchTerm ||
      vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.taxId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.vendorType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    const matchesType = typeFilter === 'all' || vendor.vendorType === typeFilter;
    
    // Active filter
    let matchesActive = true;
    if (activeFilter === 'active') {
      matchesActive = vendor.isActive === true;
    } else if (activeFilter === 'inactive') {
      matchesActive = vendor.isActive === false;
    }
    
    return matchesTab && matchesSearch && matchesType && matchesActive;
  });

  // Sort filtered vendors
  const sortedVendors = [...filteredVendors].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'ytd-desc':
        return (b.ytdTotal || 0) - (a.ytdTotal || 0);
      case 'ytd-asc':
        return (a.ytdTotal || 0) - (b.ytdTotal || 0);
      case 'date-desc':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'date-asc':
        return new Date(a.createdAt) - new Date(b.createdAt);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedVendors.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVendors = sortedVendors.slice(indexOfFirstItem, indexOfLastItem);

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

  const getVendorTypeIcon = (type) => {
    const typeIcons = {
      'airline': Plane,
      'hotel': Hotel,
      'transport': Car,
      'visa': FileCheck,
      'insurance': Shield,
      'tour': Briefcase,
      'other': Building
    };
    return typeIcons[type] || Building;
  };

  const getVendorTypeColor = (type) => {
    const typeColors = {
      'airline': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'hotel': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'transport': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      'visa': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      'insurance': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
      'tour': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return typeColors[type] || typeColors['other'];
  };

  const getVendorTypeLabel = (type) => {
    const typeLabels = {
      'airline': 'Airline',
      'hotel': 'Hotel',
      'transport': 'Transport',
      'visa': 'Visa Service',
      'insurance': 'Insurance',
      'tour': 'Tour Operator',
      'other': 'Other'
    };
    return typeLabels[type] || 'Other';
  };

  const getStatusBadge = (isActive, ytdTotal) => {
    if (!isActive) {
      return {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        icon: XCircle,
        label: 'Inactive'
      };
    }
    
    if (ytdTotal > 600) {
      return {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: AlertTriangle,
        label: 'Requires 1099'
      };
    }
    
    return {
      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      icon: CheckCircle,
      label: 'Active'
    };
  };

  const getPaymentTermsBadge = (terms) => {
    const termsConfig = {
      'net15': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Net 15' },
      'net30': { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Net 30' },
      'net45': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Net 45' },
      'net60': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', label: 'Net 60' },
      'prepaid': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', label: 'Prepaid' },
      'on_delivery': { color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400', label: 'On Delivery' }
    };
    return termsConfig[terms] || termsConfig['net30'];
  };

  const stats = calculateStats();

  if (loading || (isAuthenticated && !token)) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              {loading ? 'Checking authentication...' : 'Loading vendors...'}
            </p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Vendor Management</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage all suppliers and service providers with financial tracking
            </p>
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
                    const csvData = sortedVendors.map(vendor => [
                      `"${vendor.name}"`,
                      `"${getVendorTypeLabel(vendor.vendorType)}"`,
                      `"${vendor.contactPerson || 'N/A'}"`,
                      `"${vendor.email || 'N/A'}"`,
                      `"${vendor.phone || 'N/A'}"`,
                      `"${vendor.taxId || 'N/A'}"`,
                      vendor.ytdTotal || 0,
                      vendor.isActive ? 'Active' : 'Inactive',
                      vendor.requires1099 || vendor.ytdTotal > 600 ? 'Yes' : 'No',
                      `"${formatDate(vendor.createdAt)}"`
                    ].join(','));
                    
                    const headers = ['Name', 'Type', 'Contact Person', 'Email', 'Phone', 'Tax ID', 'YTD Payments', 'Status', 'Requires 1099', 'Created Date'];
                    const csvContent = [headers.join(','), ...csvData].join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    
                    link.setAttribute('href', url);
                    link.setAttribute('download', `vendors_${new Date().toISOString().split('T')[0]}.csv`);
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
                  onClick={() => {
                    fetchVendors();
                    fetchFinancialSummary();
                  }}
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
                
                <Link href="/vendors/add">
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vendor
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Vendors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {vendors.length}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Vendors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {vendors.filter(v => v.isActive).length}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <CheckCircle className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Require 1099</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {vendors.filter(v => v.requires1099 || v.ytdTotal > 600).length}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                  <FileWarning className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">YTD Payments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  ${vendors.reduce((sum, v) => sum + (v.ytdTotal || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Type Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vendor Distribution by Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(stats.byType).map(([type, count]) => {
              const Icon = getVendorTypeIcon(type);
              const colorClass = getVendorTypeColor(type);
              return (
                <div key={type} className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-2 ${colorClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{getVendorTypeLabel(type)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs with Integrated Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs Navigation */}
            <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
              <button
                onClick={() => {
                  setActiveTab('all');
                  setCurrentPage(1);
                }}
                className={`relative py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>All Vendors</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium min-w-[2rem] justify-center ${
                    activeTab === 'all' 
                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {vendors.length}
                  </span>
                </div>
              </button>
              
              {['airline', 'hotel', 'transport', 'visa', 'insurance', 'tour', 'other'].map(type => {
                const Icon = getVendorTypeIcon(type);
                const count = vendors.filter(v => v.vendorType === type).length;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setActiveTab(type);
                      setCurrentPage(1);
                    }}
                    className={`relative py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                      activeTab === type
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{getVendorTypeLabel(type)}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium min-w-[2rem] justify-center ${
                        activeTab === type 
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
            
            {/* Tab-specific Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-auto md:min-w-[280px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'all' ? 'all' : getVendorTypeLabel(activeTab)} vendors...`}
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
              
              {/* Type Filter Dropdown */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none pl-10 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                >
                  <option value="all">All Types</option>
                  {['airline', 'hotel', 'transport', 'visa', 'insurance', 'tour', 'other'].map(type => (
                    <option key={type} value={type}>{getVendorTypeLabel(type)}</option>
                  ))}
                </select>
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className="w-2 h-2 border-b-2 borderr-2 border-gray-400 rotate-45"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Filter and Sorting Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Status Filter
              </label>
              <button
                onClick={() => {
                  setActiveFilter('all');
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
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setActiveFilter(option.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-2 text-xs rounded-lg transition-all ${
                    activeFilter === option.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sorting Options */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Sort By
              </label>
              <button
                onClick={() => handleSortChange('name-asc')}
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'name-asc', label: 'Name A-Z' },
                { value: 'name-desc', label: 'Name Z-A' },
                { value: 'ytd-desc', label: 'YTD High-Low' },
                { value: 'date-desc', label: 'Newest First' }
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
        </div>

        {/* Results Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Filtered Results
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sortedVendors.length} vendors match your criteria
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Filter Status
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {activeFilter === 'all' ? 'All Status' : 
                 activeFilter === 'active' ? 'Active Only' : 'Inactive Only'}
              </div>
            </div>
          </div>
          
          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {typeFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Type: {getVendorTypeLabel(typeFilter)}
              </span>
            )}
            {getCurrentSearchTerm() && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                Search: "{getCurrentSearchTerm()}"
              </span>
            )}
            {activeTab !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                Category: {getVendorTypeLabel(activeTab)}
              </span>
            )}
            {sortBy !== 'name-asc' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                Sorted: {
                  sortBy === 'name-desc' ? 'Name Z-A' :
                  sortBy === 'ytd-desc' ? 'YTD High-Low' :
                  'Newest First'
                }
              </span>
            )}
          </div>
        </div>

        {/* Clear All Filters Button */}
        {(typeFilter !== 'all' || activeFilter !== 'all' || getCurrentSearchTerm() || activeTab !== 'all' || sortBy !== 'name-asc') && (
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

        {/* Results Count */}
        <div className="flex items-center justify-between px-1">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {getCurrentSearchTerm() ? (
              <span>
                Found <span className="font-semibold text-primary-600 dark:text-primary-400">{sortedVendors.length}</span> results for "<span className="font-medium text-gray-900 dark:text-white">{getCurrentSearchTerm()}</span>"
                {typeFilter !== 'all' && (
                  <span className="ml-2">
                    (filtered by: <span className="font-medium text-gray-900 dark:text-white">{getVendorTypeLabel(typeFilter)}</span>)
                  </span>
                )}
              </span>
            ) : (
              <span>
                Showing <span className="font-semibold text-primary-600 dark:text-primary-400">{sortedVendors.length}</span> {activeTab === 'all' ? '' : getVendorTypeLabel(activeTab)} vendors
                {typeFilter !== 'all' && (
                  <span className="ml-2">
                    (filtered by: <span className="font-medium text-gray-900 dark:text-white">{getVendorTypeLabel(typeFilter)}</span>)
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
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Vendor Details
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Contact Information
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Financial Information
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Registration Date & Type
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status & Terms
                    </th>
                    <th scope="col" className="px 6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentVendors.map((vendor) => {
                    const TypeIcon = getVendorTypeIcon(vendor.vendorType);
                    const typeColor = getVendorTypeColor(vendor.vendorType);
                    const status = getStatusBadge(vendor.isActive, vendor.ytdTotal || 0);
                    const StatusIcon = status.icon;
                    const paymentTerms = getPaymentTermsBadge(vendor.paymentTerms);
                    const isEmailCopied = copiedItem.type === 'email' && copiedItem.id === vendor._id;
                    const isTaxCopied = copiedItem.type === 'tax' && copiedItem.id === vendor._id;
                    const requires1099 = vendor.requires1099 || (vendor.ytdTotal > 600);
                    
                    return (
                      <tr key={vendor._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all duration-150 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full ${typeColor} flex items-center justify-center mr-3 group-hover:scale-105 transition-transform`}>
                              <TypeIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                {vendor.name}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColor}`}>
                                  <TypeIcon className="h-3 w-3 mr-1" />
                                  {getVendorTypeLabel(vendor.vendorType)}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Tax ID: {vendor.taxId || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center group/contact">
                              <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                                {vendor.contactPerson || 'No contact person'}
                              </span>
                            </div>
                            
                            {vendor.email && (
                              <div className="flex items-center group/email">
                                <Mail className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[140px]">
                                  {vendor.email}
                                </span>
                                <button
                                  onClick={() => handleCopy(vendor.email, 'email', vendor._id)}
                                  className="ml-2 p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 opacity-0 group-hover/email:opacity-100 transition-all"
                                  title="Copy email"
                                >
                                  {isEmailCopied ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            )}
                            
                            {vendor.phone && (
                              <div className="flex items-center group/phone">
                                <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {vendor.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">YTD Payments:</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                ${(vendor.ytdTotal || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Tax Status:</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {vendor.taxId ? 'Tax ID Provided' : 'No Tax ID'}
                              </span>
                            </div>
                            {requires1099 && (
                              <div className="flex items-center">
                                <AlertTriangle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                  1099 Required
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-900 dark:text-white">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              <div>
                                <div className="font-medium">{formatDate(vendor.createdAt)}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <TypeIcon className="h-3 w-3 inline mr-1" />
                              {getVendorTypeLabel(vendor.vendorType)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.color} transition-all group-hover:scale-105`}>
                              <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                              {status.label}
                            </span>
                            {vendor.paymentTerms && (
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${paymentTerms.color}`}>
                                <CreditCard className="h-3 w-3 mr-1" />
                                {paymentTerms.label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <Link href={`/vendors/${vendor._id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              onClick={() => handleViewDetails(vendor)}
                              variant="outline"
                              size="sm"
                              className="border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                            >
                              Quick View
                            </Button>
                            <Link href={`/vendors/edit/${vendor._id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                                title="Edit Vendor"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            {user?.role === 'admin' ? (
                              <Button
                                onClick={() => confirmDelete(vendor)}
                                variant="danger"
                                size="sm"
                                className="hover:bg-rose-600 dark:hover:bg-rose-600 transition-all"
                                title="Delete (Admin Only)"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                disabled
                                title="Only administrators can delete vendors"
                                variant="danger"
                                size="sm"
                                className="hover:bg-rose-600 dark:hover:bg-rose-600 transition-all opacity-50 cursor-not-allowed"
                              >
                               <Trash2 className="h-4 w-4" />
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
            
            {currentVendors.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
                  <Building2 className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {getCurrentSearchTerm() ? 'No results found' : `No ${activeTab === 'all' ? '' : getVendorTypeLabel(activeTab)} vendors found`}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                  {getCurrentSearchTerm() 
                    ? 'Try adjusting your search or filter terms' 
                    : activeTab === 'all' 
                      ? 'Add your first vendor to get started'
                      : `No ${getVendorTypeLabel(activeTab)} vendors added yet`}
                </p>
                {!getCurrentSearchTerm() && currentVendors.length === 0 && (
                  <Link href="/vendors/add">
                    <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Vendor
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Card View with improved design */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {currentVendors.map((vendor) => {
              const TypeIcon = getVendorTypeIcon(vendor.vendorType);
              const typeColor = getVendorTypeColor(vendor.vendorType);
              const status = getStatusBadge(vendor.isActive, vendor.ytdTotal || 0);
              const StatusIcon = status.icon;
              const paymentTerms = getPaymentTermsBadge(vendor.paymentTerms);
              const isEmailCopied = copiedItem.type === 'email' && copiedItem.id === vendor._id;
              const requires1099 = vendor.requires1099 || (vendor.ytdTotal > 600);
              
              return (
                <div key={vendor._id} className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 overflow-hidden">
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full ${typeColor} flex items-center justify-center mr-3 group-hover:scale-105 transition-transform`}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {vendor.name}
                          </h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColor}`}>
                              <TypeIcon className="h-3 w-3 mr-1" />
                              {getVendorTypeLabel(vendor.vendorType)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color} transition-transform group-hover:scale-105`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </span>
                    </div>
                    
                    {/* Tax ID */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between group/tax">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Tax ID: {vendor.taxId || 'Not provided'}
                          </span>
                        </div>
                        {vendor.taxId && (
                          <button
                            onClick={() => handleCopy(vendor.taxId, 'tax', vendor._id)}
                            className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 opacity-0 group-hover/tax:opacity-100 transition-all"
                            title="Copy Tax ID"
                          >
                            {isEmailCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="space-y-2">
                      {vendor.contactPerson && (
                        <div className="flex items-center group/contact">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {vendor.contactPerson}
                          </span>
                        </div>
                      )}
                      
                      {vendor.email && (
                        <div className="flex items-center justify-between group/email">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                              {vendor.email}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(vendor.email, 'email', vendor._id)}
                            className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 opacity-0 group-hover/email:opacity-100 transition-all"
                            title="Copy email"
                          >
                            {isEmailCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                      
                      {vendor.phone && (
                        <div className="flex items-center group/phone">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {vendor.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-5">
                    {/* Financial Stats */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <DollarSign className="h-4 w-4 mr-2" />
                          YTD Payments
                        </div>
                        <div className="text-xs text-gray-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatDate(vendor.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-3">
                        <div className="text-center flex-1">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            ${(vendor.ytdTotal || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Total Paid</div>
                        </div>
                        {requires1099 && (
                          <div className="text-center flex-1">
                            <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                              1099 Required
                            </div>
                            <div className="text-xs text-gray-500">Tax Status</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Payment Terms & Address */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                        <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                        <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          {paymentTerms.label}
                        </div>
                        <div className="text-xs text-gray-500">Terms</div>
                      </div>
                      
                      <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                        <Building className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                        <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          {vendor.address?.city ? vendor.address.city : 'Location'}
                        </div>
                        <div className="text-xs text-gray-500">Location</div>
                      </div>
                    </div>
                    
                    {/* Notes Preview */}
                    {vendor.notes && (
                      <div className="mb-4">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <FileTextIcon className="h-4 w-4 mr-2" />
                          Notes Preview
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {vendor.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Card Footer */}
                  <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        <span className="inline-flex items-center text-blue-600 dark:text-blue-400">
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {getVendorTypeLabel(vendor.vendorType)}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/vendors/${vendor._id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {user?.role === 'admin' ? (
                          <Button
                            onClick={() => confirmDelete(vendor)}
                            variant="danger"
                            size="sm"
                            className="hover:bg-rose-600 dark:hover:bg-rose-600 transition-all"
                            title="Delete (Admin Only)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            disabled
                            title="Only administrators can delete vendors"
                            variant="danger"
                            size="sm"
                            className="hover:bg-rose-600 dark:hover:bg-rose-600 transition-all opacity-50 cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {currentVendors.length === 0 && (
              <div className="col-span-full">
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
                    <Building2 className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {getCurrentSearchTerm() ? 'No results found' : `No ${activeTab === 'all' ? '' : getVendorTypeLabel(activeTab)} vendors found`}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                    {getCurrentSearchTerm() 
                      ? 'Try adjusting your search or filter terms' 
                      : activeTab === 'all' 
                        ? 'Add your first vendor to get started'
                        : `No ${getVendorTypeLabel(activeTab)} vendors added yet`}
                  </p>
                  {!getCurrentSearchTerm() && currentVendors.length === 0 && (
                    <Link href="/vendors/add">
                      <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Vendor
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {sortedVendors.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-primary-600 dark:text-primary-400">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedVendors.length)}</span> of{' '}
              <span className="font-semibold text-primary-600 dark:text-primary-400">{sortedVendors.length}</span> {activeTab === 'all' ? '' : getVendorTypeLabel(activeTab)} vendors
              {typeFilter !== 'all' && (
                <span className="ml-2">
                  (filtered by: <span className="font-medium text-gray-900 dark:text-white">{getVendorTypeLabel(typeFilter)}</span>)
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

        {sortedVendors.length > 0 && sortedVendors.length <= itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing all <span className="font-semibold text-primary-600 dark:text-primary-400">{sortedVendors.length}</span> {activeTab === 'all' ? '' : getVendorTypeLabel(activeTab)} vendors
              {typeFilter !== 'all' && (
                <span className="ml-2">
                  (filtered by: <span className="font-medium text-gray-900 dark:text-white">{getVendorTypeLabel(typeFilter)}</span>)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal for Quick Vendor Details */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Vendor Details"
        size="lg"
      >
        {selectedVendor && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className={`w-14 h-14 rounded-full ${getVendorTypeColor(selectedVendor.vendorType)} flex items-center justify-center`}>
                {(() => {
                  const Icon = getVendorTypeIcon(selectedVendor.vendorType);
                  return <Icon className="h-6 w-6" />;
                })()}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedVendor.name}</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getVendorTypeColor(selectedVendor.vendorType)}`}>
                    {getVendorTypeLabel(selectedVendor.vendorType)}
                  </span>
                  {selectedVendor.taxId && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      Tax ID: {selectedVendor.taxId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Person</label>
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {selectedVendor.contactPerson || 'Not specified'}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedVendor.isActive, selectedVendor.ytdTotal || 0).color}`}>
                  {getStatusBadge(selectedVendor.isActive, selectedVendor.ytdTotal || 0).label}
                </span>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</label>
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {selectedVendor.email || 'Not specified'}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</label>
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  {selectedVendor.phone || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">Financial Summary</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">YTD Payments</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ${(selectedVendor.ytdTotal || 0).toLocaleString()}
                  </p>
                </div>
                <div className={`rounded-lg p-4 ${selectedVendor.ytdTotal > 600 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tax Status</p>
                  <p className={`text-lg font-bold ${selectedVendor.ytdTotal > 600 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {selectedVendor.ytdTotal > 600 ? '1099 Required' : 'No 1099 Required'}
                  </p>
                </div>
              </div>
            </div>

            {selectedVendor.address && (
              <div className="border-t pt-4">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">Address</label>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedVendor.address.street && <>{selectedVendor.address.street}<br /></>}
                    {selectedVendor.address.city && <>{selectedVendor.address.city}, </>}
                    {selectedVendor.address.state && <>{selectedVendor.address.state} </>}
                    {selectedVendor.address.zipCode && <>{selectedVendor.address.zipCode}<br /></>}
                    {selectedVendor.address.country && <>{selectedVendor.address.country}</>}
                  </p>
                </div>
              </div>
            )}

            {selectedVendor.notes && (
              <div className="border-t pt-4">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">Notes</label>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <p className="text-sm text-gray-900 dark:text-white">{selectedVendor.notes}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button 
                onClick={() => setIsModalOpen(false)} 
                variant="outline"
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Close
              </Button>
              <Link href={`/vendors/${selectedVendor._id}`}>
                <Button className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700">
                  View Full Details
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setVendorToDelete(null);
        }}
        title="Confirm Delete Vendor"
        size="md"
      >
        {vendorToDelete && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Delete Vendor</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${getVendorTypeColor(vendorToDelete.vendorType)} flex items-center justify-center`}>
                  {(() => {
                    const Icon = getVendorTypeIcon(vendorToDelete.vendorType);
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{vendorToDelete.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getVendorTypeLabel(vendorToDelete.vendorType)} • Tax ID: {vendorToDelete.taxId || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Important Notice
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {vendorToDelete.ytdTotal > 0 
                      ? `This vendor has $${vendorToDelete.ytdTotal.toLocaleString()} in YTD payments. Deleting may affect your financial records.`
                      : 'No payment history found for this vendor.'}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                    As an administrator, you can force delete this vendor. Consider marking as inactive instead.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setVendorToDelete(null);
                }}
                variant="outline"
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                variant="danger"
                disabled={deleting}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Vendor'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </LayoutWrapper>
  );
}