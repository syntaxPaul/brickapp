//frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { on } from '../lib/authEvents';
import { clearCache } from '../lib/cache';
import { clearApiCache } from '../lib/registerServiceWorker';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_URL = '/api';
const USER_CACHE_KEY = 'bapp:user';

// Read the last known user synchronously so the very first render already has a
// session. Previously the app showed a full-screen "Loading BrickApp..." spinner
// on every single load while /auth/me made a round trip - that round trip is
// still made, but in the background, and the UI no longer waits for it.
function readCachedUser() {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUser(user) {
  try {
    if (user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      localStorage.setItem('userId', String(user.id));
    } else {
      localStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem('userId');
    }
  } catch {
    /* private mode - non-fatal */
  }
}

export const AuthProvider = ({ children }) => {
  const storedToken = localStorage.getItem('token');
  const cachedUser = storedToken ? readCachedUser() : null;

  const [user, setUser] = useState(cachedUser);
  // Only block the UI when we have a token but no idea who it belongs to.
  const [loading, setLoading] = useState(Boolean(storedToken) && !cachedUser);
  const [token, setToken] = useState(storedToken);
  const [branches, setBranches] = useState(cachedUser?.branches || []);
  const [currentBranch, setCurrentBranch] = useState(() => {
    const saved = localStorage.getItem('currentBranch');
    return saved ? parseInt(saved, 10) : null;
  });
  const [degraded, setDegraded] = useState(false);

  const applyUser = useCallback((data, branchList) => {
    setUser(data);
    persistUser(data);

    const list = branchList || data?.branches || [];
    setBranches(list);

    // Only pick a branch if we do not already have a valid one, so a background
    // refresh never yanks the user out of the branch they are looking at.
    const saved = localStorage.getItem('currentBranch');
    const savedId = saved ? parseInt(saved, 10) : null;
    const savedStillValid = savedId && list.some((b) => b.branch_id === savedId);

    if (savedStillValid) {
      setCurrentBranch(savedId);
      return;
    }

    const primary = list.find((b) => b.is_primary) || list[0];
    if (primary) {
      setCurrentBranch(primary.branch_id);
      localStorage.setItem('currentBranch', primary.branch_id);
    }
  }, []);

  const logout = useCallback((message = 'Logged out successfully') => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentBranch');
    persistUser(null);
    clearCache();
    clearApiCache();
    setToken(null);
    setUser(null);
    setBranches([]);
    setCurrentBranch(null);
    if (message) toast.success(message);
  }, []);

  // The HTTP layer decides what counts as a real authentication failure. A 502
  // or a database blip no longer reaches this handler, which is what used to
  // throw people back to the login screen mid-session.
  useEffect(() => {
    return on('unauthorized', () => {
      if (localStorage.getItem('token')) {
        logout('Your session expired. Please sign in again.');
      }
    });
  }, [logout]);

  useEffect(() => on('offline', () => setDegraded(true)), []);
  useEffect(() => on('online', () => setDegraded(false)), []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`);
      applyUser(res.data, res.data.branches);
    } catch (error) {
      const status = error.response?.status;
      const code = error.response?.data?.code;

      const isAuthFailure =
        status === 401 &&
        (!code || ['NO_TOKEN', 'TOKEN_EXPIRED', 'TOKEN_INVALID', 'USER_NOT_FOUND'].includes(code));

      if (isAuthFailure) {
        logout('Your session expired. Please sign in again.');
        return;
      }

      // Anything else is the server having a bad moment. Keep the cached
      // session and carry on - the request layer is already retrying, and the
      // next successful call will refresh this.
      console.warn('Could not refresh user profile; keeping cached session.', status || error.message);
    } finally {
      setLoading(false);
    }
  }, [applyUser, logout]);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password }, { __noRetry: false });

      const { token: newToken, user: userData, branches: branchList } = res.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      applyUser(userData, branchList || []);

      toast.success(`Welcome ${userData.full_name || userData.username}!`);
      return { success: true };
    } catch (error) {
      const status = error.response?.status;

      if (status === 401) {
        toast.error('Invalid username or password');
      } else if (status === 503 || status === 502 || status === 504) {
        toast.error('Server is starting up. Please try again in a moment.');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot reach the server. Check your connection.');
      } else {
        toast.error(error.response?.data?.error || 'Login failed');
      }
      return { success: false, error: error.response?.data?.error };
    }
  };

  const switchBranch = (branchId) => {
    const hasAccess = branches.some((b) => b.branch_id === branchId);
    if (!hasAccess) {
      toast.error('You do not have access to this branch');
      return;
    }
    setCurrentBranch(branchId);
    localStorage.setItem('currentBranch', branchId);
    toast.success('Branch switched successfully');
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    const branchRoles = user.roles?.filter((r) => r.branch_id === currentBranch) || [];
    return branchRoles.some(
      (r) => r.permissions?.includes('*') || r.permissions?.includes(permission)
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        token,
        branches,
        currentBranch,
        switchBranch,
        hasPermission,
        setCurrentBranch,
        degraded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
