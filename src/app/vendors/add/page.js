'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper';
import { useAuth } from '@/context/AuthContext';
import { vendorsAPI } from '@/utils/api';
import toast from 'react-hot-toast';
import { 
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Landmark,
  CreditCard,
  Banknote,
  FileText,
  ArrowLeft,
  Save,
  RefreshCw,
  Info,
  CheckCircle,
  AlertCircle,
  Building,
  Briefcase,
  Shield,
  Car,
  Hotel,
  Plane,
  Package2,
  CheckSquare,
  Tag,
  Layers
} from 'lucide-react';

export default function AddVendorPage() {
  const router = useRouter();
  const { token, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

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

  // Vendor type options
  const vendorTypeOptions = [
    { value: 'airline', label: 'Airline', icon: Plane, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'hotel', label: 'Hotel', icon: Hotel, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    { value: 'transport', label: 'Transport', icon: Car, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { value: 'visa', label: 'Visa Service', icon: FileText, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
    { value: 'insurance', label: 'Insurance', icon: Shield, color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' },
    { value: 'tour', label: 'Tour Operator', icon: Briefcase, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { value: 'other', label: 'Other', icon: Building, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
  ];

  // Category options - Updated to match your backend enum
  const categoryOptions = [
    { value: 'hotel', label: 'Hotel', icon: Hotel, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    { value: 'flight', label: 'Flight', icon: Plane, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'transportation', label: 'Transportation', icon: Car, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { value: 'visa', label: 'Visa', icon: FileText, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
    { value: 'insurance', label: 'Insurance', icon: Shield, color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' },
    { value: 'activities', label: 'Activities', icon: Briefcase, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { value: 'food', label: 'Food', icon: Package2, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    { value: 'other', label: 'Other', icon: Building, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
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

  const handleChange = (e) => {
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
    
    if (errors.vendorType) {
      setErrors(prev => ({ ...prev, vendorType: '' }));
    }
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({
      ...prev,
      category: category
    }));
    
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
      const vendorData = {
        name: formData.name,
        vendorType: formData.vendorType,
        category: formData.category, // ADDED: Category field
        VendorService: formData.VendorService, // ADDED: VendorService field
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        taxId: formData.taxId,
        address: formData.address,
        paymentTerms: formData.paymentTerms,
        accountNumber: formData.accountNumber,
        routingNumber: formData.routingNumber,
        swiftCode: formData.swiftCode,
        notes: formData.notes,
        isActive: formData.isActive
      };
      
      console.log('Submitting vendor data:', vendorData);
      
      const response = await vendorsAPI.create(vendorData, token);
      
      toast.success('Vendor created successfully!');
      
      // Redirect to vendors page after successful creation
      setTimeout(() => {
        router.push('/vendors');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating vendor:', error);
      
      if (error.message && error.message.includes('already exists')) {
        toast.error('A vendor with this name or tax ID already exists');
      } else if (error.errors) {
        const errorMessages = Object.values(error.errors).map(err => err.message);
        toast.error(errorMessages.join(', '));
      } else {
        toast.error(error.message || 'Failed to create vendor. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      vendorType: 'other',
      VendorService: '', 
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
    setErrors({});
    toast.success('Form cleared!');
  };

  // Get selected vendor type icon and label
  const selectedVendorType = vendorTypeOptions.find(option => option.value === formData.vendorType);
  const selectedCategory = categoryOptions.find(option => option.value === formData.category);

  // Show loading while checking auth
  if (loading) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-primary-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Vendor</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Register a new supplier or service provider
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Vendor Registration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Enter vendor details for accounting and payment tracking
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Vendor Type Selection */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-primary-500" />
                  Vendor Type
                </h3>
                
                <div>
                  <label htmlFor="vendorType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Vendor Type *
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
                              ? `${option.color.replace('bg-', 'border-')} border-2 bg-white dark:bg-gray-800`
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <Icon className={`h-6 w-6 mb-2 ${
                            isSelected
                              ? option.color.replace('bg-', 'text-').split(' ')[0]
                              : 'text-gray-400 dark:text-gray-500'
                          }`} />
                          <span className={`text-xs font-medium ${
                            isSelected
                              ? 'text-gray-900 dark:text-white'
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
                  
                  {/* Selected Vendor Type Display */}
                  {selectedVendorType && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <span>Selected type:</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${selectedVendorType.color}`}>
                        {(() => {
                          const Icon = selectedVendorType.icon;
                          return <Icon className="h-4 w-4 mr-1" />;
                        })()}
                        {selectedVendorType.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-primary-500" />
                  Service Category
                </h3>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Category *
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
                              ? `${option.color.replace('bg-', 'border-')} border-2 bg-white dark:bg-gray-800`
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <Icon className={`h-6 w-6 mb-2 ${
                            isSelected
                              ? option.color.replace('bg-', 'text-').split(' ')[0]
                              : 'text-gray-400 dark:text-gray-500'
                          }`} />
                          <span className={`text-xs font-medium ${
                            isSelected
                              ? 'text-gray-900 dark:text-white'
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
                  
                  {/* Selected Category Display */}
                  {selectedCategory && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <span>Selected category:</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${selectedCategory.color}`}>
                        {(() => {
                          const Icon = selectedCategory.icon;
                          return <Icon className="h-4 w-4 mr-1" />;
                        })()}
                        {selectedCategory.label}
                      </span>
                    </div>
                  )}
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-primary-500" />
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
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                    )}
                  </div>
                    <div>
  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
    <Layers className="h-5 w-5 mr-2 text-primary-500" />
    Vendor Service
  </h3>
  
  <div>
    <label htmlFor="VendorService" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Vendor Service *
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
    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
      Describe the specific service this vendor provides
    </p>
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
                      />
                    </div>
                    {errors.taxId && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.taxId}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Required for 1099 reporting when payments exceed $600
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
                        placeholder="contact@vendor.com"
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
                        placeholder="123 Main Street"
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
                        placeholder="1234567890"
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
                        placeholder="021000021"
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
                        placeholder="BOFAUS3N"
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
                      rows="4"
                      value={formData.notes}
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 resize-none"
                      placeholder="Additional notes about this vendor, special instructions, or other relevant information..."
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
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Vendor is Active
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Fields marked with * are required</p>
                  <p className="mt-1">Vendor will be created with status "Active"</p>
                  <p className="mt-1 text-primary-600 dark:text-primary-400">
                    ⓘ Tax ID is required for 1099 reporting when payments exceed $600
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
                    disabled={submitting}
                  >
                    Reset Form
                  </button>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Vendor
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            💡 Quick Tips for Vendor Registration
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• <strong>Tax ID is required</strong> for 1099 reporting when payments exceed $600/year</li>
            <li>• Select the appropriate vendor type for better categorization</li>
            <li>• <strong>Category is required</strong> for service type classification</li>
            <li>• Include accurate contact information for billing and communication</li>
            <li>• Set clear payment terms to avoid misunderstandings</li>
            <li>• Bank information is optional but useful for direct payments</li>
            <li>• Add notes for special instructions or important details</li>
            <li>• Keep vendor status as "Active" for ongoing relationships</li>
            <li>• You can mark vendors as "Inactive" for discontinued relationships</li>
            <li>• All vendors are automatically tracked for 1099 eligibility</li>
          </ul>
        </div>
      </div>
    </LayoutWrapper>
  );
}