// context/AuthContext.js - COMPLETE FIXED VERSION
'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const router = useRouter();

  // Function to check if backend is available
  const checkBackendHealth = async () => {
    try {
      const response = await fetch('https://alharamtourbackend.vercel.app/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      console.warn('Backend health check failed:', error.message);
      return false;
    }
  };

  useEffect(() => {
    // Check for stored token and user on mount
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      // First check if backend is available
      const isBackendAvailable = await checkBackendHealth();
      setBackendAvailable(isBackendAvailable);
      
      if (!isBackendAvailable) {
        console.warn('Backend is not available. Running in offline mode.');
        // If we have stored data, use it (offline mode)
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('📋 Initializing from localStorage:', parsedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
        setLoading(false);
        return;
      }
      
      if (storedToken && storedUser) {
        try {
          // Verify token is still valid by fetching profile
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch('https://alharamtourbackend.vercel.app/api/auth/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const userData = await response.json();
            console.log('✅ Profile fetch successful:', userData);
            console.log('🔐 User role from profile:', userData.role);
            
            // ✅ FIX: Store ALL user data including role
            const fullUserData = {
              _id: userData._id,
              username: userData.username,
              email: userData.email,
              role: userData.role || 'user' // Ensure role is included
            };
            
            // Update localStorage with complete data
            localStorage.setItem('user', JSON.stringify(fullUserData));
            
            setToken(storedToken);
            setUser(fullUserData);
            setIsAuthenticated(true);
            toast.success('Welcome back!');
          } else {
            // Token is invalid, clear storage
            console.log('❌ Token invalid, clearing storage');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
            toast.error('Session expired. Please login again.');
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          
          if (error.name === 'AbortError') {
            toast.error('Connection timeout. Please check your backend server.');
          }
          
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          
          if (!backendAvailable) {
            toast.warning('Backend server is not running. Please start it.');
          }
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (emailOrUsername, password) => {
    try {
      // Check backend first
      if (!backendAvailable) {
        toast.error('Backend server is not available. Please start it on port 5000.');
        throw new Error('Backend server not available');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://alharamtourbackend.vercel.app/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrUsername, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // ✅ FIX: DEBUG - Log what we receive from backend
      console.log('🔐 Login Response Data:', data);
      console.log('👤 Role from login response:', data.role);
      console.log('✅ Has role property?', 'role' in data);

      // ✅ FIX: Save token and COMPLETE user data including role
      const userData = {
        _id: data._id,
        username: data.username,
        email: data.email,
        role: data.role || 'user' // Default to 'user' if role is not provided
      };
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));

      // ✅ FIX: Update state with complete user data
      setToken(data.token);
      setUser(userData);
      setIsAuthenticated(true);
      setBackendAvailable(true);

      console.log('✅ Login successful, user set:', userData);
      toast.success('Login successful!');
      router.push('/dashboard');
      
      return data;
    } catch (error) {
      console.error('❌ Login error:', error);
      if (error.name === 'AbortError') {
        toast.error('Login timeout. Server might be down.');
      } else {
        toast.error(error.message || 'Login failed. Please check your credentials.');
      }
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      // Check backend first
      if (!backendAvailable) {
        toast.error('Backend server is not available. Please start it on port 5000.');
        throw new Error('Backend server not available');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://alharamtourbackend.vercel.app/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      toast.success('Registration successful!');
      
      // Auto login after registration
      await login(userData.email, userData.password);
      
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error('Registration timeout. Server might be down.');
      } else {
        toast.error(error.message);
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully!');
    router.push('/login');
  };

  const updateProfile = async (profileData) => {
    try {
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Check backend first
      if (!backendAvailable) {
        toast.error('Backend server is not available. Please start it on port 5000.');
        throw new Error('Backend server not available');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://alharamtourbackend.vercel.app/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Update failed');
      }

      // Update local storage with complete user data including role
      const updatedUser = {
        ...user,
        ...data.user,
        role: data.user?.role || user?.role || 'user' // Preserve role
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      toast.success(data.message || 'Profile updated successfully!');
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error('Update timeout. Server might be down.');
      } else {
        toast.error(error.message);
      }
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    backendAvailable,
    login,
    register,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};