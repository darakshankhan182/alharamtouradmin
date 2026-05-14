'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { useAuth } from '@/context/AuthContext';
import { vendorsAPI } from '@/utils/api';
import { 
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Landmark,
  CreditCard,
  Banknote,
  FileText,
  Save,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Building,
  Briefcase,
  Shield,
  Car,
  Hotel,
  Plane,
  Package2,
  Tag,
  Eye,
  Trash2,
  Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function EditVendorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  
  const { token, loading: authLoading, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    vendorType: 'other',
    category: 'other', // ADDED: Default category
    VendorService: '',
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

  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Vendor type options
  const vendorTypeOptions = [
    { value: 'airline', label: 'Airline', icon: Plane, color: 'bg-blue-100 text-blue-800' },
    { value: 'hotel', label: 'Hotel', icon: Hotel, color: 'bg-purple-100 text-purple-800' },
    { value: 'transport', label: 'Transport', icon: Car, color: 'bg-emerald-100 text-emerald-800' },
    { value: 'visa', label: 'Visa Service', icon: FileText, color: 'bg-amber-100 text-amber-800' },
    { value: 'insurance', label: 'Insurance', icon: Shield, color: 'bg-rose-100 text-rose-800' },
    { value: 'tour', label: 'Tour Operator', icon: Briefcase, color: 'bg-indigo-100 text-indigo-800' },
    { value: 'other', label: 'Other', icon: Building, color: 'bg-gray-100 text-gray-800' }
  ];

  // Category options - Updated to match your backend enum
  const categoryOptions = [
    { value: 'hotel', label: 'Hotel', icon: Hotel, color: 'bg-purple-100 text-purple-800' },
    { value: 'flight', label: 'Flight', icon: Plane, color: 'bg-blue-100 text-blue-800' },
    { value: 'transportation', label: 'Transportation', icon: Car, color: 'bg-emerald-100 text-emerald-800' },
    { value: 'visa', label: 'Visa', icon: FileText, color: 'bg-amber-100 text-amber-800' },
    { value: 'insurance', label: 'Insurance', icon: Shield, color: 'bg-rose-100 text-rose-800' },
    { value: 'activities', label: 'Activities', icon: Briefcase, color: 'bg-indigo-100 text-indigo-800' },
    { value: 'food', label: 'Food', icon: Package2, color: 'bg-orange-100 text-orange-800' },
    { value: 'other', label: 'Other', icon: Building, color: 'bg-gray-100 text-gray-800' }
  ];

  // Payment terms options
  const paymentTermsOptions = [
    { value: 'net15', label: 'Net 15 Days' },
    { value: 'net30', label: 'Net 30 Days' },
    { value: 'net45', label: 'Net 45 Days' },
    { value: 'net60', label: 'Net 60 Days' },
    { value: 'prepaid', label: 'Prepaid' },
    { value: 'on_delivery', label: 'On Delivery' }
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/login');
      return;
    }
    fetchVendor();
  }, [authLoading, token, id]);

  const fetchVendor = async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      const data = await vendorsAPI.getById(id, token);
      
      // Handle response structure
      const vendorData = data.vendor || data;
      
      if (!vendorData) {
        throw new Error('Vendor not found');
      }
      
      setVendor(vendorData);
      
      // Set form data
      setFormData({
        name: vendorData.name,
        vendorType: vendorData.vendorType,
        VendorService: vendorData.VendorService || '',
        category: vendorData.category || 'other', // ADDED: Set category from backend
        contactPerson: vendorData.contactPerson || '',
        email: vendorData.email || '',
        phone: vendorData.phone || '',
        taxId: vendorData.taxId,
        address: vendorData.address || {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        },
        paymentTerms: vendorData.paymentTerms || 'net30',
        accountNumber: vendorData.accountNumber || '',
        routingNumber: vendorData.routingNumber || '',
        swiftCode: vendorData.swiftCode || '',
        notes: vendorData.notes || '',
        isActive: vendorData.isActive !== false
      });
      
    } catch (error) {
      console.error('Error fetching vendor:', error);
      toast.error(error.message || 'Failed to fetch vendor details');
      router.push('/vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let newValue = value;
    if (type === 'checkbox') {
      newValue = checked;
    }
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: newValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }
    
    // Check for changes
    setHasChanges(true);
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleVendorTypeSelect = (type) => {
    setFormData(prev => ({
      ...prev,
      vendorType: type
    }));
    setHasChanges(true);
    if (errors.vendorType) {
      setErrors(prev => ({ ...prev, vendorType: '' }));
    }
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({
      ...prev,
      category: category
    }));
    setHasChanges(true);
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.name.trim()) newErrors.name = 'Vendor name is required';
    if (!formData.taxId.trim()) newErrors.taxId = 'Tax ID is required';
    if (!formData.category) newErrors.category = 'Category is required';
     if (!formData.VendorService.trim()) newErrors.VendorService = 'Vendor service is required';
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation (basic)
    if (formData.phone && !/^[+]?[\d\s\-().]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    // Tax ID validation (basic US format)
    if (formData.taxId && !/^[\d\-]{9,}$/.test(formData.taxId.replace(/\s/g, ''))) {
      newErrors.taxId = 'Please enter a valid Tax ID (e.g., 12-3456789)';
    }
    
    // Category validation
    if (!categoryOptions.find(opt => opt.value === formData.category)) {
      newErrors.category = 'Please select a valid category';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepare update data
      const updateData = { ...formData };
      
      // Remove empty strings from address
      if (updateData.address) {
        Object.keys(updateData.address).forEach(key => {
          if (updateData.address[key] === '') {
            delete updateData.address[key];
          }
        });
      }
      
      // Remove empty optional fields
      if (!updateData.contactPerson) delete updateData.contactPerson;
      if (!updateData.email) delete updateData.email;
      if (!updateData.phone) delete updateData.phone;
      if (!updateData.accountNumber) delete updateData.accountNumber;
      if (!updateData.routingNumber) delete updateData.routingNumber;
      if (!updateData.swiftCode) delete updateData.swiftCode;
      if (!updateData.notes) delete updateData.notes;
      
      console.log('Updating vendor data:', updateData);
      
      const response = await vendorsAPI.update(id, updateData, token);
      
      if (response.success === false) {
        throw new Error(response.message || 'Failed to update vendor');
      }
      
      toast.success('Vendor updated successfully!');
      setHasChanges(false);
      
      // Redirect to vendor details page after successful update
      setTimeout(() => {
        router.push(`/vendors/${id}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error updating vendor:', error);
      
      if (error.message && error.message.includes('already exists')) {
        toast.error('A vendor with this name or tax ID already exists');
      } else if (error.message && error.message.includes('ValidationError')) {
        toast.error('Validation error. Please check your input.');
      } else if (error.message && error.message.includes('Access denied')) {
        toast.error('Access denied. You do not have permission to update this vendor.');
      } else {
        toast.error(error.message || 'Failed to update vendor. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (!vendor) return;
    
    setFormData({
      name: vendor.name,
      vendorType: vendor.vendorType,
      VendorService: vendorData.VendorService || '',
      category: vendor.category || 'other',
      contactPerson: vendor.contactPerson || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      taxId: vendor.taxId,
      address: vendor.address || {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: ''
      },
      paymentTerms: vendor.paymentTerms || 'net30',
      accountNumber: vendor.accountNumber || '',
      routingNumber: vendor.routingNumber || '',
      swiftCode: vendor.swiftCode || '',
      notes: vendor.notes || '',
      isActive: vendor.isActive !== false
    });
    
    setErrors({});
    setHasChanges(false);
    toast.success('Form reset to original values');
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
  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push(`/vendors/${id}`);
      }
    } else {
      router.push(`/vendors/${id}`);
    }
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

  // Show loading while checking auth or fetching vendor
  if (authLoading || loading) {
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

  const selectedVendorType = vendorTypeOptions.find(option => option.value === formData.vendorType);
  const selectedCategory = categoryOptions.find(option => option.value === formData.category);

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Vendor</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Update vendor information for {vendor.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link href={`/vendors/${id}`}>
              <Button variant="outline" className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Eye className="h-4 w-4" />
            
              </Button>
            </Link>
            
            <Button 
              onClick={handleReset}
              variant="outline"
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              disabled={!hasChanges || submitting}
            >
              <RefreshCw className="h-4 w-4" />
             
            </Button>
            
            {user?.role === 'admin' && (
              <Button
                onClick={() => setIsDeleteModalOpen(true)}
                variant="danger"
                className="hover:bg-rose-600 dark:hover:bg-rose-600"
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Vendor Information
            </h2>
            <div className="flex items-center mt-2 space-x-4">
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                vendorTypeOptions.find(opt => opt.value === vendor.vendorType)?.color || 'bg-gray-100 text-gray-800'
              }`}>
                {(() => {
                  const Icon = selectedVendorType?.icon || Building;
                  return <Icon className="h-4 w-4 mr-1.5" />;
                })()}
                {getVendorTypeLabel(vendor.vendorType)}
              </div>
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                categoryOptions.find(opt => opt.value === (vendor.category || 'other'))?.color || 'bg-gray-100 text-gray-800'
              }`}>
                {(() => {
                  const Icon = selectedCategory?.icon || Building;
                  return <Icon className="h-4 w-4 mr-1.5" />;
                })()}
                {getCategoryLabel(vendor.category || 'other')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Vendor ID: <span className="font-mono">{vendor._id.slice(-8)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-8">
              {/* Vendor Type Selection */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-primary-500" />
                  Vendor Type
                </h3>
                
                <div>
                  <label htmlFor="vendorType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vendor Type *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
                    {vendorTypeOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = formData.vendorType === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleVendorTypeSelect(option.value)}
                          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Icon className={`h-6 w-6 mb-2 ${
                            isSelected
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`} />
                          <span className={`text-xs font-medium ${
                            isSelected
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Hidden select for form submission */}
                  <select
                    id="vendorType"
                    name="vendorType"
                    value={formData.vendorType}
                    onChange={handleChange}
                    className="hidden"
                    required
                  >
                    {vendorTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  
                  {errors.vendorType && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.vendorType}</p>
                  )}
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-primary-500" />
                  Service Category *
                </h3>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 mb-4">
                    {categoryOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = formData.category === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleCategorySelect(option.value)}
                          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Icon className={`h-6 w-6 mb-2 ${
                            isSelected
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`} />
                          <span className={`text-xs font-medium ${
                            isSelected
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Hidden select for form submission */}
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="hidden"
                    required
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary-500" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Vendor Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vendor Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-2.5 rounded-lg border ${
                          errors.name 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                        placeholder="ABC Airlines Inc."
                        required
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div>
  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
    <Layers className="h-5 w-5 mr-2 text-primary-500" />
    Vendor Service *
  </h3>
  
  <div>
    <label htmlFor="VendorService" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Vendor Service
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Layers className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        id="VendorService"
        name="VendorService"
        value={formData.VendorService}
        onChange={handleChange}
        className={`pl-10 w-full px-4 py-2.5 rounded-lg border ${
          errors.VendorService 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
        placeholder="e.g., Flight Booking, Hotel Reservation, Transportation"
        required
      />
    </div>
    {errors.VendorService && (
      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.VendorService}</p>
    )}
  </div>
</div>

                  {/* Tax ID */}
                  <div>
                    <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tax ID / EIN *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Landmark className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="taxId"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-2.5 rounded-lg border ${
                          errors.taxId 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                        placeholder="12-3456789"
                        required
                      />
                    </div>
                    {errors.taxId && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.taxId}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Required for 1099 reporting if payments exceed $600
                    </p>
                  </div>

                  {/* Contact Person */}
                  <div>
                    <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Person
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="contactPerson"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* Payment Terms */}
                  <div>
                    <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Terms
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="paymentTerms"
                        name="paymentTerms"
                        value={formData.paymentTerms}
                        onChange={handleChange}
                        className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                      >
                        {paymentTermsOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-primary-500" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-2.5 rounded-lg border ${
                          errors.email 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                        placeholder="john@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-2.5 rounded-lg border ${
                          errors.phone 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary-500" />
                  Address Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Street Address */}
                  <div className="md:col-span-2">
                    <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Street Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="address.street"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleChange}
                        className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                        placeholder="123 Main St"
                      />
                    </div>
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
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
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
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
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
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
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
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Information */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Banknote className="h-5 w-5 mr-2 text-primary-500" />
                  Bank Information (Optional)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Account Number */}
                  <div>
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Banknote className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="accountNumber"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                        placeholder="Bank account number"
                      />
                    </div>
                  </div>

                  {/* Routing Number */}
                  <div>
                    <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Routing Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Banknote className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="routingNumber"
                        name="routingNumber"
                        value={formData.routingNumber}
                        onChange={handleChange}
                        className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                        placeholder="Bank routing number"
                      />
                    </div>
                  </div>

                  {/* SWIFT Code */}
                  <div>
                    <label htmlFor="swiftCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      SWIFT Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Banknote className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="swiftCode"
                        name="swiftCode"
                        value={formData.swiftCode}
                        onChange={handleChange}
                        className="pl-10 w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                        placeholder="International bank code"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary-500" />
                  Additional Information
                </h3>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="4"
                      className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 resize-none"
                      placeholder="Additional notes about this vendor..."
                      maxLength="1000"
                    />
                  </div>
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

              {/* Active Status */}
              <div className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
                />
                <div className="ml-3">
                  <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vendor is Active
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Inactive vendors won't appear in dropdowns but will remain in the system for historical records.
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    {hasChanges && (
                      <div className="flex items-center text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span className="font-medium">You have unsaved changes</span>
                      </div>
                    )}
                    {!hasChanges && (
                      <div className="flex items-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>All changes saved</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-1">Fields marked with * are required</p>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={submitting || !hasChanges}
                    className="bg-primary-600 flex hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Info className="h-4 w-4 mr-2 text-primary-500" />
            Quick Navigation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link href={`/vendors/${id}`}>
              <div className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all cursor-pointer group">
                <Eye className="h-5 w-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 mr-3" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    View Details
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    See complete vendor information
                  </div>
                </div>
              </div>
            </Link>
            
            {/* <Link href={`/vendors/${id}/payments`}>
              <div className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all cursor-pointer group">
                <Banknote className="h-5 w-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 mr-3" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    Payment History
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    View payment records
                  </div>
                </div>
              </div>
            </Link> */}
            
            <Link href="/vendors">
              <div className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all cursor-pointer group">
                <Building2 className="h-5 w-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 mr-3" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    All Vendors
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Back to vendors list
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
          
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Vendor Details:</p>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="text-left">Name:</div>
              <div className="text-right font-semibold text-gray-900 dark:text-white">{vendor?.name}</div>
              <div className="text-left">Service:</div>
              <div className="text-right">{vendor?.VendorService || 'N/A'}</div>
              <div className="text-left">Type:</div>
              <div className="text-right">{getVendorTypeLabel(vendor?.vendorType)}</div>
              <div className="text-left">Category:</div>
              <div className="text-right">{getCategoryLabel(vendor?.category || 'other')}</div>
              <div className="text-left">Tax ID:</div>
              <div className="text-right font-mono">{vendor?.taxId}</div>
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