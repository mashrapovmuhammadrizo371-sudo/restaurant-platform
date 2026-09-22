import React from 'react';
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx';

// Wrap customer pages with this. Customer registration/login is
// temporarily removed — there is no login page to redirect to. An
// anonymous session is created automatically (see CustomerAuthContext),
// so this just waits for that to finish and only shows a blocking state
// on a genuine, repeated network failure (with a manual retry).
export default function CustomerProtectedRoute({ children }) {
  const { customer, loading, error, retry } = useCustomerAuth();

  if (loading) {
    return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  }

  if (error === 'blocked') {
    return <div className="empty-state" style={{ flexDirection: 'column', gap: 12 }}><div style={{ fontWeight: 750 }}>Аккаунт заблокирован</div><div style={{ color: 'var(--text-muted)' }}>Обратитесь в ресторан для разблокировки.</div></div>;
  }

  if (!customer || error) {
    return (
      <div className="empty-state" style={{ flexDirection: 'column', gap: 12 }}>
        <div>Ulanishda muammo yuz berdi. Internetingizni tekshirib, qayta urinib ko'ring.</div>
        <button className="btn btn-primary" onClick={retry}>Qayta urinish</button>
      </div>
    );
  }

  return children;
}
