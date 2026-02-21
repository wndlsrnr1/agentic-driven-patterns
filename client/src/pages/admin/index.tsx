import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';

export default function AdminLayout() {
  const { logout } = useAuth();

  return (
    <div className="page">
      <div className="card">
        <h1>Admin Area</h1>
        <div className="nav">
          <Link to="/admin/dashboard">Dashboard</Link>
          <Link to="/admin/users">Users</Link>
          <Link to="/admin/projects">Projects</Link>
          <Link to="/admin/analytics">Analytics</Link>
          <Link to="/admin/prompt-api">Prompt API</Link>
          <Link to="/admin/data-extraction">Data Extraction</Link>
          <button className="secondary" onClick={logout}>
            Logout
          </button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
