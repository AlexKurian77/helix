import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL, fetchWithAuth } from './api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  is_google?: boolean;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  login: (token: string) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  const fetchUserProfile = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Failed to fetch user profile", e);
      setUser(null);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('access_token');
    if (stored) {
      setToken(stored);
      fetchUserProfile();
    }
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
    // Directly fetch profile after setting token
    fetchUserProfile();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, refreshProfile: fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function getFirstName(fullName: string): string {
  if (!fullName) return "";
  const cleanName = fullName.replace(/^(dr\.|dr|prof\.|prof|mr\.|mr|ms\.|ms|mrs\.|mrs)\s+/i, "");
  return cleanName.split(/\s+/)[0];
}


