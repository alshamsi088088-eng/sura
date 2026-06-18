
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
