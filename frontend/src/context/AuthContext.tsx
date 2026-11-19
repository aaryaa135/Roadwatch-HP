import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import {
  ApiError,
  getCurrentUser,
  getStoredToken,
  loginUser,
  registerUser,
  setStoredToken,
} from "../services/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
    district?: string;
  }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUserState(null);
      setLoading(false);
      return;
    }
    try {
      const currentUser = await getCurrentUser();
      setUserState(currentUser);
      setToken(currentToken);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setStoredToken(null);
        setToken(null);
        setUserState(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginUser({ email, password });
    setStoredToken(response.access_token);
    setToken(response.access_token);
    setUserState(response.user);
    return response.user;
  }, []);

  const register = useCallback(
    async (payload: {
      full_name: string;
      email: string;
      password: string;
      phone?: string;
      district?: string;
    }) => {
      const response = await registerUser(payload);
      setStoredToken(response.access_token);
      setToken(response.access_token);
      setUserState(response.user);
      return response.user;
    },
    []
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUserState(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      isAdmin: user?.role === "admin",
      login,
      register,
      logout,
      refreshUser,
      setUser: setUserState,
    }),
    [user, token, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
