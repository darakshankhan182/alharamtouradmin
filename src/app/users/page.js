// app/users/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/Button';
import { useAuth } from '@/context/AuthContext';
import { usersAPI } from '@/utils/api';
import {
  Users,
  User,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  ShieldAlert,
  Mail,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  Copy,
  Table,
  LayoutGrid,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Lock,
  Unlock,
  FileText,
  XCircle,
  Globe,
  Phone,
  MapPin,
  Users as UsersIcon,
  MessageSquare,
  Building
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [roleFilter, setRoleFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [itemsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { token, isAuthenticated, loading, user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    if (currentUser?.role !== 'admin') {
      toast.error('Admin access required');
      router.push('/dashboard');
      return;
    }

    fetchUsers();
    fetchStats();
  }, [loading, isAuthenticated, token, router, currentPage, roleFilter, searchTerm]);

  const fetchUsers = async () => {
    if (!token) return;
    
    try {
      setLoadingPage(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        role: roleFilter !== 'all' ? roleFilter : ''
      };
      
      const data = await usersAPI.getAll(params, token);
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalUsers(data.pagination?.totalUsers || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.message || 'Failed to fetch users');
    } finally {
      setLoadingPage(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;
    
    try {
      const data = await usersAPI.getStats(token);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email)
      .then(() => {
        setCopiedEmail(email);
        toast.success('Email copied to clipboard');
        setTimeout(() => setCopiedEmail(null), 2000);
      })
      .catch(() => {
        toast.error('Failed to copy email');
      });
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user'
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!selectedUser) { // Only validate password for new users
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const userData = {
        username: formData.username,
        email: formData.email,
        role: formData.role
      };
      
      // Only include password if it's provided (for new user or password change)
      if (formData.password) {
        userData.password = formData.password;
      }
      
      if (selectedUser) {
        // Update existing user
        await usersAPI.update(selectedUser._id, userData, token);
        toast.success('User updated successfully');
        setIsEditModalOpen(false);
      } else {
        // Create new user
        await usersAPI.create(userData, token);
        toast.success('User created successfully');
        setIsCreateModalOpen(false);
      }
      
      fetchUsers();
      fetchStats();
      resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.message || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      await usersAPI.delete(selectedUser._id, token);
      toast.success('User deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user'
    });
    setFormErrors({});
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusBadge = (role) => {
    const roles = {
      'admin': { 
        color: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white',
        icon: Shield,
        label: 'Admin'
      },
      'user': { 
        color: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
        icon: UserCheck,
        label: 'User'
      }
    };
    return roles[role] || roles['user'];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated || loading) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
            <p className="mt-3 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <ShieldAlert className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Admin Access Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You need administrator privileges to access this page.
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">User Management</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage all system users and their permissions
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
                  onClick={handleOpenCreate}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
                
                <Button 
                  onClick={fetchUsers}
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
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { 
                label: 'Total Users', 
                value: stats.totalUsers, 
                icon: Users,
                color: 'bg-gradient-to-br from-primary-500 to-primary-600',
                bgColor: 'bg-primary-50 dark:bg-primary-900/20'
              },
              { 
                label: 'Admins', 
                value: stats.totalAdmins, 
                icon: Shield,
                color: 'bg-gradient-to-br from-amber-500 to-amber-600',
                bgColor: 'bg-amber-50 dark:bg-amber-900/20'
              },
              { 
                label: 'Regular Users', 
                value: stats.totalRegularUsers, 
                icon: UserCheck,
                color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
                bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
              },
              { 
                label: 'New (7 days)', 
                value: stats.recentUsers, 
                icon: TrendingUp,
                color: 'bg-gradient-to-br from-blue-500 to-blue-600',
                bgColor: 'bg-blue-50 dark:bg-blue-900/20'
              }
            ].map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                    <div className={`p-2 rounded-lg ${stat.color} text-white`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Search Bar */}
          <div className="relative w-full md:w-auto md:min-w-[320px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Clear search"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Role Filter */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-10 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="user">Users</option>
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <div className="w-2 h-2 border-b-2 border-r-2 border-gray-400 rotate-45"></div>
              </div>
            </div>

            {/* Items Per Page */}
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setCurrentPage(1);
                }}
                className="appearance-none pl-10 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
              <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <div className="w-2 h-2 border-b-2 borderr-2 border-gray-400 rotate-45"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between px-1">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {searchTerm ? (
              <span>
                Found <span className="font-semibold text-primary-600 dark:text-primary-400">{totalUsers}</span> users matching "<span className="font-medium text-gray-900 dark:text-white">{searchTerm}</span>"
                {roleFilter !== 'all' && (
                  <span className="ml-2">
                    (filtered by: <span className="font-medium text-gray-900 dark:text-white">{roleFilter}</span>)
                  </span>
                )}
              </span>
            ) : (
              <span>
                Showing <span className="font-semibold text-primary-600 dark:text-primary-400">{totalUsers}</span> users
                {roleFilter !== 'all' && (
                  <span className="ml-2">
                    (filtered by: <span className="font-medium text-gray-900 dark:text-white">{roleFilter}</span>)
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'table' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Role & Status
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loadingPage ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
                          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Users className="h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {searchTerm ? 'No users found' : 'No users yet'}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                            {searchTerm 
                              ? 'Try adjusting your search or filter terms' 
                              : 'Start by adding your first user'}
                          </p>
                          <Button onClick={handleOpenCreate} className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add First User
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const status = getStatusBadge(user.role);
                      const StatusIcon = status.icon;
                      const isEmailCopied = copiedEmail === user.email;
                      
                      return (
                        <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-all duration-150 group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                                <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                  {user.username}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  ID: {user._id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center group/email">
                                <Mail className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
                                  {user.email}
                                </span>
                                <button
                                  onClick={() => handleCopyEmail(user.email)}
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
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.color} transition-all group-hover:scale-105`}>
                              <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-gray-900 dark:text-white">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                <div>
                                  <div className="font-medium">{formatDate(user.createdAt)}</div>
                                  <div className="text-xs text-gray-500">{formatTime(user.createdAt)}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => handleViewDetails(user)}
                                variant="outline"
                                size="sm"
                                className="border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleOpenEdit(user)}
                                variant="outline"
                                size="sm"
                                className="border-gray-300 dark:border-gray-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                                title="Edit User"
                                disabled={user._id === currentUser._id}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleOpenDelete(user)}
                                variant="danger"
                                size="sm"
                                className="hover:bg-rose-600 dark:hover:bg-rose-600 transition-all"
                                title="Delete User"
                                disabled={user._id === currentUser._id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {loadingPage ? (
              <div className="col-span-full">
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="col-span-full">
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {searchTerm ? 'No users found' : 'No users yet'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                    {searchTerm 
                      ? 'Try adjusting your search or filter terms' 
                      : 'Start by adding your first user'}
                  </p>
                  <Button onClick={handleOpenCreate} className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First User
                  </Button>
                </div>
              </div>
            ) : (
              users.map((user) => {
                const status = getStatusBadge(user.role);
                const StatusIcon = status.icon;
                const isEmailCopied = copiedEmail === user.email;
                const isCurrentUser = user._id === currentUser._id;
                
                return (
                  <div key={user._id} className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 overflow-hidden">
                    {/* Card Header */}
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                            <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {user.username}
                            </h3>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {user._id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color} transition-transform group-hover:scale-105`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </span>
                      </div>
                      
                      {/* Email */}
                      <div className="flex items-center justify-between group/email">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {user.email}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyEmail(user.email)}
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
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                          <div className="text-xs text-gray-600 dark:text-gray-400">Created</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatDate(user.createdAt)}
                          </div>
                        </div>
                        <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                          <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                          <div className="text-xs text-gray-600 dark:text-gray-400">Time</div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatTime(user.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card Footer */}
                    <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          {isCurrentUser && (
                            <span className="inline-flex items-center text-primary-600 dark:text-primary-400">
                              <User className="h-3 w-3 mr-1" />
                              Current User
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleViewDetails(user)}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleOpenEdit(user)}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 dark:border-gray-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                            title="Edit User"
                            disabled={isCurrentUser}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleOpenDelete(user)}
                            variant="danger"
                            size="sm"
                            className="hover:bg-rose-600 dark:hover:bg-rose-600 transition-all"
                            title="Delete User"
                            disabled={isCurrentUser}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-primary-600 dark:text-primary-400">
                {Math.min((currentPage - 1) * itemsPerPage + 1, totalUsers)}-
                {Math.min(currentPage * itemsPerPage, totalUsers)}
              </span> of{' '}
              <span className="font-semibold text-primary-600 dark:text-primary-400">{totalUsers}</span> users
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
                {(() => {
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
                  
                  return pageNumbers.map((pageNumber, index) =>
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
                  );
                })()}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="User Details"
          size="md"
        >
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedUser.username}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedUser.role).color}`}>
                      {getStatusBadge(selectedUser.role).label}
                    </span>
                    {selectedUser._id === currentUser._id && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 text-xs">
                        Current User
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User ID</label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    {selectedUser._id}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created Date</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created Time</label>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{formatTime(selectedUser.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button 
                  onClick={() => setIsModalOpen(false)} 
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setIsModalOpen(false);
                    handleOpenEdit(selectedUser);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                  disabled={selectedUser._id === currentUser._id}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Create User Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New User"
          size="lg"
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.username ? 'border-rose-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter username"
                  />
                  {formErrors.username && (
                    <p className="mt-1 text-sm text-rose-600">{formErrors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.email ? 'border-rose-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter email address"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-rose-600">{formErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.password ? 'border-rose-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter password"
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-rose-600">{formErrors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.confirmPassword ? 'border-rose-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Confirm password"
                  />
                  {formErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-rose-600">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'user' })}
                    className={`flex items-center justify-center p-4 border rounded-lg transition-all ${
                      formData.role === 'user'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                    }`}
                  >
                    <UserCheck className="h-5 w-5 mr-2" />
                    <span className="font-medium">User</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`flex items-center justify-center p-4 border rounded-lg transition-all ${
                      formData.role === 'admin'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                    }`}
                  >
                    <Shield className="h-5 w-5 mr-2" />
                    <span className="font-medium">Admin</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
              <Button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)} 
                variant="outline"
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create User
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit User"
          size="lg"
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.username ? 'border-rose-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.username && (
                    <p className="mt-1 text-sm text-rose-600">{formErrors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.email ? 'border-rose-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-rose-600">{formErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.password ? 'border-rose-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Leave blank to keep current"
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-sm text-rose-600">{formErrors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.confirmPassword ? 'border-rose-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Confirm new password"
                  />
                  {formErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-rose-600">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'user' })}
                    className={`flex items-center justify-center p-4 border rounded-lg transition-all ${
                      formData.role === 'user'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                    }`}
                  >
                    <UserCheck className="h-5 w-5 mr-2" />
                    <span className="font-medium">User</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`flex items-center justify-center p-4 border rounded-lg transition-all ${
                      formData.role === 'admin'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10'
                    }`}
                  >
                    <Shield className="h-5 w-5 mr-2" />
                    <span className="font-medium">Admin</span>
                  </button>
                </div>
              </div>

              {selectedUser?._id === currentUser._id && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      You are editing your own account. Some actions may be restricted.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
              <Button 
                type="button"
                onClick={() => setIsEditModalOpen(false)} 
                variant="outline"
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete User"
          size="sm"
        >
          {selectedUser && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
                  <Trash2 className="h-8 w-8 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Delete User?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{selectedUser.username}</span>? This action cannot be undone.
                </p>
                {selectedUser._id === currentUser._id && (
                  <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-3 mb-4">
                    <p className="text-sm text-rose-800 dark:text-rose-300">
                      ⚠️ Warning: You are attempting to delete your own account!
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDelete}
                  variant="danger"
                  disabled={selectedUser._id === currentUser._id}
                  className="hover:bg-rose-600 dark:hover:bg-rose-600"
                >
                  {selectedUser._id === currentUser._id ? (
                    'Cannot Delete Own Account'
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </LayoutWrapper>
  );
}