// utils/api.js
const API_BASE_URL = 'https://alharamtour-backend.vercel.app/api';

// Generic API request function with timeout
export const apiRequest = async (endpoint, method = 'GET', data = null, token = null, timeout = 10000) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method, 
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    config.body = JSON.stringify(data);
  }

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    config.signal = controller.signal;

    console.log(`🌐 API Request: ${method} ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    clearTimeout(timeoutId);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      console.error(`❌ API Error ${response.status}:`, result.message || 'Request failed');
      throw new Error(result.message || `Request failed with status ${response.status}`);
    }

    console.log(`✅ API Success: ${method} ${endpoint}`);
    return result;
  } catch (error) {
    console.error('❌ API Request Error:', {
      endpoint,
      method,
      error: error.name,
      message: error.message
    });

    // Handle specific error types
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Server might be down or slow.');
    } else if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Make sure backend is running on https://alharamtour-backend.vercel.app/');
    }
    
    throw error;
  }
};

// Notifications API
export const notificationsAPI = {
  // Get notifications
  getAll: (params = {}, token) => {
    const queryString = new URLSearchParams({
      limit: 20,
      page: 1,
      unreadOnly: false,
      ...params
    }).toString();
    
    return apiRequest(`/notifications?${queryString}`, 'GET', null, token);
  },
  
  // Mark as read
  markAsRead: (id, token) => 
    apiRequest(`/notifications/${id}/read`, 'PATCH', null, token),
  
  // Mark all as read
  markAllAsRead: (token) => 
    apiRequest('/notifications/read-all', 'PATCH', null, token),
  
  // Delete notification
  delete: (id, token) => 
    apiRequest(`/notifications/${id}`, 'DELETE', null, token),
  
  // Clear all
  clearAll: (token) => 
    apiRequest('/notifications', 'DELETE', null, token),
};

// Vendor API functions
export const vendorsAPI = {
  getAll: async (token) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/vendors`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch vendors');
    }
    
    return response.json();
  },

  getById: async (id, token) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/vendors/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch vendor details');
    }
    
    return response.json();
  },

  create: async (data, token) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/vendors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create vendor');
    }
    
    return response.json();
  },

  update: async (id, data, token) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/vendors/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update vendor');
    }
    
    return response.json();
  },

  delete: async (id, token) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/vendors/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete vendor');
    }
    
    return response.json();
  },

  get1099Report: async (token, year) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/vendors/1099-eligible${year ? `?year=${year}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch 1099 report');
    }
    
    return response.json();
  }
};

// Financial API functions
export const financialAPI = {
  getVendorSummary: async (token) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/vendors/financial-summary`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch vendor financial summary');
    }
    
    return response.json();
  },

  getVendorPayments: async (vendorId, token) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}api/vendors/${vendorId}/payments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch vendor payments');
    }
    
    return response.json();
  }
};

// Auth API
export const authAPI = {
  login: (credentials) => apiRequest('/auth/login', 'POST', credentials, null, 15000),
  register: (userData) => apiRequest('/auth/register', 'POST', userData, null, 15000),
  getProfile: (token) => apiRequest('/auth/profile', 'GET', null, token),
  updateProfile: (data, token) => apiRequest('/auth/profile', 'PUT', data, token),
};

