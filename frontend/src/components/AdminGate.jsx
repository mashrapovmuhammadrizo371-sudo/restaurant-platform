import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import StaffLoginPage from '../pages/StaffLoginPage.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';

const REDIRECT_BY_ROLE = {
  operator: '/operator',
  courier: '/courier',
  ofitsiant: '/ofitsiant',
  cashier: '/cashier'
};

// Single staff/admin entry point: "/admin" itself IS the shared login
// page when logged out, and the Big Admin panel (via AdminLayout + its
// nested routes in App.jsx) when logged in as boss/admin. Every other
// staff role gets redirected to their own panel automatically — nobody
// picks their role at login, it's detected from the account (see
// StaffLoginPage/AuthContext).
//
// This replaces the old separate "/staff/login" route + a plain
// ProtectedRoute wrapping "/admin": those can't both occupy the literal
// path "/admin" in react-router, so the auth/role branching has to live
// in one gate component instead.
export default function AdminGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  }

  if (!user) return <StaffLoginPage />;

  if (user.role !== 'boss' && user.role !== 'admin') {
    return <Navigate to={REDIRECT_BY_ROLE[user.role] || '/admin'} replace />;
  }

  return <AdminLayout />;
}
