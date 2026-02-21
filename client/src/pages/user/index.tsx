import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { PromptChainForm } from '@/features/prompt-chain/components/PromptChainForm';

export default function UserPage() {
  const navigate = useNavigate();
  const { logout, isStaff } = useAuth();

  return (
    <div className="page">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <h1>User Workspace</h1>
        <div className="row">
          {isStaff ? (
            <button className="secondary" onClick={() => navigate('/admin')}>
              Admin
            </button>
          ) : null}
          <button className="secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
      <PromptChainForm />
    </div>
  );
}