// Inquiries API - UPDATED WITH ASSIGNMENT FUNCTIONS
export const inquiriesAPI = {
  // Create inquiry - supports both authenticated and guest submissions
  create: (inquiryData, token = null) => {
    return apiRequest('/inquiries', 'POST', inquiryData, token, 15000);
  },
  
  // Protected routes - need token
  getAll: (token) => apiRequest('/inquiries', 'GET', null, token),
  
  // Get assigned inquiries for current user
  getAssigned: (token) => apiRequest('/inquiries/assigned', 'GET', null, token),
  
  getById: (id, token) => apiRequest(`/inquiries/${id}`, 'GET', null, token),
  update: (id, data, token) => apiRequest(`/inquiries/${id}`, 'PUT', data, token),
  updateStatus: (id, status, token) => 
    apiRequest(`/inquiries/${id}/status`, 'PATCH', { status }, token),
  delete: (id, token) => apiRequest(`/inquiries/${id}`, 'DELETE', null, token),
  deleteMultiple: (inquiryIds, token) => 
    apiRequest('/inquiries', 'DELETE', { inquiryIds }, token),
  
  // 🆕 Assignment Functions
  assign: (inquiryId, userId, token) => 
    apiRequest(`/inquiries/${inquiryId}/assign`, 'POST', { userId }, token),
  
  unassign: (inquiryId, token) => 
    apiRequest(`/inquiries/${inquiryId}/unassign`, 'POST', null, token),
  
  selfAssign: (inquiryId, token) => 
    apiRequest(`/inquiries/${inquiryId}/self-assign`, 'POST', null, token),
  
  // Get inquiry with booking cost
  getWithBookingCost: (inquiryId, token) => 
    apiRequest(`/inquiries/${inquiryId}/booking-cost`, 'GET', null, token),
  
  // Manage booking cost
  manageBookingCost: (inquiryId, bookingCostData, token) => 
    apiRequest(`/inquiries/${inquiryId}/booking-cost`, 'POST', bookingCostData, token),
  
  // Get financial dashboard data
  getFinancialDashboard: (inquiryId, token) => 
    apiRequest(`/inquiries/${inquiryId}/financial-dashboard`, 'GET', null, token),
};

// Comments API
export const commentsAPI = {
  // Get comments for an inquiry
  getByInquiry: async (inquiryId, token) => {
    const response = await fetch(`${API_URL}/inquiries/${inquiryId}/comments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch comments');
    }
    
    return response.json();
  },

  // Create a comment
  create: async (commentData, token) => {
    const response = await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commentData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create comment');
    }
    
    return response.json();
  },

  // Update a comment
  update: async (commentId, content, token) => {
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update comment');
    }
    
    return response.json();
  },

  // Delete a comment
  delete: async (commentId, token) => {
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete comment');
    }
    
    return response.json();
  },

  // Like/Unlike a comment
  toggleLike: async (commentId, token) => {
    const response = await fetch(`${API_URL}/comments/${commentId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to toggle like');
    }
    
    return response.json();
  },

  // Get replies for a comment
  getReplies: async (commentId, token, page = 1) => {
    const response = await fetch(`${API_URL}/comments/${commentId}/replies?page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch replies');
    }
    
    return response.json();
  }
  
};

// Users API
export const usersAPI = {
  // Get all users with pagination
  getAll: (params = {}, token) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/users${queryString ? `?${queryString}` : ''}`, 'GET', null, token);
  },
  
  // Get user stats
  getStats: (token) => apiRequest('/users/stats', 'GET', null, token),
  
  // Get user by ID
  getById: (id, token) => apiRequest(`/users/${id}`, 'GET', null, token),
  
  // Create new user
  create: (userData, token) => apiRequest('/users', 'POST', userData, token),
  
  // Update user
  update: (id, userData, token) => apiRequest(`/users/${id}`, 'PUT', userData, token),
  
  // Delete user
  delete: (id, token) => apiRequest(`/users/${id}`, 'DELETE', null, token),
};

// Health check
export const healthAPI = {
  check: () => apiRequest('/health', 'GET', null, null, 5000),
};

// 🆕 Dashboard API (if needed)
export const dashboardAPI = {
  // Get dashboard statistics
  getStats: (token) => apiRequest('/dashboard/stats', 'GET', null, token),
  
  // Get recent activity
  getRecentActivity: (token, limit = 10) => 
    apiRequest(`/dashboard/activity?limit=${limit}`, 'GET', null, token),
  
  // Get conversion analytics
  getConversionAnalytics: (token, startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest(`/dashboard/conversions?${params.toString()}`, 'GET', null, token);
  },
};

export default {
  authAPI,
  inquiriesAPI,
  notificationsAPI,
  usersAPI,
  healthAPI,
  dashboardAPI,
  vendorsAPI,
  financialAPI,
  commentsAPI,
  apiRequest
};