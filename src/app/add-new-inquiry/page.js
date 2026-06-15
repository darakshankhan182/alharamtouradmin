// app/inquiries/add/page.jsx - UPDATED WITH PACKAGE DURATION FIELD
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper';
import { useAuth } from '@/context/AuthContext';
import { inquiriesAPI } from '@/utils/api';
import toast from 'react-hot-toast';
import { 
  User,  
  Mail, 
  Phone, 
  MapPin, 
  Users as UsersIcon,
  MessageSquare,
  ArrowLeft,
  Save,
  RefreshCw,
  TrendingUp,
  Search,
  PhoneCall,
  Mail as MailIcon,
  Users as UsersRef,
  Globe,
  Building,
  Info,
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';

export default function AddInquiryPage() {
  const router = useRouter();
  const { token, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Get today's date in YYYY-MM-DD format for the date input
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    origin: '',
    destination: '',
    departureDate: getTodayDate(),
    packageDuration: '', // ADDED: Package duration field
    adults: 1,
    children: 0,
    infants: 0,
    message: '',
    source: 'website',
    sourceDetails: '',
    inquiryDate: getTodayDate()
  });

  const [errors, setErrors] = useState({});

  // Source options for dropdown
  const sourceOptions = [
    { value: 'website', label: 'Website Form', icon: Globe, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'google ads', label: 'Google Ads', icon: Search, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    { value: 'phone', label: 'Phone Call', icon: PhoneCall, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'email', label: 'Email', icon: MailIcon, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { value: 'reference', label: 'Reference', icon: UsersRef, color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400' },
    { value: 'other', label: 'Other', icon: Building, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
  ];

  // Check if "Other" source is selected
  const isOtherSource = formData.source === 'other';

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (['adults', 'children', 'infants'].includes(name)) {
      const numValue = parseInt(value) || 0;
      setFormData(prev => ({
        ...prev,
        [name]: Math.max(0, numValue) // Ensure non-negative
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

  const handleSourceChange = (e) => {
    const newSource = e.target.value;
    setFormData(prev => ({
      ...prev,
      source: newSource,
      // Clear source details when switching away from "Other"
      sourceDetails: newSource === 'other' ? prev.sourceDetails : ''
    }));
  };

  const handleSourceSelect = (sourceValue) => {
    setFormData(prev => ({
      ...prev,
      source: sourceValue,
      // Clear source details when switching away from "Other"
      sourceDetails: sourceValue === 'other' ? prev.sourceDetails : ''
    }));
    
    // Clear error
    if (errors.source) {
      setErrors(prev => ({ ...prev, source: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.origin.trim()) newErrors.origin = 'Origin is required';
    if (!formData.destination.trim()) newErrors.destination = 'Destination is required';
    if (!formData.departureDate.trim()) newErrors.departureDate = 'Departure date is required';
    if (!formData.inquiryDate.trim()) newErrors.inquiryDate = 'Inquiry date is required';
    
    // Source validation
    if (!formData.source.trim()) newErrors.source = 'Please select a source';
    
    // Source details validation for "Other" source
    if (formData.source === 'other' && !formData.sourceDetails.trim()) {
      newErrors.sourceDetails = 'Please provide details for "Other" source';
    }
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Date validation - ensure date is not in the past for departure
    if (formData.departureDate) {
      const selectedDate = new Date(formData.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.departureDate = 'Departure date cannot be in the past';
      }
    }
    
    // Inquiry date validation - ensure not in the future
    if (formData.inquiryDate) {
      const selectedDate = new Date(formData.inquiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        newErrors.inquiryDate = 'Inquiry date cannot be in the future';
      }
    }
    
    // Package duration validation if provided
    if (formData.packageDuration.trim() !== '') {
      const duration = parseInt(formData.packageDuration);
      if (isNaN(duration)) {
        newErrors.packageDuration = 'Package duration must be a number';
      } else if (duration < 1) {
        newErrors.packageDuration = 'Package duration must be at least 1 day';
      } else if (duration > 365) {
        newErrors.packageDuration = 'Package duration cannot exceed 365 days';
      } else if (!Number.isInteger(duration)) {
        newErrors.packageDuration = 'Package duration must be a whole number';
      }
    }
    
    // Numeric validation
    if (formData.adults < 1) newErrors.adults = 'At least 1 adult is required';
    if (formData.children < 0) newErrors.children = 'Children cannot be negative';
    if (formData.infants < 0) newErrors.infants = 'Infants cannot be negative';
    
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
      // Prepare inquiry data for backend
      const inquiryData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        origin: formData.origin,
        destination: formData.destination,
        departureDate: formData.departureDate,
        packageDuration: formData.packageDuration ? parseInt(formData.packageDuration) : undefined, // ADDED
        adults: formData.adults,
        children: formData.children,
        infants: formData.infants,
        message: formData.message || '',
        source: formData.source,
        sourceDetails: formData.sourceDetails || '',
        inquiryDate: formData.inquiryDate,
        isManual: true // Always true for manual entries from admin panel
      };
      
      console.log('Submitting inquiry data:', inquiryData); // Debug log
      
      const response = await inquiriesAPI.create(inquiryData, token);
      
      toast.success('Inquiry created successfully!');
      
      // Redirect to inquiries page after successful creation
      setTimeout(() => {
        router.push('/inquiries');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating inquiry:', error);
      
      // Handle backend validation errors
      if (error.message && error.message.includes('is required')) {
        toast.error(error.message);
      } else if (error.errors) {
        // Handle multiple validation errors
        const errorMessages = Object.values(error.errors).map(err => err.message);
        toast.error(errorMessages.join(', '));
      } else {
        toast.error(error.message || 'Failed to create inquiry. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      email: '',
      phoneNumber: '',
      origin: '',
      destination: '',
      departureDate: getTodayDate(),
      packageDuration: '', // Reset package duration
      adults: 1,
      children: 0,
      infants: 0,
      message: '',
      source: 'website',
      sourceDetails: '',
      inquiryDate: getTodayDate()
    });
    setErrors({});
    toast.success('Form cleared!');
  };

  // Get selected source icon and label
  const selectedSource = sourceOptions.find(option => option.value === formData.source);

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Inquiry</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Fill in the details below to create a new manual inquiry
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Customer Information
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Enter the customer details and travel requirements
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Source Selection */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary-500" />
                  Inquiry Source
                </h3>
                
                <div>
                  <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    How did this inquiry come to you? *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                    {sourceOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = formData.source === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSourceSelect(option.value)}
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
                          <span className={`text-sm font-medium ${
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
                  
                  {errors.source && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.source}</p>
                  )}
                  
                  {/* Hidden select for form submission */}
                  <select
                    id="source"
                    name="source"
                    value={formData.source}
                    onChange={handleSourceChange}
                    className="hidden"
                    required
                  >
                    {sourceOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  
                  {/* Selected Source Display */}
                  {selectedSource && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <span>Selected source:</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${selectedSource.color}`}>
                        {(() => {
                          const Icon = selectedSource.icon;
                          return <Icon className="h-4 w-4 mr-1" />;
                        })()}
                        {selectedSource.label}
                      </span>
                    </div>
                  )}
                  
                  {/* Other Source Details - Only shown when "Other" is selected */}
                  {isOtherSource && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center mb-3">
                        <Info className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                        <label htmlFor="sourceDetails" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Please specify the source *
                        </label>
                      </div>
                      <div className="relative">
                        <div className="absolute top-3 left-3 pointer-events-none">
                          <Building className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          id="sourceDetails"
                          name="sourceDetails"
                          value={formData.sourceDetails}
                          onChange={handleChange}
                          rows="3"
                          className={`pl-10 w-full px-4 py-3 rounded-lg border ${
                            errors.sourceDetails 
                              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                              : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800 resize-none`}
                          placeholder="Please provide details about the source (e.g., Walk-in, Social Media, Event, Partner Agency, etc.)"
                          maxLength="200"
                        />
                      </div>
                      {errors.sourceDetails && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sourceDetails}</p>
                      )}
                      <div className="flex justify-between mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Provide specific details about the source
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formData.sourceDetails.length}/200
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary-500" />
                  Personal Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-2.5 rounded-lg border ${
                          errors.fullName 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
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

                  {/* Phone Number */}
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-2.5 rounded-lg border ${
                          errors.phoneNumber 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    {errors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phoneNumber}</p>
                    )}
                  </div>

                  {/* Departure Date */}
                  <div>
                    <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Departure Date *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="departureDate"
                        name="departureDate"
                        value={formData.departureDate}
                        onChange={handleChange}
                        min={getTodayDate()} // Prevent past dates
                        className={`pl-10 w-full px-4 py-2.5 rounded-lg border ${
                          errors.departureDate 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                        required
                      />
                    </div>
                    {errors.departureDate && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.departureDate}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Select the departure date for travel (YYYY-MM-DD format)
                    </p>
                  </div>

                  {/* Package Duration - ADDED FIELD */}
                  <div>
                    <label htmlFor="packageDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Package Duration (Days)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="packageDuration"
                        name="packageDuration"
                        value={formData.packageDuration}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-2.5 rounded-lg border ${
                          errors.packageDuration 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                        placeholder="e.g., 7"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={3}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-500">days</span>
                      </div>
                    </div>
                    {errors.packageDuration && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.packageDuration}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Optional: Length of package in days (1-365)
                    </p>
                  </div>

                  {/* Inquiry Date */}
                  <div>
                    <label htmlFor="inquiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Inquiry Date *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="inquiryDate"
                        name="inquiryDate"
                        value={formData.inquiryDate}
                        onChange={handleChange}
                        max={getTodayDate()} // Prevent future dates
                        className={`pl-10 w-full px-4 py-2.5 rounded-lg border ${
                          errors.inquiryDate 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                      />
                    </div>
                    {errors.inquiryDate && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.inquiryDate}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Select the date when this inquiry was received
                    </p>
                  </div>
                </div>
              </div>

              {/* Travel Information */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary-500" />
                  Travel Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Origin */}
                  <div>
                    <label htmlFor="origin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Origin City *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="origin"
                        name="origin"
                        value={formData.origin}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-2.5 rounded-lg border ${
                          errors.origin 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                        placeholder="New York"
                      />
                    </div>
                    {errors.origin && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.origin}</p>
                    )}
                  </div>

                  {/* Destination */}
                  <div>
                    <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Destination City *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="destination"
                        name="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        className={`pl-10 w-full px-4 py-2.5 rounded-lg border ${
                          errors.destination 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                        placeholder="Los Angeles"
                      />
                    </div>
                    {errors.destination && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.destination}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Passenger Information */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <UsersIcon className="h-5 w-5 mr-2 text-primary-500" />
                  Passenger Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Adults */}
                  <div>
                    <label htmlFor="adults" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Adults *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="adults"
                        name="adults"
                        min="1"
                        value={formData.adults}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          errors.adults 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                      />
                    </div>
                    {errors.adults && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.adults}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Minimum 1 adult required</p>
                  </div>

                  {/* Children */}
                  <div>
                    <label htmlFor="children" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Children (2-11 years)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="children"
                        name="children"
                        min="0"
                        value={formData.children}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          errors.children 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                      />
                    </div>
                    {errors.children && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.children}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Optional</p>
                  </div>

                  {/* Infants */}
                  <div>
                    <label htmlFor="infants" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Infants (0-2 years)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="infants"
                        name="infants"
                        min="0"
                        value={formData.infants}
                        onChange={handleChange}
                        className={`w-full px-4 py-2.5 rounded-lg border ${
                          errors.infants 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800`}
                      />
                    </div>
                    {errors.infants && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.infants}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Optional</p>
                  </div>
                </div>
              </div>

              {/* Additional Message */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-primary-500" />
                  Additional Information
                </h3>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Notes / Special Requirements
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      rows="4"
                      value={formData.message}
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 resize-none"
                      placeholder="Any special requirements, preferred dates, budget constraints, or other information..."
                      maxLength="1000"
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Optional - Maximum 1000 characters
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.message.length}/1000
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Fields marked with * are required</p>
                  <p className="mt-1">Inquiry will be created with status "new"</p>
                  {isOtherSource && (
                    <p className="mt-1 text-primary-600 dark:text-primary-400">
                      ⓘ "Other Details" field is required when "Other" source is selected
                    </p>
                  )}
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
                        Create Inquiry
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
            💡 Quick Tips
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• All required fields must be filled before submission</li>
            <li>• Select the appropriate source to track inquiry origin</li>
            <li>• When selecting "Other" source, provide specific details</li>
            <li>• Make sure email and phone number are accurate for follow-up</li>
            <li>• Provide clear origin and destination cities</li>
            <li>• Select departure date (cannot be in the past)</li>
            <li>• Enter package duration in days (optional, 1-365 days)</li>
            <li>• Select the date when the inquiry was originally received</li>
            <li>• Add any special requirements in the notes section</li>
            <li>• Manual inquiries will appear in the "Manual Inquiries" tab</li>
          </ul>
        </div>
      </div>
    </LayoutWrapper>
  );
}