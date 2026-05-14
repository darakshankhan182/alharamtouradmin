'use client';
// app/inquiries/[id]/page.jsx - UPDATED WITH ASSIGNEE MANAGEMENT

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { useAuth } from '@/context/AuthContext';
import { inquiriesAPI } from '@/utils/api';
import { 
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Phone,
  Users,
  MessageSquare,
  Clock,
  Edit,
  Trash2,
  Printer,
  Copy,
  Check,
  ChevronRight,
  FileText,
  Shield,
  Navigation,
  Save,
  X,
  Loader2,
  Globe,
  Search as SearchIcon,
  PhoneCall,
  Mail as MailIcon,
  Users as UsersRef,
  Building,
  TrendingUp,
  Info,
  MessageCircle,
  Send,
  RefreshCw,
  CalendarDays,
  Plus,
  DollarSign,
  FileInvoice,
  Building2,
  Tag,
  Percent,
  CreditCard,
  Receipt,
  Trash,
  Banknote,
  Wallet,
  Briefcase,
  Plane,
  Hotel,
  Car,
  FileCheck,
  File,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  ChevronDown,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

const getPaymentMethodLabel = (method) => {
  const methodMap = {
    'credit_card': 'Credit Card',
    'bank_transfer': 'Bank Transfer',
    'cash': 'Cash',
    'check': 'Check',
    'paypal': 'PayPal',
    'other': 'Other'
  };
  return methodMap[method] || method;
};

// SIMPLIFIED Comment Component
const Comment = ({ comment }) => {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffDays > 7) {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' })
        });
      } else if (diffDays > 0) {
        return `${diffDays}d ago`;
      } else if (diffHours > 0) {
        return `${diffHours}h ago`;
      } else if (diffMins > 0) {
        return `${diffMins}m ago`;
      }
      return 'Just now';
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              {comment?.user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {comment?.user?.username || 'Unknown User'}
                </span>
                {comment?.user?.role === 'admin' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                    Admin
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(comment?.createdAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
            {comment?.content || ''}
          </p>
        </div>
      </div>
    </div>
  );
};

// Vendor Cost Management Component (unchanged)
const VendorCostManagement = ({ inquiryId, token, existingFinancialData, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [financialData, setFinancialData] = useState(null);

  // Search state for vendor dropdowns
  const [vendorSearch, setVendorSearch] = useState({});
  const [showVendorDropdown, setShowVendorDropdown] = useState({});
  const [selectedVendorIndex, setSelectedVendorIndex] = useState({});

  // Refs for dropdown containers
  const dropdownRefs = useRef({});

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutside = Object.values(dropdownRefs.current).every(ref =>
        ref && !ref.contains(event.target)
      );
      if (isOutside) {
        setShowVendorDropdown({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cost breakdown state with payment method
  const [costBreakdown, setCostBreakdown] = useState([
    { 
      category: 'hotel', 
      description: '', 
      amount: '', 
      vendor: '', 
      paymentStatus: 'due',
      paymentMethod: 'credit_card'
    }
  ]);

  // Revenue state
  const [revenueData, setRevenueData] = useState({
    grossReceipts: '',
    merchantFees: '',
    paymentMethod: 'credit_card',
    paymentStatus: 'unpaid',
    paymentDate: '',
    serviceCompletionDate: ''
  });

  const vendorTypes = [
    { value: 'airline', label: 'Airline', icon: Plane },
    { value: 'hotel', label: 'Hotel', icon: Hotel },
    { value: 'transport', label: 'Transport', icon: Car },
    { value: 'visa', label: 'Visa Services', icon: FileCheck },
    { value: 'insurance', label: 'Insurance', icon: Briefcase },
    { value: 'tour', label: 'Tour Operator', icon: Building2 },
    { value: 'other', label: 'Other', icon: Building }
  ];

  const categoryOptions = [
    { value: 'hotel', label: 'Hotel', color: 'bg-blue-100 text-blue-800' },
    { value: 'flight', label: 'Flight', color: 'bg-purple-100 text-purple-800' },
    { value: 'transportation', label: 'Transportation', color: 'bg-green-100 text-green-800' },
    { value: 'visa', label: 'Visa', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'insurance', label: 'Insurance', color: 'bg-red-100 text-red-800' },
    { value: 'activities', label: 'Activities', color: 'bg-pink-100 text-pink-800' },
    { value: 'food', label: 'Food', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
  ];

  const paymentMethods = [
    { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Banknote },
    { value: 'cash', label: 'Cash', icon: Wallet },
    { value: 'check', label: 'Check', icon: Receipt },
    { value: 'paypal', label: 'PayPal', icon: DollarSign },
    { value: 'other', label: 'Other', icon: Briefcase }
  ];

  useEffect(() => {
    fetchVendorsAndData();
  }, [])

  const fetchVendorsAndData = async () => {
    try {
      setLoading(true);
      
      // Fetch vendors
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const vendorsRes = await fetch(`${baseUrl}api/vendors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vendorsData = await vendorsRes.json();
      
      if (vendorsData.success) {
        setVendors(vendorsData.vendors || []);
        
        // Extract unique categories from vendors
        const uniqueCategories = [...new Set((vendorsData.vendors || [])
          .filter(v => v?.category)
          .map(v => v.category))];
        setCategories(uniqueCategories);
      }

      // Fetch existing financial data
      console.log('Fetching existing financial data for inquiry:', inquiryId);
      
      const financialRes = await fetch(`${baseUrl}api/inquiries/${inquiryId}/booking-cost`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Financial response status:', financialRes.status);
      
      if (financialRes.ok) {
        const responseData = await financialRes.json();
        console.log('Financial data response:', responseData);
        
        // Extract the actual financial data - check different response structures
        let actualFinancialData = null;
        
        if (responseData.bookingCost) {
          actualFinancialData = responseData.bookingCost;
        } else if (responseData.financialData) {
          actualFinancialData = responseData.financialData;
        } else if (responseData._id || responseData.grossReceipts) {
          actualFinancialData = responseData;
        }
        
        if (actualFinancialData) {
          console.log('Setting financial data in modal:', actualFinancialData);
          setFinancialData(actualFinancialData);
          
          // Populate cost breakdown if exists
          if (actualFinancialData.costBreakdown && actualFinancialData.costBreakdown.length > 0) {
            const formattedBreakdown = actualFinancialData.costBreakdown.map(item => ({
              category: item?.category || 'other',
              description: item?.description || '',
              amount: item?.amount?.toString() || '',
              vendor: item?.vendor?._id || item?.vendor || '',
              paymentStatus: item?.paymentStatus || 'due',
              paymentMethod: item?.paymentMethod || 'credit_card'
            }));
            console.log('Setting cost breakdown:', formattedBreakdown);
            setCostBreakdown(formattedBreakdown);
          } else {
            // Initialize with default item if no breakdown exists
            console.log('No cost breakdown, setting default');
            setCostBreakdown([
              { 
                category: 'hotel', 
                description: '', 
                amount: '', 
                vendor: '', 
                paymentStatus: 'due',
                paymentMethod: 'credit_card'
              }
            ]);
          }
        
          // Populate revenue data
          const revenueDataToSet = {
            grossReceipts: actualFinancialData.grossReceipts?.toString() || '',
            merchantFees: actualFinancialData.merchantFees?.toString() || '',
            paymentMethod: actualFinancialData.paymentMethod || 'credit_card',
            paymentStatus: actualFinancialData.paymentStatus || 'unpaid',
            paymentDate: actualFinancialData.paymentDate ? new Date(actualFinancialData.paymentDate).toISOString().split('T')[0] : '',
            serviceCompletionDate: actualFinancialData.serviceCompletionDate ? new Date(actualFinancialData.serviceCompletionDate).toISOString().split('T')[0] : ''
          };
          console.log('Setting revenue data:', revenueDataToSet);
          setRevenueData(revenueDataToSet);
        } else {
          console.log('No financial data found, setting defaults');
          // Initialize with default data
          setRevenueData({
            grossReceipts: '',
            merchantFees: '',
            paymentMethod: 'credit_card',
            paymentStatus: 'unpaid',
            paymentDate: '',
            serviceCompletionDate: ''
          });
          setCostBreakdown([
            { 
              category: 'hotel', 
              description: '', 
              amount: '', 
              vendor: '', 
              paymentStatus: 'due',
              paymentMethod: 'credit_card'
            }
          ]);
        }
      } else if (financialRes.status === 404) {
        console.log('No financial data found (404), setting defaults');
        // Initialize with default data
        setRevenueData({
          grossReceipts: '',
          merchantFees: '',
          paymentMethod: 'credit_card',
          paymentStatus: 'unpaid',
          paymentDate: '',
          serviceCompletionDate: ''
        });
        setCostBreakdown([
          { 
            category: 'hotel', 
            description: '', 
            amount: '', 
            vendor: '', 
            paymentStatus: 'due',
            paymentMethod: 'credit_card'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load vendors and financial data');
      
      // Initialize with defaults on error
      setRevenueData({
        grossReceipts: '',
        merchantFees: '',
        paymentMethod: 'credit_card',
        paymentStatus: 'unpaid',
        paymentDate: '',
        serviceCompletionDate: ''
      });
      setCostBreakdown([
        { 
          category: 'hotel', 
          description: '', 
          amount: '', 
          vendor: '', 
          paymentStatus: 'due',
          paymentMethod: 'credit_card'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCostItem = () => {
    setCostBreakdown([
      ...costBreakdown,
      { 
        category: 'hotel', 
        description: '', 
        amount: '', 
        vendor: '', 
        paymentStatus: 'due',
        paymentMethod: 'credit_card'
      }
    ]);
  };

  const handleRemoveCostItem = (index) => {
    if (costBreakdown.length > 1) {
      const newCostBreakdown = [...costBreakdown];
      newCostBreakdown.splice(index, 1);
      setCostBreakdown(newCostBreakdown);
    }
  };

  const handleCostItemChange = (index, field, value) => {
    const newCostBreakdown = [...costBreakdown];
    newCostBreakdown[index] = {
      ...newCostBreakdown[index],
      [field]: value
    };
    setCostBreakdown(newCostBreakdown);
  };

  const handleRevenueChange = (field, value) => {
    setRevenueData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotals = () => {
    const totalCost = costBreakdown.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      return sum + amount;
    }, 0);
    
    const grossReceipts = parseFloat(revenueData.grossReceipts) || 0;
    const merchantFees = parseFloat(revenueData.merchantFees) || 0;
    const netProfit = grossReceipts - totalCost - merchantFees;
    const marginPercentage = grossReceipts > 0 ? (netProfit / grossReceipts) * 100 : 0;
    
    return { totalCost, netProfit, marginPercentage, grossReceipts, merchantFees };
  };

  const handleSubmit = async () => {
    // Validate revenue data
    if (!revenueData.grossReceipts || parseFloat(revenueData.grossReceipts) <= 0) {
      toast.error('Gross receipts must be greater than 0');
      return;
    }

    // Validate cost breakdown
    const invalidItems = costBreakdown.filter(item => 
      !item.amount || parseFloat(item.amount) <= 0
    );
    
    if (invalidItems.length > 0) {
      toast.error('All cost items must have a positive amount');
      return;
    }

    // Prepare data with payment method in cost breakdown
    const costBreakdownData = costBreakdown.map(item => ({
      category: item.category,
      description: item.description || `Cost item - ${item.category}`,
      amount: parseFloat(item.amount),
      vendor: item.vendor || undefined,
      paymentStatus: item.paymentStatus || 'due',
      paymentMethod: item.paymentMethod || 'credit_card',
      taxDeductible: true
    }));

    const bookingCostData = {
      grossReceipts: parseFloat(revenueData.grossReceipts),
      merchantFees: parseFloat(revenueData.merchantFees) || 0,
      paymentMethod: revenueData.paymentMethod,
      paymentStatus: revenueData.paymentStatus,
      paymentDate: revenueData.paymentDate || undefined,
      costBreakdown: costBreakdownData,
      serviceCompletionDate: revenueData.serviceCompletionDate || undefined
    };

    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      console.log('Submitting booking cost for inquiry:', inquiryId);
      console.log('Booking cost data:', bookingCostData);
      
      // Use the correct endpoint
      const url = `${baseUrl}api/inquiries/${inquiryId}/booking-cost`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingCostData)
      });

      const result = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Full response:', result);

      if (!response.ok) {
        // Check if it's a validation error
        if (result.errors && Array.isArray(result.errors)) {
          const errorMessages = result.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          throw new Error(`Validation error: ${errorMessages}`);
        }
        throw new Error(result.message || result.error || `Failed to save booking cost (Status: ${response.status})`);
      }

      if (!result.success) {
        throw new Error(result.message || 'Failed to save booking cost');
      }

      toast.success(financialData ? 'Booking cost updated!' : 'Booking cost created!');
      
      // Pass the result to onSuccess - ensure we're passing the full response
      onSuccess?.(result);
    } catch (error) {
      console.error('Error saving booking cost:', error);
      toast.error(error.message || 'Failed to save booking cost');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const { totalCost = 0, netProfit = 0, marginPercentage = 0, grossReceipts = 0, merchantFees = 0 } = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vendor Cost Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add vendors and costs for this booking
          </p>
        </div>
        <Button
          onClick={handleAddCostItem}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Cost Item
        </Button>
      </div>

      {loading ? (
       <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
        <p className="mt-2 text-gray-600">Loading vendor costs...</p>
      </div>
      ) : (
        <>
          {/* Revenue Section */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Revenue Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gross Receipts *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={revenueData.grossReceipts}
                    onChange={(e) => handleRevenueChange('grossReceipts', e.target.value)}
                    className="pl-8 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Merchant Fees
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={revenueData.merchantFees}
                    onChange={(e) => handleRevenueChange('merchantFees', e.target.value)}
                    className="pl-8 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={revenueData.paymentMethod}
                  onChange={(e) => handleRevenueChange('paymentMethod', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Status
                </label>
                <select
                  value={revenueData.paymentStatus}
                  onChange={(e) => handleRevenueChange('paymentStatus', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={revenueData.paymentDate}
                  onChange={(e) => handleRevenueChange('paymentDate', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service Completion Date
                </label>
                <input
                  type="date"
                  value={revenueData.serviceCompletionDate}
                  onChange={(e) => handleRevenueChange('serviceCompletionDate', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Cost Breakdown Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <File className="h-5 w-5 text-blue-600" />
              Cost Breakdown
            </h4>
            
            <div className="space-y-4">
              {costBreakdown.map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cost Item #{index + 1}
                    </span>
                    {costBreakdown.length > 1 && (
                      <button
                        onClick={() => handleRemoveCostItem(index)}
                        className="p-1 text-red-600 hover:text-red-700"
                        type="button"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category *
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => handleCostItemChange(index, 'category', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {categoryOptions.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Vendor Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Vendor
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search vendors..."
                          value={vendorSearch[index] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setVendorSearch(prev => ({
                              ...prev,
                              [index]: value
                            }));
                            setShowVendorDropdown(prev => ({
                              ...prev,
                              [index]: true
                            }));
                          }}
                          onFocus={() => setShowVendorDropdown(prev => ({ ...prev, [index]: true }))}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        {showVendorDropdown[index] && (
                          <div
                            ref={(el) => dropdownRefs.current[index] = el}
                            className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                          >
                            <div
                              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white"
                              onClick={() => {
                                handleCostItemChange(index, 'vendor', '');
                                setVendorSearch(prev => ({ ...prev, [index]: '' }));
                                setShowVendorDropdown(prev => ({ ...prev, [index]: false }));
                              }}
                            >
                              Clear selection
                            </div>
                            {vendors
                              .filter(vendor =>
                                !vendorSearch[index] ||
                                vendor?.name?.toLowerCase().includes(vendorSearch[index].toLowerCase()) ||
                                vendor?.vendorType?.toLowerCase().includes(vendorSearch[index].toLowerCase())
                              )
                              .map(vendor => {
                                const VendorIcon = vendorTypes.find(t => t.value === vendor?.vendorType)?.icon || Building;
                                return (
                                  <div
                                    key={vendor?._id}
                                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white flex items-center gap-2"
                                    onClick={() => {
                                      handleCostItemChange(index, 'vendor', vendor?._id);
                                      setVendorSearch(prev => ({
                                        ...prev,
                                        [index]: `${vendor?.name} (${vendor?.vendorType})`
                                      }));
                                      setShowVendorDropdown(prev => ({ ...prev, [index]: false }));
                                    }}
                                  >
                                    <VendorIcon className="h-4 w-4" />
                                    <span>{vendor?.name} ({vendor?.vendorType})</span>
                                  </div>
                                );
                              })}
                            {vendors.filter(vendor =>
                              !vendorSearch[index] ||
                              vendor?.name?.toLowerCase().includes(vendorSearch[index].toLowerCase()) ||
                              vendor?.vendorType?.toLowerCase().includes(vendorSearch[index].toLowerCase())
                            ).length === 0 && (
                              <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                                No vendors found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {item.vendor && (
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          Selected: {vendors.find(v => v._id === item.vendor)?.name || 'Unknown vendor'}
                        </div>
                      )}
                    </div>
                    
                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleCostItemChange(index, 'description', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., Hotel booking, Flight tickets, etc."
                      />
                    </div>
                    
                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.amount}
                          onChange={(e) => handleCostItemChange(index, 'amount', e.target.value)}
                          className="pl-8 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    {/* Payment Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Payment Status
                      </label>
                      <select
                        value={item.paymentStatus}
                        onChange={(e) => handleCostItemChange(index, 'paymentStatus', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="due">Due</option>
                        <option value="paid">Paid</option>
                        <option value="invoice_attached">Invoice Attached</option>
                      </select>
                    </div>

                    {/* Payment Method for Cost Item */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={item.paymentMethod || 'credit_card'}
                        onChange={(e) => handleCostItemChange(index, 'paymentMethod', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {paymentMethods.map(method => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Financial Summary
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">Revenue</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${grossReceipts.toFixed(2)}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Cost</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ${totalCost.toFixed(2)}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">Net Profit</div>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${netProfit.toFixed(2)}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">Margin</div>
                <div className={`text-2xl font-bold ${marginPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {marginPercentage.toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex justify-between py-1">
                <span>Merchant Fees:</span>
                <span>${merchantFees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Number of Cost Items:</span>
                <span>{costBreakdown.length}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-300 dark:border-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {financialData ? 'Update Booking Cost' : 'Create Booking Cost'}
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// Assignee Change Modal Component
const AssigneeChangeModal = ({ 
  isOpen, 
  onClose, 
  currentAssignee,
  inquiryId,
  token,
  onAssigneeChanged 
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [changingAssignee, setChangingAssignee] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen && token) {
      fetchUsers();
    }
  }, [isOpen, token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}api/users`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.users) {
          setUsers(data.users);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAssignee = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    if (selectedUserId === currentAssignee?._id) {
      toast.error('This user is already assigned');
      return;
    }

    try {
      setChangingAssignee(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${baseUrl}api/inquiries/${inquiryId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: selectedUserId })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `Failed to assign inquiry (Status: ${response.status})`);
      }

      if (!result.success) {
        throw new Error(result.message || 'Failed to assign inquiry');
      }

      toast.success('Assignee updated successfully!');
      onAssigneeChanged?.(result.updatedInquiry);
      onClose();
    } catch (error) {
      console.error('Error changing assignee:', error);
      toast.error(error.message || 'Failed to update assignee');
    } finally {
      setChangingAssignee(false);
    }
  };

  const handleUnassign = async () => {
    try {
      setChangingAssignee(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${baseUrl}api/inquiries/${inquiryId}/unassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `Failed to unassign inquiry (Status: ${response.status})`);
      }

      if (!result.success) {
        throw new Error(result.message || 'Failed to unassign inquiry');
      }

      toast.success('Inquiry unassigned successfully!');
      onAssigneeChanged?.(result.updatedInquiry);
      onClose();
    } catch (error) {
      console.error('Error unassigning inquiry:', error);
      toast.error(error.message || 'Failed to unassign inquiry');
    } finally {
      setChangingAssignee(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Assignee"
      size="md"
    >
      <div className="space-y-6">
        {/* Current Assignee Info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Assignee
          </h4>
          {currentAssignee ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {currentAssignee.username || currentAssignee.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {currentAssignee.email}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <UserX className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Unassigned
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  No user assigned to this inquiry
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Assignee Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select New Assignee
          </label>
          <div className="relative" ref={dropdownRef}>
            <div 
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer flex items-center justify-between hover:border-primary-500 transition-colors"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="flex items-center gap-2">
                {selectedUserId ? (
                  <>
                    <User className="h-4 w-4 text-gray-400" />
                    <span>
                      {users.find(u => u._id === selectedUserId)?.username || 'Select user...'}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">Select user...</span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </div>
            
            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {/* Search Bar */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                {/* Unassign Option */}
                <div
                  className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700"
                  onClick={() => {
                    setSelectedUserId('');
                    setShowDropdown(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <UserMinus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Unassign
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Remove current assignee
                      </div>
                    </div>
                  </div>
                </div>

                {/* Users List */}
                {loading ? (
                  <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    <div className="mt-2">Loading users...</div>
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <div
                      key={user._id}
                      className={`px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${user._id === selectedUserId ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                      onClick={() => {
                        setSelectedUserId(user._id);
                        setShowDropdown(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          user.role === 'admin' 
                            ? 'bg-primary-100 dark:bg-primary-900/30' 
                            : 'bg-emerald-100 dark:bg-emerald-900/30'
                        }`}>
                          {user.role === 'admin' ? (
                            <Shield className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          ) : (
                            <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {user.username}
                            </div>
                            {user.role === 'admin' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            disabled={changingAssignee}
          >
            Cancel
          </Button>
          
          {currentAssignee && (
            <Button
              onClick={handleUnassign}
              variant="outline"
              className="border-red-300 text-red-600 dark:border-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              disabled={changingAssignee}
            >
              {changingAssignee ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserX className="h-4 w-4 mr-2" />
              )}
              Unassign
            </Button>
          )}
          
          <Button
            onClick={handleChangeAssignee}
            disabled={!selectedUserId || changingAssignee}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {changingAssignee ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                {selectedUserId ? 'Change Assignee' : 'Select User'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default function InquiryDetailsPage() {
  const [inquiry, setInquiry] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [copiedItem, setCopiedItem] = useState({ type: null, value: null });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [financialData, setFinancialData] = useState(null);
  const [loadingFinancial, setLoadingFinancial] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    origin: '',
    destination: '',
    departureDate: '',
    packageDuration: '',
    adults: 1,
    children: 0,
    infants: 0,
    message: '',
    status: 'new',
    source: 'website',
    sourceDetails: '',
    isManual: false,
    inquiryDate: ''
  });

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  const { token, isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchInquiry();
    if (activeTab === 'comments') {
      fetchComments();
    }
  }, [authLoading, isAuthenticated, token, id]);

  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'financial' && inquiry?.status === 'converted') {
      console.log('Financial tab activated, fetching data...');
      fetchFinancialData();
    }
  }, [activeTab, inquiry?.status]);

  // Sync formData package duration to inquiry state for display
  useEffect(() => {
    if (formData.packageDuration || formData.durationType) {
      setInquiry(prev => ({
        ...prev,
        packageDuration: formData.packageDuration || prev?.packageDuration,
        durationType: formData.durationType || prev?.durationType
      }));
    }
  }, [formData.packageDuration, formData.durationType]);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        const parts = dateString.split(/[-/]/);
        if (parts.length === 3) {
          const isoDate = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
          if (!isNaN(isoDate.getTime())) return isoDate;
          
          if (parts[0].length === 4) {
            return new Date(dateString);
          }
        }
        return null;
      }
      
      return date;
    } catch (error) {
      console.error('Error parsing date:', error, dateString);
      return null;
    }
  };

  const fetchInquiry = async () => {
    if (!token || !id) return;
    try {
      setLoadingPage(true);
      const data = await inquiriesAPI.getById(id, token);
      
      console.log('Full inquiry data from API:', data);
      console.log('Assignee data:', data?.assignedTo);
      
      setInquiry(data || {});
      
      const inquiryDate = data?.inquiryDate ? parseDate(data.inquiryDate) : new Date(data?.createdAt || Date.now());
      const departureDate = data?.departureDate ? parseDate(data.departureDate) : null;
      
      setFormData({
        fullName: data?.fullName || '',
        email: data?.email || '',
        phoneNumber: data?.phoneNumber || '',
        origin: data?.origin || '',
        destination: data?.destination || '',
        departureDate: departureDate ? departureDate.toISOString().split('T')[0] : '',
        packageDuration: data?.packageDuration?.toString() || '',
        durationType: data?.durationType || 'days',
        adults: data?.adults || 1,
        children: data?.children || 0,
        infants: data?.infants || 0,
        message: data?.message || '',
        status: data?.status || 'new',
        source: data?.source || 'website',
        sourceDetails: data?.sourceDetails || '',
        isManual: data?.isManual || false,
        inquiryDate: inquiryDate.toISOString().split('T')[0]
      });

      // Fetch financial data if inquiry is converted
      if (data?.status === 'converted') {
        fetchFinancialData();
      }
    } catch (error) {
      console.error('Error fetching inquiry:', error);
      toast.error('Failed to fetch inquiry details');
      router.push('/inquiries');
    } finally {
      setLoadingPage(false);
    }
  };

  const fetchFinancialData = async () => {
    if (!token || !id) return;
    
    try {
      setLoadingFinancial(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      console.log('Fetching financial data for inquiry:', id);
      
      const response = await fetch(`${baseUrl}api/inquiries/${id}/booking-cost`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Financial data response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw financial data received:', data);
        
        // Check different possible response structures
        if (data && data.grossReceipts !== undefined) {
          // Direct financial data object
          console.log('Setting direct financial data:', data);
          setFinancialData(data);
        } else if (data && data.bookingCost) {
          // Nested under bookingCost
          console.log('Setting nested bookingCost data:', data.bookingCost);
          setFinancialData(data.bookingCost);
        } else if (data && data.financialData) {
          // Nested under financialData
          console.log('Setting nested financialData:', data.financialData);
          setFinancialData(data.financialData);
        } else if (data && !data.message) {
          // It might be the data directly
          console.log('Setting data directly:', data);
          setFinancialData(data);
        } else {
          console.log('No valid financial data found, setting to null');
          setFinancialData(null);
        }
      } else if (response.status === 404) {
        console.log('No financial data found (404)');
        setFinancialData(null);
      } else {
        console.error('Failed to fetch financial data:', response.status, response.statusText);
        setFinancialData(null);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setFinancialData(null);
    } finally {
      setLoadingFinancial(false);
    }
  };

  const fetchComments = useCallback(async (page = 1) => {
    if (!token || !id) return;
    
    try {
      setLoadingComments(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${baseUrl}api/comments/inquiry/${id}?page=${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data?.message || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        if (page === 1) {
          setComments(data.comments || []);
        } else {
          setComments(prev => [...prev, ...(data.comments || [])]);
        }
        setHasMoreComments(data.page < data.pages);
        setCommentPage(data.page);
      } else {
        throw new Error(data?.message || 'Failed to load comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error(error.message || 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  }, [token, id]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !token) return;
    
    setPostingComment(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${baseUrl}api/comments`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          inquiryId: id,
          content: newComment.trim()
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data?.message || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        setNewComment('');
        toast.success('Comment posted!');
        
        const newCommentWithUser = {
          ...data.comment,
          user: data.comment?.user || {
            _id: user?._id,
            username: user?.username,
            email: user?.email,
            role: user?.role
          }
        };
        
        setComments(prev => [newCommentWithUser, ...prev]);
        
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      } else {
        throw new Error(data?.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(error.message || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const handleLoadMoreComments = () => {
    fetchComments(commentPage + 1);
  };

  const handleCopy = (text, type) => {
    if (!text) {
      toast.error("Nothing to copy");
      return;
    }
    
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedItem({ type, value: text });
        toast.success("Copied!");
        setTimeout(() => setCopiedItem({ type: null, value: null }), 1500);
      })
      .catch(() => toast.error("Copy failed"));
  };

  const handleStatusChange = async (newStatus) => {
    if (!token || !inquiry) return;
    
    setUpdating(true);
    try {
      const data = await inquiriesAPI.updateStatus(id, newStatus, token);
      setInquiry(data?.inquiry || inquiry);
      
      // If status changed to converted, fetch financial data
      if (newStatus === 'converted') {
        fetchFinancialData();
      }
      
      toast.success(`Status updated to ${getStatusLabel(newStatus)}`);
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleManageVendors = () => {
    console.log('Opening vendor modal with existing data:', financialData);
    setIsVendorModalOpen(true);
  };

  const handleChangeAssignee = () => {
    setIsAssigneeModalOpen(true);
  };

  const handleAssigneeChanged = (updatedInquiry) => {
    if (updatedInquiry) {
      setInquiry(updatedInquiry);
      toast.success('Assignee updated successfully');
    }
  };

  const handleSaveEdit = async () => {
    if (!token || !id) return;
    
    try {
      setUpdating(true);
      
      const updateData = {
        ...formData,
        departureDate: formData.departureDate ? formData.departureDate : null,
        inquiryDate: formData.inquiryDate ? formData.inquiryDate : getTodayDate()
      };
      
      const data = await inquiriesAPI.update(id, updateData, token);
      setInquiry(data?.inquiry || inquiry);
      setIsEditModalOpen(false);
      toast.success('Inquiry updated successfully');
    } catch (error) {
      toast.error('Failed to update inquiry');
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this inquiry?")) return;
    
    if (user?.role !== 'admin') {
      toast.error('Only administrators can delete inquiries');
      return;
    }
    
    setDeleting(true);
    try {
      await inquiriesAPI.delete(id, token);
      toast.success("Inquiry deleted successfully");
      router.push("/inquiries");
    } catch (error) {
      console.error('Delete error:', error);
      
      if (error.message?.includes('Access denied') || error.message?.includes('Only administrators')) {
        toast.error('Access denied. Only administrators can delete inquiries.');
      } else if (error.message?.includes('Authentication required')) {
        toast.error('You are not authorized. Please login again.');
      } else {
        toast.error("Failed to delete inquiry");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = () => window.print();

  const formatDate = (dateInput) => {
    if (!dateInput) return 'Not specified';
    
    try {
      const date = parseDate(dateInput);
      
      if (!date) {
        return 'Not specified';
      }
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateInput);
      return 'Not specified';
    }
  };

  const formatTime = (dateInput) => {
    if (!dateInput) return '';
    
    try {
      const date = parseDate(dateInput);
      if (!date) {
        return '';
      }
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return '';
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'new': 'New Inquiry',
      'contacted': 'Contacted',
      'followup': 'Follow-up Required',
      'converted': 'Converted to Booking',
      'rejected': 'Rejected'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'new': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'contacted': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'followup': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'converted': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return colorMap[status] || colorMap['new'];
  };

  const getSourceLabel = (source) => {
    const sourceMap = {
      'website': 'Website Form',
      'google ads': 'Google Ads',
      'phone': 'Phone Call',
      'email': 'Email',
      'reference': 'Reference',
      'other': 'Other'
    };
    return sourceMap[source] || source;
  };

  const getSourceColor = (source) => {
    const colorMap = {
      'website': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'google ads': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'phone': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'email': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'reference': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return colorMap[source] || colorMap['website'];
  };

  const getSourceIcon = (source) => {
    const iconMap = {
      'website': Globe,
      'google ads': SearchIcon,
      'phone': PhoneCall,
      'email': MailIcon,
      'reference': UsersRef,
      'other': Building
    };
    return iconMap[source] || Globe;
  };

  const getTypeLabel = (isManual) => {
    return isManual ? 'Manual Entry' : 'Website Submission';
  };

  const getTypeColor = (isManual) => {
    return isManual 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  };

  const getTypeIcon = (isManual) => {
    return isManual ? Edit : Globe;
  };

  const getAssignmentBadge = (inquiry) => {
    if (!inquiry?.assignedTo) {
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

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'source' && value !== 'other') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        sourceDetails: ''
      }));
    } else if (name === 'packageDuration') {
      // Only allow numbers for package duration
      if (value === '' || /^\d*$/.test(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'adults' || name === 'children' || name === 'infants' 
          ? parseInt(value) || 0 
          : value
      }));
    }
  };

  const sourceOptions = [
    { value: 'website', label: 'Website Form' },
    { value: 'google ads', label: 'Google Ads' },
    { value: 'phone', label: 'Phone Call' },
    { value: 'email', label: 'Email' },
    { value: 'reference', label: 'Reference' },
    { value: 'other', label: 'Other' }
  ];

  const refreshComments = () => {
    fetchComments(1);
  };

  const handleVendorCostSuccess = (updatedFinancialData) => {
    console.log('Vendor cost success with data:', updatedFinancialData);
    
    // Extract the actual financial data - check different response structures
    let financialData = null;
    
    if (updatedFinancialData.bookingCost) {
      financialData = updatedFinancialData.bookingCost;
    } else if (updatedFinancialData.financialData) {
      financialData = updatedFinancialData.financialData;
    } else if (updatedFinancialData._id || updatedFinancialData.grossReceipts) {
      // It's already the financial data object
      financialData = updatedFinancialData;
    }
    
    console.log('Extracted financial data:', financialData);
    
    if (financialData) {
      // Update the financial data state
      setFinancialData(financialData);
      
      // If inquiry isn't converted yet, update its status
      if (inquiry && inquiry.status !== 'converted') {
        setInquiry({
          ...inquiry,
          status: 'converted'
        });
      }
      
      // Close the modal
      setIsVendorModalOpen(false);
      
      // Force refresh financial data from server to ensure we have latest
      fetchFinancialData();
      
      toast.success('Vendor costs saved successfully!');
    } else {
      console.error('Could not extract financial data from response:', updatedFinancialData);
      toast.error('Data saved but could not update display. Please refresh the page.');
    }
  };

  // Calculate financial summary if data exists
  const calculateFinancialSummary = () => {
    if (!financialData) return null;
    
    const totalCost = (financialData.costBreakdown || []).reduce((sum, item) => sum + (item?.amount || 0), 0);
    const grossReceipts = financialData.grossReceipts || 0;
    const merchantFees = financialData.merchantFees || 0;
    const netProfit = grossReceipts - totalCost - merchantFees;
    const marginPercentage = grossReceipts > 0 ? (netProfit / grossReceipts) * 100 : 0;
    
    return {
      totalCost,
      netProfit,
      marginPercentage,
      grossReceipts,
      merchantFees
    };
  };

  const financialSummary = calculateFinancialSummary();

  // Helper function to get package duration display
  const getPackageDurationDisplay = () => {
    const duration = inquiry?.packageDuration || formData.packageDuration;
    
    if (!duration) return null;
    
    return {
      value: duration,
      display: `${duration} days`,
    };
  };

  const packageDuration = getPackageDurationDisplay();

  if (authLoading || loadingPage) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mb-3"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading inquiry details...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (!inquiry) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Inquiry not found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The requested inquiry could not be found.</p>
          <Link href="/inquiries">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inquiries
            </Button>
          </Link>
        </div>
      </LayoutWrapper>
    );
  }

  const SourceIcon = getSourceIcon(inquiry.source);
  const TypeIcon = getTypeIcon(inquiry.isManual);
  const assignmentBadge = getAssignmentBadge(inquiry);
  const AssignmentIcon = assignmentBadge.icon;

  const isEmailCopied = copiedItem.type === 'email';
  const isPhoneCopied = copiedItem.type === 'phone';
  const isIdCopied = copiedItem.type === 'id';
  const isSourceCopied = copiedItem.type === 'source';

  const departureDate = parseDate(inquiry.departureDate);
  const hasDepartureDate = !!departureDate && !isNaN(departureDate.getTime());

  return (
    <LayoutWrapper>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/inquiries">
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Inquiry Details</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Detailed view of customer inquiry
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Change Assignee Button (admin only) */}
            {user?.role === 'admin' && (
              <Button
                onClick={handleChangeAssignee}
                variant="outline"
                size="sm"
                className="border-gray-300 dark:border-gray-600"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Change Assignee
              </Button>
            )}
            
            {/* Vendor Management Button (only for converted inquiries) */}
            {inquiry.status === 'converted' && (
              <Button
                onClick={handleManageVendors}
                variant="outline"
                size="sm"
                className="border-gray-300 flex dark:border-gray-600"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Vendors
              </Button>
            )}
            
            <Button
              onClick={() => {
                const text = `
Inquiry Details
---------------
Name: ${inquiry.fullName || 'N/A'}
Email: ${inquiry.email || 'N/A'}
Phone: ${inquiry.phoneNumber || 'N/A'}
Origin → Destination: ${inquiry.origin || 'N/A'} → ${inquiry.destination || 'N/A'}
Departure Date: ${hasDepartureDate ? formatDate(inquiry.departureDate) : 'Not specified'}
${packageDuration ? `Package Duration: ${packageDuration.display}` : ''}
Passengers: ${inquiry.adults || 0} adults, ${inquiry.children || 0} children, ${inquiry.infants || 0} infants
Status: ${getStatusLabel(inquiry.status)}
Type: ${getTypeLabel(inquiry.isManual)}
Source: ${getSourceLabel(inquiry.source)}${inquiry.source === 'other' && inquiry.sourceDetails ? ` (${inquiry.sourceDetails})` : ''}
Assignee: ${inquiry.assignedTo ? inquiry.assignedTo.username || inquiry.assignedTo.email : 'Unassigned'}
Inquiry Date: ${formatDate(inquiry.inquiryDate)}
Created Date: ${formatDate(inquiry.createdAt)}
Message: ${inquiry.message || 'No message provided'}
`.trim();
                handleCopy(text, 'all');
              }}
              variant="outline"
              size="sm"
              className="border-gray-300 dark:border-gray-600"
            >
              <Copy className="h-4 w-4" />
            </Button>

            <Button onClick={handlePrint} variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
              <Printer className="h-4 w-4" />
            </Button>

            <Button onClick={handleEdit} variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
              <Edit className="h-4 w-4" />
            </Button>

            {user?.role === 'admin' ? (
              <Button 
                onClick={handleDelete} 
                variant="danger" 
                size="sm" 
                disabled={deleting}
                className="hover:bg-rose-600 dark:hover:bg-rose-600"
              >
                {deleting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button 
                disabled
                title="Only administrators can delete inquiries"
                variant="danger" 
                size="sm"
                className="opacity-50 cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Details</span>
              </div>
            </button>
            {inquiry.status === 'converted' && (
              <button
                onClick={() => setActiveTab('financial')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'financial'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Financial</span>
                </div>
              </button>
            )}
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comments'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span>Comments</span>
                {comments.length > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                    {comments.length}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {activeTab === 'details' ? (
          <>
            {/* Status & Type Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${getStatusColor(inquiry.status)} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-semibold">Status</div>
                    <div className="text-lg font-bold">{getStatusLabel(inquiry.status)}</div>
                  </div>
                </div>
                {updating && (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
              </div>

              <div className={`p-4 rounded-lg ${getTypeColor(inquiry.isManual)} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <TypeIcon className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-semibold">Type</div>
                    <div className="text-lg font-bold">{getTypeLabel(inquiry.isManual)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Info Banner */}
            <div className={`p-4 rounded-lg ${assignmentBadge.color} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <AssignmentIcon className="h-5 w-5" />
                <div>
                  <div className="text-sm font-semibold">Assignee</div>
                  <div className="text-lg font-bold">{assignmentBadge.label}</div>
                  {inquiry.assignedTo && (
                    <div className="text-sm opacity-90 mt-1">
                      {inquiry.assignedTo.email}
                    </div>
                  )}
                </div>
              </div>
              {user?.role === 'admin' && (
                <Button
                  onClick={handleChangeAssignee}
                  size="sm"
                  variant="outline"
                  className={`${assignmentBadge.color.includes('green') ? 'border-green-300 text-green-700 hover:bg-green-50' : assignmentBadge.color.includes('blue') ? 'border-blue-300 text-blue-700 hover:bg-blue-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Change
                </Button>
              )}
            </div>

            {/* Quick Financial Summary for Converted Inquiries */}
            {inquiry.status === 'converted' && financialSummary && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Summary</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Revenue, costs, and profit</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleManageVendors}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Costs
                  </Button>
                </div>
                
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Revenue</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${(financialSummary.grossReceipts || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Cost</div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      ${(financialSummary.totalCost || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Net Profit</div>
                    <div className={`text-2xl font-bold ${(financialSummary.netProfit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      ${(financialSummary.netProfit || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Margin</div>
                    <div className={`text-2xl font-bold ${(financialSummary.marginPercentage || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {(financialSummary.marginPercentage || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Source Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                Source Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inquiry Source</p>
                    <button
                      onClick={() => handleCopy(inquiry.source, 'source')}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                    >
                      {isSourceCopied ? (
                        <>
                          <Check className="h-3 w-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-2 rounded-lg font-medium ${getSourceColor(inquiry.source)}`}>
                      <SourceIcon className="h-4 w-4 mr-2" />
                      {getSourceLabel(inquiry.source)}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Source Details</p>
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    {inquiry.source === 'other' && inquiry.sourceDetails ? (
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-900 dark:text-white">{inquiry.sourceDetails}</p>
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 italic">No additional details provided</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Customer Info */}
              <div className="lg:col-span-2 space-y-8">
                {/* Customer Information Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      Customer Information
                    </h2>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(inquiry.status)}`}>
                      {getStatusLabel(inquiry.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Full Name</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{inquiry.fullName || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</p>
                          <button
                            onClick={() => handleCopy(inquiry.email, 'email')}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                          >
                            {isEmailCopied ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 group">
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-gray-400" />
                            <a 
                              href={`mailto:${inquiry.email}`}
                              className="text-lg font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                            >
                              {inquiry.email || 'N/A'}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</p>
                          <button
                            onClick={() => handleCopy(inquiry.phoneNumber, 'phone')}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                          >
                            {isPhoneCopied ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <a 
                              href={`tel:${inquiry.phoneNumber}`}
                              className="text-lg font-semibold text-gray-900 dark:text-white hover:underline"
                            >
                              {inquiry.phoneNumber || 'N/A'}
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      {/* Departure Date Display */}
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Departure Date</p>
                        <div className="flex items-center gap-3">
                          <CalendarDays className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {hasDepartureDate ? formatDate(inquiry.departureDate) : 'Not specified'}
                            </p>
                            {hasDepartureDate && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatTime(inquiry.departureDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Inquiry Date</p>
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatDate(inquiry.inquiryDate)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatTime(inquiry.inquiryDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assignment Info */}
                  <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assignee</p>
                      {user?.role === 'admin' && (
                        <button
                          onClick={handleChangeAssignee}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                        >
                          <UserPlus className="h-3 w-3" />
                          Change
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <AssignmentIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {assignmentBadge.label}
                          </p>
                          {inquiry.assignedTo?.email && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {inquiry.assignedTo.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inquiry ID with Copy Button */}
                  <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inquiry ID</p>
                      <button
                        onClick={() => handleCopy(inquiry._id, 'id')}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                      >
                        {isIdCopied ? (
                          <>
                            <Check className="h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy ID
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-gray-400" />
                        <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                          {inquiry._id || 'N/A'}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Travel Details Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    Travel Details
                  </h2>
                  
                  <div className="space-y-8">
                    {/* Route Visualization */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 text-center">Travel Route</p>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">{inquiry.origin || 'N/A'}</div>
                          <p className="text-sm text-gray-500">Origin</p>
                        </div>
                        <div className="flex-1 px-6">
                          <div className="relative">
                            <div className="h-1 bg-gray-300 dark:bg-gray-600"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ChevronRight className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">{inquiry.destination || 'N/A'}</div>
                          <p className="text-sm text-gray-500">Destination</p>
                        </div>
                      </div>
                    </div>

                    {/* Departure Date Box */}
                    {hasDepartureDate && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">Scheduled Departure</p>
                        <div className="flex items-center justify-center gap-4">
                          <CalendarDays className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {formatDate(inquiry.departureDate)}
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                              {formatTime(inquiry.departureDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Package Duration Display */}
                    {packageDuration && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 mt-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">Package Duration</p>
                        <div className="flex items-center justify-center gap-4">
                          <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {packageDuration.display}
                            </p>
                            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                              {packageDuration.isNights ? 'Night stay' : 'Day package'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Passenger Stats */}
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Passenger Breakdown</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 text-center">
                          <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{inquiry.adults || 0}</p>
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-1">Adults</p>
                        </div>
                        
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 text-center">
                          <Users className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{inquiry.children || 0}</p>
                          <p className="text-sm font-medium text-green-700 dark:text-green-300 mt-1">Children</p>
                        </div>
                        
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 text-center">
                          <Users className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{inquiry.infants || 0}</p>
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mt-1">Infants</p>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Total Passengers: 
                          <span className="ml-2 text-xl font-bold text-primary-600 dark:text-primary-400">
                            {(inquiry.adults || 0) + (inquiry.children || 0) + (inquiry.infants || 0)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Card */}
                {inquiry.message && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      Customer Message
                    </h2>
                    
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5">
                      <div className="flex items-start">
                        <MessageSquare className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{inquiry.message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Actions & Metadata */}
              <div className="space-y-8">
                {/* Status & Actions Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status & Actions</h2>
                  
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Update Status</p>
                      <div className="space-y-2">
                        {['new', 'contacted', 'followup', 'converted', 'rejected'].map(status => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            disabled={updating || inquiry.status === status}
                            className={`w-full px-4 py-2.5 rounded-lg text-left transition-colors ${
                              inquiry.status === status
                                ? `${getStatusColor(status)} font-semibold`
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{getStatusLabel(status)}</span>
                              {inquiry.status === status && (
                                <Check className="h-4 w-4" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* User Role Indicator */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Your Permissions</p>
                      <div className="flex items-center gap-3">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                          user?.role === 'admin' 
                            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400' 
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          <Shield className="h-3.5 w-3.5 mr-1.5" />
                          {user?.role === 'admin' ? 'Administrator' : 'Regular User'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.role === 'admin' 
                            ? 'Full access to manage inquiries and assignees' 
                            : 'Limited permissions'}
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {user?.role === 'admin' && (
                      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Admin Actions</p>
                        <div className="space-y-2">
                          <Button
                            onClick={handleChangeAssignee}
                            variant="outline"
                            className="w-full border-blue-300 text-blue-600 dark:border-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Change Assignee
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inquiry Metadata */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metadata</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inquiry Type</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${getTypeColor(inquiry.isManual)}`}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {getTypeLabel(inquiry.isManual)}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Source</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${getSourceColor(inquiry.source)}`}>
                        <SourceIcon className="h-3 w-3 mr-1" />
                        {getSourceLabel(inquiry.source)}
                      </span>
                    </div>

                    {inquiry.source === 'other' && inquiry.sourceDetails && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Source Details</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{inquiry.sourceDetails}</p>
                      </div>
                    )}
                    
                    {/* Assignee Info */}
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assignee</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${assignmentBadge.color}`}>
                          <AssignmentIcon className="h-3 w-3 mr-1" />
                          {assignmentBadge.label}
                        </span>
                        {user?.role === 'admin' && (
                          <button
                            onClick={handleChangeAssignee}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                          >
                            Change
                          </button>
                        )}
                      </div>
                      {inquiry.assignedTo?.email && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {inquiry.assignedTo.email}
                        </p>
                      )}
                    </div>
                    
                    {/* Departure Date Display */}
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Departure Date</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {hasDepartureDate ? formatDate(inquiry.departureDate) : 'Not specified'}
                      </p>
                    </div>

                    {/* Package Duration in Metadata */}
                    {packageDuration && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Package Duration</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {packageDuration.display}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inquiry Date</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(inquiry.inquiryDate)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inquiry ID</p>
                      <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">{inquiry._id || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Submitted On</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(inquiry.createdAt)} at {formatTime(inquiry.createdAt)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(inquiry.updatedAt || inquiry.createdAt)} at {formatTime(inquiry.updatedAt || inquiry.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'financial' ? (
          /* Financial Tab (unchanged) */
          <div className="space-y-6">
            {/* ... (existing financial tab code) ... */}
          </div>
        ) : (
          /* Comments Tab (unchanged) */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* ... (existing comments tab code) ... */}
          </div>
        )}
      </div>

      {/* Edit Inquiry Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Inquiry"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Origin */}
            <div>
              <label htmlFor="origin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Origin *
              </label>
              <input
                type="text"
                id="origin"
                name="origin"
                value={formData.origin}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Destination */}
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destination *
              </label>
              <input
                type="text"
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Departure Date */}
            <div>
              <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Departure Date *
              </label>
              <input
                type="date"
                id="departureDate"
                name="departureDate"
                value={formData.departureDate}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                * Required field
              </p>
            </div>

            <div>
              <label htmlFor="packageDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Package Duration (Days)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="packageDuration"
                  name="packageDuration"
                  value={formData.packageDuration}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 7"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={3}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500">days</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optional: Length of package in days
              </p>
            </div>

            {/* Adults */}
            <div>
              <label htmlFor="adults" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adults *
              </label>
              <input
                type="number"
                id="adults"
                name="adults"
                min="1"
                value={formData.adults}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Children */}
            <div>
              <label htmlFor="children" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Children
              </label>
              <input
                type="number"
                id="children"
                name="children"
                min="0"
                value={formData.children}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Infants */}
            <div>
              <label htmlFor="infants" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Infants
              </label>
              <input
                type="number"
                id="infants"
                name="infants"
                min="0"
                value={formData.infants}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Inquiry Date */}
            <div>
              <label htmlFor="inquiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Inquiry Date *
              </label>
              <input
                type="date"
                id="inquiryDate"
                name="inquiryDate"
                value={formData.inquiryDate}
                onChange={handleFormChange}
                max={getTodayDate()}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Source */}
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source
              </label>
              <select
                id="source"
                name="source"
                value={formData.source}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {sourceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Details (when source is "other") */}
            {formData.source === 'other' && (
              <div className="md:col-span-2">
                <label htmlFor="sourceDetails" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Source Details *
                </label>
                <textarea
                  id="sourceDetails"
                  name="sourceDetails"
                  value={formData.sourceDetails}
                  onChange={handleFormChange}
                  rows="2"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Please provide details about the source"
                />
              </div>
            )}

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="followup">Follow-up</option>
                <option value="converted">Converted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Manual Entry */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isManual"
                name="isManual"
                checked={formData.isManual}
                onChange={handleFormChange}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
              />
              <label htmlFor="isManual" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Manual Entry
              </label>
            </div>

            {/* Message */}
            <div className="md:col-span-2">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleFormChange}
                rows="4"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Additional notes or requirements"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={() => setIsEditModalOpen(false)}
              variant="outline"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updating}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Vendor Cost Management Modal */}
      <Modal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        title={financialData ? "Edit Vendor Costs" : "Add Vendor Costs"}
        size="xl"
      >
        <VendorCostManagement
          inquiryId={id}
          token={token}
          existingFinancialData={financialData}
          onClose={() => setIsVendorModalOpen(false)}
          onSuccess={handleVendorCostSuccess}
        />
      </Modal>

      {/* Assignee Change Modal */}
      <AssigneeChangeModal
        isOpen={isAssigneeModalOpen}
        onClose={() => setIsAssigneeModalOpen(false)}
        currentAssignee={inquiry?.assignedTo}
        inquiryId={id}
        token={token}
        onAssigneeChanged={handleAssigneeChanged}
      />
    </LayoutWrapper>
  );
}

function getTimeSince(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  } catch (error) {
    return '';
  }
}