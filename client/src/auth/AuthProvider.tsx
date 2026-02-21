import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type AuthContextValue = {
  isLogin: boolean;
  isStaff: boolean;
  isLoading: boolean;
  loginAsUser: () => void;
  loginAsAdmin: () => void;
  logout: () => void;
};

type StoredAuth = {
  isLogin: boolean;
  isStaff: boolean;
};

const STORAGE_KEY = 'adp-auth-state';

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): StoredAuth {
  const fallback: StoredAuth = { isLogin: false, isStaff: false };
  if (typeof window === 'undefined') {
    return fallback;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    return {
      isLogin: Boolean(parsed.isLogin),
      isStaff: Boolean(parsed.isStaff),
    };
  } catch {
    return fallback;
  }
}

function persistAuth(state: StoredAuth): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth>(() => readStoredAuth());

  const value = useMemo<AuthContextValue>(
    () => ({
      isLogin: auth.isLogin,
      isStaff: auth.isStaff,
      isLoading: false,
      loginAsUser: () => {
        const next = { isLogin: true, isStaff: false };
        persistAuth(next);
        setAuth(next);
      },
      loginAsAdmin: () => {
        const next = { isLogin: true, isStaff: true };
        persistAuth(next);
        setAuth(next);
      },
      logout: () => {
        const next = { isLogin: false, isStaff: false };
        persistAuth(next);
        setAuth(next);
      },
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
}
