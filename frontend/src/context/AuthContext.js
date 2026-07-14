import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '@/features/auth/api/auth.service';
import appStorage from '@/utils/appStorage';
import { STORAGE_KEYS } from '@/utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedToken = await appStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const storedUser = await appStorage.getItem(STORAGE_KEYS.USER_DATA);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser);
        setIsAuthenticated(true);
      } else {
        // Fallback to session check
        const session = await authService.getSession();
        if (session?.user) {
          setUser(session.user);
          setToken(session.token || null);
          setIsAuthenticated(true);
        }
      }
    } catch (err) {
      console.error('Error loading user session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const loginUser = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.login(credentials);
      if (response?.user && response?.token) {
        setUser(response.user);
        setToken(response.token);
        setIsAuthenticated(true);
        return { payload: { user: response.user, token: response.token } };
      }
      throw new Error("Invalid response from server");
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const registerUser = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.register(userData);
      if (response?.user && response?.token) {
        setUser(response.user);
        setToken(response.token);
        setIsAuthenticated(true);
        return { payload: { user: response.user, token: response.token } };
      }
      throw new Error("Invalid response from server");
    } catch (err) {
      setError(err.message || "Registration failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    loginUser,
    logoutUser,
    registerUser,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
