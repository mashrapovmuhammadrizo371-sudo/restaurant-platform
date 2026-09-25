import React from 'react';
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx';
// Browsing is available without an account; registration is required at checkout.
export default function CustomerProtectedRoute({ children }) {
  const { loading, error, retry } = useCustomerAuth();
  if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  if (error) return <div className="empty-state" style={{ flexDirection: 'column', gap: 12 }}><div>Ulanishda muammo yuz berdi. Internetingizni tekshirib, qayta urinib ko'ring.</div><button className="btn btn-primary" onClick={retry}>Qayta urinish</button></div>;
  return children;
}