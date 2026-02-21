import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';

export default function RootPage() {
  const navigate = useNavigate();
  const { isLogin, isStaff, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isLogin) {
      navigate('/login', { replace: true });
      return;
    }

    navigate(isStaff ? '/admin' : '/user', { replace: true });
  }, [isLoading, isLogin, isStaff, navigate]);

  return null;
}
