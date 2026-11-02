import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginUser as apiLogin,
  registerUser as apiRegister,
  logoutUser as apiLogout,
  getUserProfile,
  updateUserProfile as apiUpdateProfile,
  saveScheme as apiSaveScheme,
  removeSavedScheme as apiRemoveSavedScheme,
  getMyNotifications,
} from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sarkarisetu_token') || null);
  const [loading, setLoading] = useState(true);
  const [savedSchemeIds, setSavedSchemeIds] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Fetch current user details & notifications
  const loadUser = useCallback(async () => {
    const savedToken = localStorage.getItem('sarkarisetu_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await getUserProfile();
      if (res?.data) {
        setUser(res.data);
        const ids = (res.data.savedSchemes || []).map((s) => (typeof s === 'string' ? s : s._id));
        setSavedSchemeIds(ids);

        // Fetch unread notifications
        try {
          const notifRes = await getMyNotifications();
          if (notifRes?.unreadCount !== undefined) {
            setUnreadNotifCount(notifRes.unreadCount);
          }
        } catch (e) {
          console.warn('Could not load notifications', e);
        }
      }
    } catch (err) {
      console.warn('Failed to restore user session:', err.message);
      localStorage.removeItem('sarkarisetu_token');
      setToken(null);
      setUser(null);
      setSavedSchemeIds([]);
      setUnreadNotifCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
      setSavedSchemeIds([]);
      setUnreadNotifCount(0);
    };

    window.addEventListener('sarkarisetu:session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('sarkarisetu:session_expired', handleSessionExpired);
    };
  }, [loadUser]);

  // Login
  const login = async (email, password) => {
    const res = await apiLogin({ email, password });
    if (res?.data?.token) {
      localStorage.setItem('sarkarisetu_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data);
      const ids = (res.data.savedSchemes || []).map((s) => (typeof s === 'string' ? s : s._id));
      setSavedSchemeIds(ids);

      try {
        const notifRes = await getMyNotifications();
        if (notifRes?.unreadCount !== undefined) {
          setUnreadNotifCount(notifRes.unreadCount);
        }
      } catch (e) {}
    }
    return res;
  };

  // Register
  const register = async (name, email, password) => {
    const res = await apiRegister({ name, email, password });
    if (res?.data?.token) {
      localStorage.setItem('sarkarisetu_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data);
      setSavedSchemeIds([]);
      setUnreadNotifCount(0);
    }
    return res;
  };

  // Logout
  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      // Proceed even if server is unreachable
    }
    localStorage.removeItem('sarkarisetu_token');
    setToken(null);
    setUser(null);
    setSavedSchemeIds([]);
    setUnreadNotifCount(0);
  };

  // Update Profile
  const updateProfile = async (profileData) => {
    const res = await apiUpdateProfile(profileData);
    if (res?.data) {
      setUser((prev) => ({ ...prev, ...res.data }));
    }
    return res;
  };

  // Toggle Save / Bookmark Scheme
  const toggleSaveScheme = async (schemeId) => {
    if (!user) {
      throw new Error('Please login to bookmark schemes');
    }

    const isSaved = savedSchemeIds.includes(schemeId);
    if (isSaved) {
      await apiRemoveSavedScheme(schemeId);
      setSavedSchemeIds((prev) => prev.filter((id) => id !== schemeId));
      return false;
    } else {
      await apiSaveScheme(schemeId);
      setSavedSchemeIds((prev) => [...prev, schemeId]);
      return true;
    }
  };

  const isSchemeSaved = (schemeId) => {
    return savedSchemeIds.includes(schemeId);
  };

  const refreshNotifications = async () => {
    try {
      const notifRes = await getMyNotifications();
      if (notifRes?.unreadCount !== undefined) {
        setUnreadNotifCount(notifRes.unreadCount);
      }
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loading,
        savedSchemeIds,
        unreadNotifCount,
        login,
        register,
        logout,
        updateProfile,
        toggleSaveScheme,
        isSchemeSaved,
        refreshUser: loadUser,
        refreshNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
