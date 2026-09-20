import React, { useState } from 'react';
import { resetEmployeePassword } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext.jsx';

// Minimal settings page: account info + self password change. Password
// change reuses the employee-reset endpoint targeting one's own id, which
// works for Boss (always bypasses permission checks) and for any Admin who
// holds 'employees.manage'. An Admin without that permission will see a
// clear error from the API rather than a silent failure.
export default function SettingsPage() {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleChangePassword(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await resetEmployeePassword(user._id, newPassword);
      setMessage('Parol yangilandi');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Sozlamalar</h2>

      <div className="card" style={{ maxWidth: 400 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Hisob ma'lumotlari</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ism: {user?.name}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Login: {user?.login}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Rol: {user?.role}</div>
      </div>

      <form onSubmit={handleChangePassword} className="card" style={{ maxWidth: 400, marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Parolni o'zgartirish</div>
        <div className="form-group">
          <label className="form-label">Yangi parol</label>
          <input type="password" className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
        </div>
        {message && <div className="success-text">{message}</div>}
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary">Yangilash</button>
      </form>
    </div>
  );
}
