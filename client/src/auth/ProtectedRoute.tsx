import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import type { ReactNode } from 'react';

type ProtectedRouteProps = {
  children: ReactNode;
  requireLogin?: boolean;
  requireStaff?: boolean;
};

export function ProtectedRoute({ children, requireLogin = false, requireStaff = false }: ProtectedRouteProps) {
  const { isLogin, isStaff, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (requireLogin && !isLogin) {
    return <Navigate to="/login" replace />;
  }

  if (requireStaff && (!isLogin || !isStaff)) {
    return <Navigate to="/user" replace />;
  }

  return <>{children}</>;
}

export function ProtectedUserRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute requireLogin>{children}</ProtectedRoute>;
}

export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireLogin requireStaff>
      {children}
    </ProtectedRoute>
  );
}
