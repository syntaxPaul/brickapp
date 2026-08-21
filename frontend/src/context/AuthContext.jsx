//frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_URL = '/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);

  // Axios interceptor for adding token
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        const branchId = localStorage.getItem('currentBranch');
        if (branchId) {
          config.headers['x-branch-id'] = branchId;
        }
        console.log('📤 API Request:', config.method.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('📤 Request Error:', error);
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  // Axios response interceptor for debugging
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => {
        console.log('📥 API Response:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('📥 Response Error:', error.response?.status, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      console.log('🔍 Fetching user data...');
      const res = await axios.get(`${API_URL}/auth/me`);
      console.log('✅ User data received:', res.data);
      setUser(res.data);
      setBranches(res.data.branches || []);
      
      const primary = res.data.branches?.find(b => b.is_primary);
      if (primary) {
        setCurrentBranch(primary.branch_id);
        localStorage.setItem('currentBranch', primary.branch_id);
      } else if (res.data.branches?.length > 0) {
        setCurrentBranch(res.data.branches[0].branch_id);
        localStorage.setItem('currentBranch', res.data.branches[0].branch_id);
      }
    } catch (error) {
      console.error('❌ Failed to fetch user:', error.response?.data || error.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    console.log('🔐 Login attempt:', username);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password });
      console.log('✅ Login response:', res.data);
      
      const { token, user, branches } = res.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      setBranches(branches || []);
      
      const primary = branches?.find(b => b.is_primary);
      if (primary) {
        setCurrentBranch(primary.branch_id);
        localStorage.setItem('currentBranch', primary.branch_id);
      } else if (branches?.length > 0) {
        setCurrentBranch(branches[0].branch_id);
        localStorage.setItem('currentBranch', branches[0].branch_id);
      }
      
      toast.success(`Welcome ${user.full_name || user.username}!`);
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        toast.error('Invalid username or password');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Check backend logs.');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Make sure backend is running on port 5010.');
      } else {
        toast.error(error.response?.data?.error || 'Login failed');
      }
      return { success: false, error: error.response?.data?.error };
    }
  };

  const switchBranch = (branchId) => {
    const hasAccess = branches.some(b => b.branch_id === branchId);
    if (!hasAccess) {
      toast.error('You do not have access to this branch');
      return;
    }
    setCurrentBranch(branchId);
    localStorage.setItem('currentBranch', branchId);
    toast.success('Branch switched successfully');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentBranch');
    setToken(null);
    setUser(null);
    setBranches([]);
    setCurrentBranch(null);
    toast.success('Logged out successfully');
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    const branchRoles = user.roles?.filter(r => r.branch_id === currentBranch) || [];
    return branchRoles.some(r => 
      r.permissions?.includes('*') || 
      r.permissions?.includes(permission)
    );
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      token,
      branches,
      currentBranch,
      switchBranch,
      hasPermission,
      setCurrentBranch
    }}>
      {children}
    </AuthContext.Provider>
  );
};