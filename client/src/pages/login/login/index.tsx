import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginAsUser, loginAsAdmin } = useAuth();

  return (
    <div className="page">
      <div className="card">
        <h1>Login (Practice)</h1>
        <p>Choose role to test protected routing quickly.</p>
        <div className="row">
          <button
            onClick={() => {
              loginAsUser();
              navigate('/user', { replace: true });
            }}
          >
            Login as User
          </button>
          <button
            className="secondary"
            onClick={() => {
              loginAsAdmin();
              navigate('/admin', { replace: true });
            }}
          >
            Login as Admin
          </button>
        </div>
      </div>
    </div>
  );
}
