import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  token: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    token: null,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT payload (don't verify - backend handles that)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        setAuthState({
          user: {
            id: payload.sub,
            email: payload.email,
            createdAt: new Date(payload.iat * 1000).toISOString(),
          },
          loading: false,
          token,
        });
      } catch {
        // Token is malformed, remove it
        localStorage.removeItem('token');
        setAuthState({
          user: null,
          loading: false,
          token: null,
        });
      }
    } else {
      setAuthState({
        user: null,
        loading: false,
        token: null,
      });
    }
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    setAuthState({
      user,
      loading: false,
      token,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      loading: false,
      token: null,
    });
  };

  return {
    ...authState,
    login,
    logout,
    isAuthenticated: !!authState.user,
  };
}
