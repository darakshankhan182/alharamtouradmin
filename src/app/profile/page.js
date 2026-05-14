'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { useAuth } from '@/context/AuthContext';
import { UserCheckIcon, RefreshCw, Key, Mail, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const { user, token, isAuthenticated, updateProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated === false) {
      router.push('/login');
      return;
    }

    if (isAuthenticated === true && user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setErrors({});
      setSuccessMessage('');
    }
  }, [authLoading, isAuthenticated, user, router]);

  if (authLoading || isAuthenticated === null) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-primary-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (!isAuthenticated) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate username
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 30) {
      newErrors.username = 'Username must be less than 30 characters';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate password fields if any password is entered
    const hasAnyPassword = 
      formData.currentPassword || 
      formData.newPassword || 
      formData.confirmPassword;

    if (hasAnyPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }

      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your new password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'New passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSuccessMessage('');

    try {
      // Prepare update data
      const updateData = {};
      
      // Only include username if it changed
      if (formData.username !== user.username) {
        updateData.username = formData.username;
      }
      
      // Only include email if it changed
      if (formData.email !== user.email) {
        updateData.email = formData.email;
      }
      
      // Include password fields if they're filled
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      // Don't send request if nothing changed
      if (Object.keys(updateData).length === 0) {
        setSuccessMessage('No changes detected');
        setLoading(false);
        return;
      }

      // Send update request
      await updateProfile(updateData);

      // Clear password fields on success
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);

    } catch (error) {
      console.error('Profile update error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Username is already taken')) {
        setErrors(prev => ({ ...prev, username: 'This username is already taken' }));
      } else if (error.message.includes('Email is already taken')) {
        setErrors(prev => ({ ...prev, email: 'This email is already taken' }));
      } else if (error.message.includes('Current password is incorrect')) {
        setErrors(prev => ({ ...prev, currentPassword: 'Current password is incorrect' }));
      } else {
        toast.error(error.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="max-w-3xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <UserCheckIcon className="h-12 w-12 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Profile Settings</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your account settings and update your personal information
              </p>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg">
              {successMessage}
            </div>
          )}

          {/* Profile Update Form */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Personal Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    error={errors.username}
                    required
                    icon={<User className="h-4 w-4 text-gray-400" />}
                    placeholder="Enter your username"
                  />

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                    icon={<Mail className="h-4 w-4 text-gray-400" />}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Change Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  Change Password
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Leave these fields empty if you don't want to change your password.
                </p>

                <div className="space-y-6">
                  <Input
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    error={errors.currentPassword}
                    icon={<Key className="h-4 w-4 text-gray-400" />}
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      error={errors.newPassword}
                      icon={<Key className="h-4 w-4 text-gray-400" />}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                    />

                    <Input
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      error={errors.confirmPassword}
                      icon={<Key className="h-4 w-4 text-gray-400" />}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Account Information */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Account Information</h2>
            </div>
            <div className="p-6">
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                <div className="py-4 flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Created</dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-300">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </dd>
                </div>

                <div className="py-4 flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-300 font-mono truncate max-w-[200px]">
                    {user?._id || 'N/A'}
                  </dd>
                </div>

                <div className="py-4 flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</dt>
                  <dd className="text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Not Verified
                    </span>
                  </dd>
                </div>

                <div className="py-4 flex justify-between items-center">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</dt>
                  <dd className="text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Security Note */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Key className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Security Tips</h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <p>• Use a strong, unique password</p>
                  <p>• Never share your password with anyone</p>
                  <p>• Change your password regularly</p>
                  <p>• Make sure your email is up to date</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}