import { Navigate, createBrowserRouter } from 'react-router-dom';
import RootPage from '@/pages/(root)';
import LoginLayout from '@/pages/login';
import LoginPage from '@/pages/login/login';
import SignupPage from '@/pages/login/signup';
import UserPage from '@/pages/user';
import ChangePasswordPage from '@/pages/change-password';
import AdminLayout from '@/pages/admin';
import AdminDashboardPage from '@/pages/admin/dashboard';
import AdminUsersPage from '@/pages/admin/users';
import AdminProjectsPage from '@/pages/admin/projects';
import AdminAnalyticsPage from '@/pages/admin/analytics';
import AdminPromptApiPage from '@/pages/admin/prompt-api';
import AdminDataExtractionPage from '@/pages/admin/data-extraction';
import { ProtectedAdminRoute, ProtectedUserRoute } from '@/auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootPage />,
  },
  {
    path: '/user',
    element: (
      <ProtectedUserRoute>
        <UserPage />
      </ProtectedUserRoute>
    ),
  },
  {
    path: '/change-password',
    element: <ChangePasswordPage />,
  },
  {
    path: '/login',
    element: <LoginLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedAdminRoute>
        <AdminLayout />
      </ProtectedAdminRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <AdminDashboardPage />,
      },
      {
        path: 'users',
        element: <AdminUsersPage />,
      },
      {
        path: 'projects',
        element: <AdminProjectsPage />,
      },
      {
        path: 'analytics',
        element: <AdminAnalyticsPage />,
      },
      {
        path: 'prompt-api',
        element: <AdminPromptApiPage />,
      },
      {
        path: 'data-extraction',
        element: <AdminDataExtractionPage />,
      },
    ],
  },
]);
