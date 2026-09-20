import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx';

// Wrap customer pages with this. Mirrors ProtectedRoute.jsx but checks the
// customer session instead of the staff session — the two are independent.
export default function CustomerProtectedRoute({ children }) {
  const { customer, loading } = useCustomerAuth();

  if (loading) {
    return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  }
  if (!customer) return <Navigate to="/login" replace />;
  return children;
}
