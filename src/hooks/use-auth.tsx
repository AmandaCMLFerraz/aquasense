import * as SecureStore from "expo-secure-store";
import * as React from "react";
import { Platform } from "react-native";

import { ApiError, authApi, type AuthUser } from "@/lib/api";
import { unregisterPushToken } from "@/lib/push";

const ACCESS_TOKEN_KEY = "aquasense.accessToken";
const REFRESH_TOKEN_KEY = "aquasense.refreshToken";
const USER_KEY = "aquasense.user";

const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

async function persistSession(
  user: AuthUser,
  accessToken: string,
  refreshToken: string,
) {
  await Promise.all([
    secureStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
    secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
    secureStorage.setItem(USER_KEY, JSON.stringify(user)),
  ]);
}

async function clearSession() {
  await Promise.all([
    secureStorage.deleteItem(ACCESS_TOKEN_KEY),
    secureStorage.deleteItem(REFRESH_TOKEN_KEY),
    secureStorage.deleteItem(USER_KEY),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const accessTokenRef = React.useRef<string | null>(null);
  const refreshTokenRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const [accessToken, refreshToken, storedUser] = await Promise.all([
          secureStorage.getItem(ACCESS_TOKEN_KEY),
          secureStorage.getItem(REFRESH_TOKEN_KEY),
          secureStorage.getItem(USER_KEY),
        ]);

        if (!accessToken || !refreshToken || !storedUser) {
          return;
        }

        const tokens = await authApi.refresh(refreshToken);
        accessTokenRef.current = tokens.accessToken;
        refreshTokenRef.current = tokens.refreshToken;
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        await persistSession(
          parsedUser,
          tokens.accessToken,
          tokens.refreshToken,
        );
        setUser(parsedUser);
        setAccessToken(tokens.accessToken);
      } catch {
        await clearSession();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = React.useCallback(async (email: string, password: string) => {
    const { user: loggedUser, accessToken, refreshToken } =
      await authApi.login(email, password);
    accessTokenRef.current = accessToken;
    refreshTokenRef.current = refreshToken;
    await persistSession(loggedUser, accessToken, refreshToken);
    setUser(loggedUser);
    setAccessToken(accessToken);
  }, []);

  const logout = React.useCallback(async () => {
    try {
      if (accessTokenRef.current) {
        await unregisterPushToken(accessTokenRef.current);
        await authApi.logout(accessTokenRef.current);
      }
    } catch {
    } finally {
      accessTokenRef.current = null;
      refreshTokenRef.current = null;
      await clearSession();
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const deleteAccount = React.useCallback(async () => {
    if (accessTokenRef.current) {
      await authApi.deleteAccount(accessTokenRef.current);
    }
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    await clearSession();
    setUser(null);
    setAccessToken(null);
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      deleteAccount,
    }),
    [user, accessToken, isLoading, login, logout, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export { ApiError };
