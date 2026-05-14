'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { useAuth } from '@/context/AuthContext';
import { vendorsAPI } from '@/utils/api';
import { 
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Printer,
  Copy,
  Check,
  ChevronRight,
  FileText,
  Shield,
  Edit,
  Save,
  X,
  Loader2,
  Building,
  TrendingUp,
  Info,
  RefreshCw,
  CalendarDays,
  CreditCard,
  DollarSign,
  Banknote,
  FileCheck,
  Building2,
  Briefcase,
  Shield as ShieldIcon,
  Hotel,
  Plane,
  Car,
  FileWarning,
  Receipt,
  PieChart,
  CheckSquare,
  AlertTriangle,
  Landmark,
  Wallet,
  Calculator,
  Building as BuildingIcon,
  FileText as FileTextIcon,
  PhoneCall,
  Mail as MailIcon,
  Globe,
  Eye,
  CreditCard as CreditCardIcon,
  Wallet as WalletIcon,
  Banknote as BanknoteIcon,
  Receipt as ReceiptIcon,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  Plus,
  Download,
  Eye as EyeIcon,
  ArrowUpRight,
  Users,
  Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function VendorDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  
  const { token, isAuthenticated, loading: authLoading, user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [copiedItem, setCopiedItem] = useState({ type: null, value: null });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [vendorCategories, setVendorCategories] = useState([]);
  const [vendorToDelete, setVendorToDelete] = useState(null);
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Payment tracking state
  const [paymentStats, setPaymentStats] = useState({
    totalPaid: 0,
    paymentCount: 0,
    ytdPayments: 0,
    pendingPayments: 0
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [hasFetchedPayments, setHasFetchedPayments] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    vendorType: 'other',
    category: 'other',
    contactPerson: '',
    email: '',
    phone: '',
    taxId: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    paymentTerms: 'net30',
    accountNumber: '',
    routingNumber: '',
    swiftCode: '',
    notes: '',
    isActive: true
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchVendor();
  }, [authLoading, isAuthenticated, token, id]);

  useEffect(() => {
    // Fetch payment data only when tab changes to payments AND hasn't been fetched yet
    if (activeTab === 'payments' && vendor && !hasFetchedPayments) {
      fetchPaymentData();
    }
  }, [activeTab, vendor]);

  const fetchVendor = async () => {
    if (!token || !id) return;
    try {
      setLoadingPage(true);
      const data = await vendorsAPI.getById(id, token);
      
      if (data.success === false) {
        throw new Error(data.message || 'Failed to fetch vendor');
      }
      
      const vendorData = data.vendor || data;
      
      const parsedVendor = {
        ...vendorData,
        ytdTotal: vendorData.ytdTotal || vendorData.ytdStats?.totalPaid || 0,
        ytdStats: vendorData.ytdStats || { totalPaid: 0, paymentCount: 0 },
        VendorService: vendorData.VendorService || '', // ADDED
        paymentHistory: vendorData.paymentHistory || [],
        requires1099: vendorData.requires1099 || (vendorData.ytdTotal > 600) || (vendorData.ytdStats?.totalPaid > 600),
        address: vendorData.address || {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        },
        category: vendorData.category || 'other'
      };
      
      setVendor(parsedVendor);
      
      setFormData({
        name: parsedVendor.name,
        vendorType: parsedVendor.vendorType,
        VendorService: parsedVendor.VendorService || '',
        category: parsedVendor.category,
        contactPerson: parsedVendor.contactPerson || '',
        email: parsedVendor.email || '',
        phone: parsedVendor.phone || '',
        taxId: parsedVendor.taxId,
        address: parsedVendor.address,
        paymentTerms: parsedVendor.paymentTerms || 'net30',
        accountNumber: parsedVendor.accountNumber || '',
        routingNumber: parsedVendor.routingNumber || '',
        swiftCode: parsedVendor.swiftCode || '',
        notes: parsedVendor.notes || '',
        isActive: parsedVendor.isActive !== false
      });
      
      fetchVendorCategories();
      
      // Calculate initial payment stats from vendor data
      calculatePaymentStats(parsedVendor);
      
    } catch (error) {
      console.error('Error fetching vendor:', error);
      toast.error(error.message || 'Failed to fetch vendor details');
      router.push('/vendors');
    } finally {
      setLoadingPage(false);
    }
  };

  const calculatePaymentStats = (vendorData) => {
    const totalPaid = vendorData.ytdTotal || vendorData.ytdStats?.totalPaid || 0;
    const paymentCount = vendorData.ytdStats?.paymentCount || vendorData.paymentHistory?.length || 0;
    
    // Calculate YTD payments (current year)
    const currentYear = new Date().getFullYear();
    const ytdPayments = vendorData.paymentHistory?.filter(p => {
      if (!p.paymentDate) return false;
      const paymentYear = new Date(p.paymentDate).getFullYear();
      return paymentYear === currentYear;
    }).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    
    // Calculate pending payments
    const pendingPayments = vendorData.paymentHistory?.filter(p => 
      p.paymentStatus === 'due' || p.paymentStatus === 'pending'
    ).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    
    setPaymentStats({
      totalPaid,
      paymentCount,
      ytdPayments,
      pendingPayments
    });
  };

const fetchPaymentData = async () => {
  if (!token || !id || !vendor) return;
  
  try {
    setLoadingPayments(true);
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    console.log('Fetching payment data for vendor:', id);
    
    // Try the regular endpoint first
    try {
      const response = await fetch(`${baseUrl}api/vendors/${id}/payments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Payments endpoint response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Payments data received:', data);
        
        if (data.success && data.payments) {
          setPaymentHistory(data.payments);
          setHasFetchedPayments(true);
          
          // Calculate stats
          const totalPaid = data.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
          const paymentCount = data.payments.length;
          const currentYear = new Date().getFullYear();
          
          const ytdPayments = data.payments.filter(p => {
            if (!p.paymentDate) return false;
            try {
              const paymentYear = new Date(p.paymentDate).getFullYear();
              return paymentYear === currentYear;
            } catch {
              return false;
            }
          }).reduce((sum, p) => sum + (p.amount || 0), 0);
          
          const pendingPayments = data.payments.filter(p => 
            p.paymentStatus === 'due' || p.paymentStatus === 'pending'
          ).reduce((sum, p) => sum + (p.amount || 0), 0);
          
          const updatedStats = {
            totalPaid,
            paymentCount,
            ytdPayments,
            pendingPayments
          };
          
          setPaymentStats(updatedStats);
          
          // Update vendor's ytdTotal
          if (vendor) {
            setVendor(prev => ({
              ...prev,
              ytdTotal: totalPaid,
              ytdStats: { totalPaid, paymentCount }
            }));
          }
          
          return updatedStats;
        }
      } else {
        const errorText = await response.text();
        console.error('Payments endpoint error:', errorText);
      }
    } catch (error) {
      console.error('Error fetching payments:', error.message);
    }
    
    // If we get here, use the vendor data we already have
    console.log('Using existing vendor data for payments');
    calculatePaymentStats(vendor);
    setPaymentHistory([]);
    setHasFetchedPayments(true);
    
    return paymentStats;
    
  } catch (error) {
    console.error('Error in fetchPaymentData:', error);
    toast.error('Failed to load payment information. Using available data.');
    
    // Fallback to vendor data
    if (vendor) {
      calculatePaymentStats(vendor);
    }
    return paymentStats;
  } finally {
    setLoadingPayments(false);
  }
};

  const fetchRecentInquiries = async (payments) => {
    if (!token || !id) return;
    
    try {
      setLoadingInquiries(true);
      
      // Extract unique inquiry IDs from payments
      const inquiryIds = [...new Set(payments
        .filter(p => p.inquiryId)
        .map(p => p.inquiryId))];
      
      if (inquiryIds.length === 0) {
        setRecentInquiries([]);
        return;
      }
      
      // Fetch inquiry details for each ID
      const inquiries = [];
      for (const inquiryId of inquiryIds.slice(0, 5)) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}api/inquiries/${inquiryId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data && !data.message) {
              inquiries.push(data);
            }
          }
        } catch (error) {
          console.error(`Error fetching inquiry ${inquiryId}:`, error);
        }
      }
      
      setRecentInquiries(inquiries);
      
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoadingInquiries(false);
    }
  };

  const fetchVendorCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/vendors/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVendorCategories(data.categories || []);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCopy = (text, type) => {
    if (!text) {
      toast.error('Nothing to copy');
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

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!token || !id) return;
    
    try {
      setUpdating(true);
      
      const updateData = { ...formData };
      
      if (updateData.address) {
        Object.keys(updateData.address).forEach(key => {
          if (updateData.address[key] === '') {
            delete updateData.address[key];
          }
        });
      }
      
      const response = await vendorsAPI.update(id, updateData, token);
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to update vendor');
      }
      
      setVendor(response.vendor);
      setIsEditModalOpen(false);
      toast.success('Vendor updated successfully');
      
      fetchVendor();
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast.error(error.message || 'Failed to update vendor');
    } finally {
      setUpdating(false);
    }
  };

const handleDelete = async () => {
  if (!vendor || !token) return;
  
  try {
    setDeleting(true);
    
    await vendorsAPI.delete(vendor._id, token);
    
    toast.success('Vendor deleted successfully');
    setIsDeleteModalOpen(false);
    
    // Redirect to vendors page
    setTimeout(() => {
      router.push('/vendors');
    }, 1000);
    
  } catch (error) {
    console.error('Delete error:', error);
    
    if (error.message.includes('Access denied')) {
      toast.error('Access denied. Only administrators can delete vendors.');
    } else if (error.message.includes('existing payments')) {
      toast.error('Cannot delete vendor with existing payments. Mark as inactive instead.');
    } else {
      toast.error(error.message || 'Failed to delete vendor');
    }
  } finally {
    setDeleting(false);
  }
};

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Vendor Details - ${vendor?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-bottom: 10px; }
            .info-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; margin: 10px 0; }
            .stat-label { color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>${vendor?.name} - Vendor Details</h1>
          
          <div class="section">
            <div class="label">Payment Statistics</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Paid</div>
                <div class="stat-value">${formatCurrency(paymentStats.totalPaid)}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Payment Count</div>
                <div class="stat-value">${paymentStats.paymentCount}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">YTD Payments</div>
                <div class="stat-value">${formatCurrency(paymentStats.ytdPayments)}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Pending Payments</div>
                <div class="stat-value">${formatCurrency(paymentStats.pendingPayments)}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="label">Vendor Information</div>
            <div class="value">Type: ${getVendorTypeLabel(vendor?.vendorType)}</div>
            <div class="value">Category: ${getCategoryLabel(vendor?.category || 'other')}</div>
            <div class="value">Tax ID: ${vendor?.taxId || 'N/A'}</div>
            <div class="value">Contact Person: ${vendor?.contactPerson || 'N/A'}</div>
            <div class="value">Email: ${vendor?.email || 'N/A'}</div>
            <div class="value">Phone: ${vendor?.phone || 'N/A'}</div>
            <div class="value">Status: ${getStatusLabel(vendor?.isActive)}</div>
            <div class="value">Payment Terms: ${getPaymentTermsLabel(vendor?.paymentTerms)}</div>
            <div class="value">Created: ${formatDate(vendor?.createdAt)}</div>
          </div>
          
          ${paymentHistory.length > 0 ? `
          <div class="section">
            <div class="label">Recent Payments</div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>From Inquiry</th>
                  <th>Customer</th>
                </tr>
              </thead>
              <tbody>
                ${paymentHistory.slice(0, 10).map(payment => `
                  <tr>
                    <td>${payment.paymentDate ? formatDate(payment.paymentDate) : 'N/A'}</td>
                    <td>${payment.description || 'Payment'}</td>
                    <td>${formatCurrency(payment.amount)}</td>
                    <td>${payment.paymentStatus || 'completed'}</td>
                    <td>${getPaymentMethodLabel(payment.paymentMethod || 'other')}</td>
                    <td>${payment.inquiryId ? `INQ-${payment.inquiryId.slice(-6)}` : 'N/A'}</td>
                    <td>${payment.customer?.fullName || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return '';
    }
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) amount = 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getVendorTypeIcon = (type) => {
    const typeIcons = {
      'airline': Plane,
      'hotel': Hotel,
      'transport': Car,
      'visa': FileCheck,
      'insurance': ShieldIcon,
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

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'hotel': Hotel,
      'flight': Plane,
      'transportation': Car,
      'visa': FileCheck,
      'insurance': ShieldIcon,
      'activities': Briefcase,
      'food': Briefcase,
      'other': Building
    };
    return categoryIcons[category] || Building;
  };

  const getCategoryLabel = (category) => {
    const categoryLabels = {
      'hotel': 'Hotel',
      'flight': 'Flight',
      'transportation': 'Transportation',
      'visa': 'Visa',
      'insurance': 'Insurance',
      'activities': 'Activities',
      'food': 'Food',
      'other': 'Other'
    };
    return categoryLabels[category] || category;
  };

  const getCategoryColor = (category) => {
    const categoryColors = {
      'hotel': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'flight': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'transportation': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      'visa': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      'insurance': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
      'activities': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      'food': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return categoryColors[category] || categoryColors['other'];
  };

  const getPaymentTermsLabel = (terms) => {
    const termsLabels = {
      'net15': 'Net 15 Days',
      'net30': 'Net 30 Days',
      'net45': 'Net 45 Days',
      'net60': 'Net 60 Days',
      'prepaid': 'Prepaid',
      'on_delivery': 'On Delivery'
    };
    return termsLabels[terms] || 'Net 30 Days';
  };

  const getStatusLabel = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const getPaymentStatusColor = (status) => {
    const statusColors = {
      'paid': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      'due': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      'pending': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'overdue': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return statusColors[status] || statusColors['pending'];
  };

  const getPaymentStatusIcon = (status) => {
    const statusIcons = {
      'paid': CheckCircle,
      'due': ClockIcon,
      'pending': AlertCircle,
      'overdue': AlertTriangle
    };
    return statusIcons[status] || AlertCircle;
  };

  const getPaymentMethodLabel = (method) => {
    const methodLabels = {
      'credit_card': 'Credit Card',
      'bank_transfer': 'Bank Transfer',
      'cash': 'Cash',
      'check': 'Check',
      'paypal': 'PayPal',
      'other': 'Other'
    };
    
    console.log('Processing payment method:', method);
    
    return methodLabels[method] || 'Other';
  };

  const getPaymentMethodIcon = (method) => {
    const methodIcons = {
      'credit_card': CreditCardIcon,
      'bank_transfer': BanknoteIcon,
      'cash': WalletIcon,
      'check': ReceiptIcon,
      'paypal': DollarSign,
      'other': DollarSign
    };
    return methodIcons[method] || DollarSign;
  };

  const getPaymentMethodColor = (method) => {
    const methodColors = {
      'credit_card': 'text-blue-600 dark:text-blue-400',
      'bank_transfer': 'text-green-600 dark:text-green-400',
      'cash': 'text-amber-600 dark:text-amber-400',
      'check': 'text-purple-600 dark:text-purple-400',
      'paypal': 'text-blue-500 dark:text-blue-300',
      'other': 'text-gray-600 dark:text-gray-400'
    };
    return methodColors[method] || 'text-gray-600 dark:text-gray-400';
  };
  
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const vendorTypeOptions = [
    { value: 'airline', label: 'Airline', icon: Plane },
    { value: 'hotel', label: 'Hotel', icon: Hotel },
    { value: 'transport', label: 'Transport', icon: Car },
    { value: 'visa', label: 'Visa Service', icon: FileCheck },
    { value: 'insurance', label: 'Insurance', icon: ShieldIcon },
    { value: 'tour', label: 'Tour Operator', icon: Briefcase },
    { value: 'other', label: 'Other', icon: Building }
  ];

  const categoryOptions = [
    { value: 'hotel', label: 'Hotel' },
    { value: 'flight', label: 'Flight' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'visa', label: 'Visa' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'activities', label: 'Activities' },
    { value: 'food', label: 'Food' },
    { value: 'other', label: 'Other' }
  ];

  const paymentTermsOptions = [
    { value: 'net15', label: 'Net 15 Days' },
    { value: 'net30', label: 'Net 30 Days' },
    { value: 'net45', label: 'Net 45 Days' },
    { value: 'net60', label: 'Net 60 Days' },
    { value: 'prepaid', label: 'Prepaid' },
    { value: 'on_delivery', label: 'On Delivery' }
  ];

  const refreshData = async () => {
    await fetchVendor();
    // Reset the fetched payments flag so it will fetch fresh data when switching tabs
    setHasFetchedPayments(false);
    if (activeTab === 'payments') {
      // Force refresh payment data
      setLoadingPayments(true);
      const updatedStats = await fetchPaymentData();
      // Update stats immediately
      if (updatedStats) {
        setPaymentStats(updatedStats);
      }
    }
  };

  const exportPaymentsCSV = () => {
    if (paymentHistory.length === 0) {
      toast.error('No payment data to export');
      return;
    }
    
    const csvData = paymentHistory.map(payment => [
      `"${formatDate(payment.paymentDate)}"`,
      `"${payment.description || 'Payment'}"`,
      payment.amount || 0,
      `"${payment.paymentStatus || 'completed'}"`,
      `"${getPaymentMethodLabel(payment.paymentMethod || 'other')}"`,
      `"${payment.invoiceNumber || 'N/A'}"`,
      `"${payment.inquiryId ? `INQ-${payment.inquiryId.toString().slice(-8)}` : 'N/A'}"`,
      `"${payment.customer?.fullName || 'N/A'}"`,
      `"${payment.customer?.email || 'N/A'}"`,
      `"${formatDate(payment.createdAt)}"`
    ].join(','));
    
    const headers = ['Date', 'Description', 'Amount', 'Status', 'Payment Method', 'Invoice Number', 'Inquiry ID', 'Customer Name', 'Customer Email', 'Created Date'];
    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `vendor_payments_${vendor?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV exported successfully');
  };

  const isEmailCopied = copiedItem.type === 'email';
  const isPhoneCopied = copiedItem.type === 'phone';
  const isTaxCopied = copiedItem.type === 'tax';
  const isAccountCopied = copiedItem.type === 'account';

  const requires1099 = vendor?.requires1099 || (vendor?.ytdTotal > 600) || (vendor?.ytdStats?.totalPaid > 600);

  if (authLoading || loadingPage) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mb-3"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading vendor details...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (!vendor) {
    return (
      <LayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Vendor not found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The requested vendor could not be found.</p>
          <Link href="/vendors">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vendors
            </Button>
          </Link>
        </div>
      </LayoutWrapper>
    );
  }

  const VendorTypeIcon = getVendorTypeIcon(vendor.vendorType);
  const CategoryIcon = getCategoryIcon(vendor.category);
  const typeColor = getVendorTypeColor(vendor.vendorType);
  const categoryColor = getCategoryColor(vendor.category);

  return (
    <LayoutWrapper>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/vendors">
              <Button variant="outline" size="sm" className="border-gray-300 dark:border-gray-600">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${typeColor}`}>
                <VendorTypeIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{vendor.name}</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {getVendorTypeLabel(vendor.vendorType)} • {getCategoryLabel(vendor.category)} • {vendor.contactPerson ? `Contact: ${vendor.contactPerson}` : 'No contact person'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                const text = `
Vendor Details
---------------
Name: ${vendor.name}
Type: ${getVendorTypeLabel(vendor.vendorType)}
Category: ${getCategoryLabel(vendor.category)}
Contact Person: ${vendor.contactPerson || 'N/A'}
Email: ${vendor.email || 'N/A'}
Phone: ${vendor.phone || 'N/A'}
Tax ID: ${vendor.taxId || 'N/A'}
Status: ${getStatusLabel(vendor.isActive)}
Total Paid: ${formatCurrency(paymentStats.totalPaid)}
Payment Count: ${paymentStats.paymentCount}
YTD Payments: ${formatCurrency(paymentStats.ytdPayments)}
Requires 1099: ${requires1099 ? 'Yes' : 'No'}
Payment Terms: ${getPaymentTermsLabel(vendor.paymentTerms)}
Created Date: ${formatDate(vendor.createdAt)}
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

            <Button 
              onClick={refreshData}
              variant="outline"
              size="sm"
              className="border-gray-300 dark:border-gray-600"
              disabled={loadingPayments}
            >
              <RefreshCw className={`h-4 w-4 ${loadingPayments ? 'animate-spin' : ''}`} />
            </Button>

             {user?.role === 'admin' ? (
              <Button 
                onClick={() => {
                  setVendorToDelete(vendor);
                  setIsDeleteModalOpen(true);
                }}
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
                title="Only administrators can delete vendors"
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
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Payment History</span>
                {paymentStats.paymentCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                    {paymentStats.paymentCount}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {activeTab === 'details' ? (
          <>
            {/* Payment Statistics Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Total Paid</div>
                    <div className="text-lg font-bold">{formatCurrency(paymentStats.totalPaid)}</div>
                  </div>
                  <DollarSign className="h-8 w-8 opacity-80" />
                </div>
                <div className="text-xs mt-2 opacity-90">
                  All-time payments
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Payment Count</div>
                    <div className="text-lg font-bold">{paymentStats.paymentCount}</div>
                  </div>
                  <CreditCardIcon className="h-8 w-8 opacity-80" />
                </div>
                <div className="text-xs mt-2 opacity-90">
                  Total transactions
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">YTD Payments</div>
                    <div className="text-lg font-bold">{formatCurrency(paymentStats.ytdPayments)}</div>
                  </div>
                  <Calendar className="h-8 w-8 opacity-80" />
                </div>
                <div className="text-xs mt-2 opacity-90">
                  This year's payments
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Pending</div>
                    <div className="text-lg font-bold">{formatCurrency(paymentStats.pendingPayments)}</div>
                  </div>
                  <ClockIcon className="h-8 w-8 opacity-80" />
                </div>
                <div className="text-xs mt-2 opacity-90">
                  Due payments
                </div>
              </div>
            </div>

            {/* Status & Type Banner */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className={`p-4 rounded-lg ${getStatusColor(vendor.isActive)} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-semibold">Status</div>
                    <div className="text-lg font-bold">{getStatusLabel(vendor.isActive)}</div>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${requires1099 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  {requires1099 ? <AlertTriangle className="h-5 w-5" /> : <CheckSquare className="h-5 w-5" />}
                  <div>
                    <div className="text-sm font-semibold">Tax Status</div>
                    <div className="text-lg font-bold">{requires1099 ? '1099 Required' : 'No 1099 Required'}</div>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${categoryColor} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <CategoryIcon className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-semibold">Category</div>
                    <div className="text-lg font-bold">{getCategoryLabel(vendor.category)}</div>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${typeColor} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <VendorTypeIcon className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-semibold">Type</div>
                    <div className="text-lg font-bold">{getVendorTypeLabel(vendor.vendorType)}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCardIcon className="h-5 w-5" />
                  <div>
                    <div className="text-sm font-semibold">Payment Terms</div>
                    <div className="text-lg font-bold">{getPaymentTermsLabel(vendor.paymentTerms)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Vendor Info */}
              <div className="lg:col-span-2 space-y-8">
                {/* Vendor Information Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      Vendor Information
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${typeColor}`}>
                        <VendorTypeIcon className="h-4 w-4 mr-1.5" />
                        {getVendorTypeLabel(vendor.vendorType)}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${categoryColor}`}>
                        <CategoryIcon className="h-4 w-4 mr-1.5" />
                        {getCategoryLabel(vendor.category)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Vendor Name</p>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${typeColor} flex items-center justify-center`}>
                            <VendorTypeIcon className="h-5 w-5" />
                          </div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{vendor.name}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Vendor Service</p>
                        <div className="flex items-center gap-3">
                          <Layers className="h-5 w-5 text-gray-400" />
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {vendor.VendorService || 'Not specified'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Service Category</p>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${categoryColor} flex items-center justify-center`}>
                            <CategoryIcon className="h-4 w-4" />
                          </div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{getCategoryLabel(vendor.category)}</p>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tax Identification Number</p>
                          {vendor.taxId && (
                            <button
                              onClick={() => handleCopy(vendor.taxId, 'tax')}
                              className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                            >
                              {isTaxCopied ? (
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
                          )}
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 group">
                          <div className="flex items-center gap-3">
                            <Landmark className="h-5 w-5 text-gray-400" />
                            <code className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
                              {vendor.taxId || 'Not provided'}
                            </code>
                          </div>
                        </div>
                        {requires1099 && (
                          <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Vendor requires Form 1099 (paid over $600 this year)
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Payment Terms</p>
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {getPaymentTermsLabel(vendor.paymentTerms)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Standard payment terms
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Contact Person</p>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-gray-400" />
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {vendor.contactPerson || 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Payment Summary</p>
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(paymentStats.totalPaid)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Payment Count</p>
                              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {paymentStats.paymentCount}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              Last updated: {formatDate(vendor.updatedAt || vendor.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vendor ID with Copy Button */}
                  <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor ID</p>
                      <button
                        onClick={() => handleCopy(vendor._id, 'id')}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                      >
                        {copiedItem.type === 'id' ? (
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
                        <code className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
                          {vendor._id}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    Contact Information
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Email Address</p>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-gray-400" />
                            {vendor.email ? (
                              <a 
                                href={`mailto:${vendor.email}`}
                                className="text-lg font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                              >
                                {vendor.email}
                              </a>
                            ) : (
                              <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                                Not provided
                              </p>
                            )}
                          </div>
                          {vendor.email && (
                            <button
                              onClick={() => handleCopy(vendor.email, 'email')}
                              className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                              title="Copy email"
                            >
                              {isEmailCopied ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Phone Number</p>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                            {vendor.phone ? (
                              <a 
                                href={`tel:${vendor.phone}`}
                                className="text-lg font-semibold text-gray-900 dark:text-white hover:underline"
                              >
                                {vendor.phone}
                              </a>
                            ) : (
                              <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                                Not provided
                              </p>
                            )}
                          </div>
                          {vendor.phone && (
                            <button
                              onClick={() => handleCopy(vendor.phone, 'phone')}
                              className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                              title="Copy phone"
                            >
                              {isPhoneCopied ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Information Card */}
                {vendor.address && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      Address Information
                    </h2>
                    
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
                      <div className="space-y-4">
                        {vendor.address.street && (
                          <div className="flex items-center">
                            <MapPin className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{vendor.address.street}</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {vendor.address.city && (
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">City</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">{vendor.address.city}</p>
                            </div>
                          )}
                          
                          {vendor.address.state && (
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">State/Province</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">{vendor.address.state}</p>
                            </div>
                          )}
                          
                          {vendor.address.zipCode && (
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ZIP/Postal Code</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">{vendor.address.zipCode}</p>
                            </div>
                          )}
                          
                          {vendor.address.country && (
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">{vendor.address.country}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Information Card */}
                {(vendor.accountNumber || vendor.routingNumber || vendor.swiftCode) && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      Bank Information
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {vendor.accountNumber && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Number</p>
                              <button
                                onClick={() => handleCopy(vendor.accountNumber, 'account')}
                                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                              >
                                {isAccountCopied ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                              <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                {vendor.accountNumber}
                              </code>
                            </div>
                          </div>
                        )}
                        
                        {vendor.routingNumber && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Routing Number</p>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                              <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                {vendor.routingNumber}
                              </code>
                            </div>
                          </div>
                        )}
                        
                        {vendor.swiftCode && (
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">SWIFT Code</p>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                              <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                {vendor.swiftCode}
                              </code>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes Card */}
                {vendor.notes && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FileTextIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      Additional Notes
                    </h2>
                    
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{vendor.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Metadata & Actions */}
              <div className="space-y-8">
                {/* Vendor Actions Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vendor Actions</h2>
                  
                  <div className="space-y-3">
                    <Link href={`/vendors/edit/${vendor._id}`}>
                      <Button variant="outline" className="w-full justify-start">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Vendor Details
                      </Button>
                    </Link>
                    
                    <Button 
                      onClick={() => setActiveTab('payments')}
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      View Payment History
                    </Button>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
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
                            ? 'Full access to delete vendors' 
                            : 'Delete permission restricted'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Statistics Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Statistics</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Paid</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(paymentStats.totalPaid)}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (paymentStats.totalPaid / 10000) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Count</p>
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {paymentStats.paymentCount}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (paymentStats.paymentCount / 50) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">YTD Payments</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(paymentStats.ytdPayments)}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (paymentStats.ytdPayments / 5000) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Payments</p>
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                          {formatCurrency(paymentStats.pendingPayments)}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-amber-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (paymentStats.pendingPayments / 2000) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vendor Metadata */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metadata</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor Type</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${typeColor}`}>
                        <VendorTypeIcon className="h-3 w-3 mr-1" />
                        {getVendorTypeLabel(vendor.vendorType)}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Service Category</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${categoryColor}`}>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {getCategoryLabel(vendor.category)}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Terms</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {getPaymentTermsLabel(vendor.paymentTerms)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${getStatusColor(vendor.isActive)}`}>
                        {getStatusLabel(vendor.isActive)}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tax Status</p>
                      <p className={`text-sm font-medium ${requires1099 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {requires1099 ? '1099 Form Required' : 'No 1099 Required'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendor ID</p>
                      <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">{vendor._id}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created On</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(vendor.createdAt)} at {formatTime(vendor.createdAt)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(vendor.updatedAt || vendor.createdAt)} at {formatTime(vendor.updatedAt || vendor.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Payment History Tab */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  Payment History & Tracking
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Track all payments made to {vendor.name}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={exportPaymentsCSV}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 dark:border-gray-600"
                  disabled={paymentHistory.length === 0}
                >
                  <Download className="h-4 w-4" />
                  
                </Button>
                <button
                  onClick={fetchPaymentData}
                  disabled={loadingPayments}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Refresh payments"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingPayments ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingPayments ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Loading payment history...</p>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No payments found</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    No payment history available for this vendor
                  </p>
                  <div className="mt-6">
                    <Link href="/inquiries">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Inquiry with this Vendor
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Payment Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold mb-1">Total Paid</p>
                          <p className="text-2xl font-bold">{formatCurrency(paymentStats.totalPaid)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 opacity-80" />
                      </div>
                      <div className="text-xs mt-2 opacity-90">
                        All-time payments to this vendor
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold mb-1">Payment Count</p>
                          <p className="text-2xl font-bold">{paymentStats.paymentCount}</p>
                        </div>
                        <CreditCardIcon className="h-8 w-8 opacity-80" />
                      </div>
                      <div className="text-xs mt-2 opacity-90">
                        Total transactions
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold mb-1">YTD Payments</p>
                          <p className="text-2xl font-bold">{formatCurrency(paymentStats.ytdPayments)}</p>
                        </div>
                        <Calendar className="h-8 w-8 opacity-80" />
                      </div>
                      <div className="text-xs mt-2 opacity-90">
                        This year's payments
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold mb-1">Pending</p>
                          <p className="text-2xl font-bold">{formatCurrency(paymentStats.pendingPayments)}</p>
                        </div>
                        <ClockIcon className="h-8 w-8 opacity-80" />
                      </div>
                      <div className="text-xs mt-2 opacity-90">
                        Due payments
                      </div>
                    </div>
                  </div>

                  {/* Recent Inquiries (if available) */}
                  {recentInquiries.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Recent Inquiries with this Vendor
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {recentInquiries.map((inquiry, index) => (
                          <Link 
                            key={inquiry._id} 
                            href={`/inquiries/${inquiry._id}`}
                            className="block"
                          >
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {inquiry.fullName || `Inquiry #${inquiry._id.slice(-6)}`}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {inquiry.origin} → {inquiry.destination}
                                  </p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-gray-400" />
                              </div>
                              {inquiry.departureDate && (
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  <CalendarDays className="h-3 w-3 mr-1" />
                                  {formatDate(inquiry.departureDate)}
                                </div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payments Table */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Records</h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {paymentHistory.length} payment{paymentHistory.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            {/* <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Date
                            </th> */}
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Method
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Inquiry
                            </th>
                            {/* <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Invoice
                            </th> */}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                          {paymentHistory.map((payment) => {
                            const StatusIcon = getPaymentStatusIcon(payment.paymentStatus);
                            const statusColor = getPaymentStatusColor(payment.paymentStatus);
                            const PaymentMethodIcon = getPaymentMethodIcon(payment.paymentMethod || 'other');
                            const paymentMethodColor = getPaymentMethodColor(payment.paymentMethod || 'other');
                            
                            return (
                              <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                {/* <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 dark:text-white">
                                    {payment.paymentDate ? formatDate(payment.paymentDate) : 'N/A'}
                                  </div>
                                  {payment.paymentDate && (
                                    <div className="text-xs text-gray-500">
                                      {formatTime(payment.paymentDate)}
                                    </div>
                                  )}
                                </td> */}
                                
                                <td className="px-4 py-3">
                                  <div className="text-sm text-gray-900 dark:text-white">
                                    {payment.description || 'Payment'}
                                  </div>
                                  {payment.category && (
                                    <div className="text-xs text-gray-500">
                                      {getCategoryLabel(payment.category)}
                                    </div>
                                  )}
                                </td>
                                
                                <td className="px-4 py-3">
                                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {formatCurrency(payment.amount)}
                                  </div>
                                </td>
                                
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {payment.paymentStatus === 'paid' ? 'Paid' : 
                                    payment.paymentStatus === 'due' ? 'Due' : 
                                    payment.paymentStatus === 'pending' ? 'Pending' : 
                                    payment.paymentStatus === 'overdue' ? 'Overdue' : 'Processing'}
                                  </span>
                                </td>
                                
                                {/* Method Column */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <PaymentMethodIcon className={`h-4 w-4 ${paymentMethodColor}`} />
                                    <span className="text-sm text-gray-900 dark:text-white">
                                      {getPaymentMethodLabel(payment.paymentMethod || 'other')}
                                    </span>
                                  </div>
                                </td>
                                
                                {/* Inquiry Column */}
                                <td className="px-4 py-3">
                                  {payment.inquiryId ? (
                                    <Link 
                                      href={`/inquiries/${payment.inquiryId}`}
                                      className="inline-flex items-center text-sm text-primary-600 dark:text-primary-400 hover:underline"
                                    >
                                      <EyeIcon className="h-4 w-4 mr-1" />
                                      View Inquiry
                                    </Link>
                                  ) : (
                                    <span className="text-xs text-gray-500">N/A</span>
                                  )}
                                </td>
                                
                                {/* Customer Column - NEW */}
                                {/* <td className="px-4 py-3">
                                  {payment.customer ? (
                                    <div>
                                      <div className="flex items-center gap-1 mb-1">
                                        <User className="h-3 w-3 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                          {payment.customer.fullName || 'N/A'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Mail className="h-3 w-3 text-gray-400" />
                                        <a 
                                          href={`mailto:${payment.customer.email}`}
                                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline truncate max-w-[120px]"
                                          title={payment.customer.email}
                                        >
                                          {payment.customer.email || 'N/A'}
                                        </a>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-500">N/A</span>
                                  )}
                                </td> */}
                                
                                {/* Invoice Column */}
                                {/* <td className="px-4 py-3">
                                  {payment.invoiceNumber ? (
                                    <div className="text-sm text-gray-900 dark:text-white">
                                      #{payment.invoiceNumber}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-500">No invoice</span>
                                  )}
                                </td> */}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Payment Summary Footer */}
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(paymentStats.totalPaid)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Payments</p>
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {paymentHistory.filter(p => p.paymentStatus === 'paid').length}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Outstanding Balance</p>
                          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {formatCurrency(paymentStats.pendingPayments)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Payment Methods Summary */}
                      {paymentHistory.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Payment Methods Used</h4>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(new Set(paymentHistory.map(p => p.paymentMethod || 'other'))).map(method => {
                              const methodCount = paymentHistory.filter(p => (p.paymentMethod || 'other') === method).length;
                              const methodTotal = paymentHistory
                                .filter(p => (p.paymentMethod || 'other') === method)
                                .reduce((sum, p) => sum + (p.amount || 0), 0);
                              const PaymentMethodIcon = getPaymentMethodIcon(method);
                              const paymentMethodColor = getPaymentMethodColor(method);
                              
                              return (
                                <div key={method} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <PaymentMethodIcon className={`h-4 w-4 ${paymentMethodColor}`} />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {getPaymentMethodLabel(method)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {methodCount} payments • {formatCurrency(methodTotal)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Vendor Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Vendor"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vendor Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vendor Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Vendor Type */}
            <div>
              <label htmlFor="vendorType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vendor Type *
              </label>
              <select
                id="vendorType"
                name="vendorType"
                value={formData.vendorType}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {vendorTypeOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tax ID */}
            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tax ID / EIN *
              </label>
              <input
                type="text"
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="12-3456789"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Required for 1099 reporting if payments exceed $600
              </p>
            </div>

            {/* Contact Person */}
            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Person
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Payment Terms */}
            <div>
              <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Terms
              </label>
              <select
                id="paymentTerms"
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {paymentTermsOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Street Address */}
            <div className="md:col-span-2">
              <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Street Address
              </label>
              <input
                type="text"
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="123 Main St"
              />
            </div>

            {/* City */}
            <div>
              <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="New York"
              />
            </div>

            {/* State */}
            <div>
              <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State / Province
              </label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="NY"
              />
            </div>

            {/* ZIP Code */}
            <div>
              <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ZIP / Postal Code
              </label>
              <input
                type="text"
                id="address.zipCode"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="10001"
              />
            </div>

            {/* Country */}
            <div>
              <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country
              </label>
              <input
                type="text"
                id="address.country"
                name="address.country"
                value={formData.address.country}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="United States"
              />
            </div>

            {/* Account Number */}
            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Number
              </label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Bank account number"
              />
            </div>

            {/* Routing Number */}
            <div>
              <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Routing Number
              </label>
              <input
                type="text"
                id="routingNumber"
                name="routingNumber"
                value={formData.routingNumber}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Bank routing number"
              />
            </div>

            {/* SWIFT Code */}
            <div>
              <label htmlFor="swiftCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SWIFT Code
              </label>
              <input
                type="text"
                id="swiftCode"
                name="swiftCode"
                value={formData.swiftCode}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="International bank code"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center md:col-span-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleFormChange}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Vendor is Active
              </label>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                rows="4"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Additional notes about this vendor..."
                maxLength="1000"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Optional - Maximum 1000 characters
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.notes.length}/1000
                </p>
              </div>
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
      <Modal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  title="Delete Vendor"
  size="md"
>
  <div className="space-y-6">
    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto">
      <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
    </div>
    
    <div className="text-center">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Delete {vendor?.name}?
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        This action cannot be undone. All vendor information will be permanently deleted from the system.
      </p>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>Warning:</strong> If this vendor has existing payments, deletion will be blocked. Consider marking as inactive instead.
          </div>
        </div>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      <Button
        onClick={() => setIsDeleteModalOpen(false)}
        variant="outline"
        className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        disabled={deleting}
      >
        Cancel
      </Button>
      <Button
        onClick={handleDelete}
        variant="danger"
        className="hover:bg-rose-600 dark:hover:bg-rose-600"
        disabled={deleting}
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
</Modal>
    </LayoutWrapper>
  );
}