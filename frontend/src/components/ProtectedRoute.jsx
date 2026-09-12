import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Wrap staff pages with this. `roles` is optional — omit to allow any
// authenticated staff member; Boss always passes regardless of `roles`.
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  }
  if (!user) return <Navigate to="/staff/login" replace />;
  if (roles && !roles.includes(user.role) && user.role !== 'boss') {
    return <Navigate to="/staff/login" replace />;
  }
  return children;
}
