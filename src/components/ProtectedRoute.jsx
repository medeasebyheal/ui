import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentLayout from './student/StudentLayout';
import AdminLayout from './admin/AdminLayout';

export function StudentRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex justify-center items-center min-h-[40vh]"><p>Loading...</p></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== 'student') return <Navigate to={(user.role === 'admin' || user.role === 'superadmin') ? '/admin' : '/'} replace />;
  return <StudentLayout />;
}

export function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex justify-center items-center min-h-[40vh]"><p>Loading...</p></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== 'admin' && user.role !== 'superadmin') return <Navigate to="/student" replace />;
  return <AdminLayout />;
}
