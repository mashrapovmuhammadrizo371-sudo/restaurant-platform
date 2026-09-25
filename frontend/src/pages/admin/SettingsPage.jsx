import React, { useState } from 'react';
import { resetEmployeePassword } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAdminPaymentCard, saveAdminPaymentCard } from '../../services/paymentCardService';

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
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardLoading, setCardLoading] = useState(true);
  const [cardSaving, setCardSaving] = useState(false);
  const [cardMessage, setCardMessage] = useState('');

  React.useEffect(() => {\n    getAdminPaymentCard()\n      .then(res => {\n        const card = res?.card;\n        if (card) {\n          setCardNumber(String(card.cardNumber || '').replace(/\\D/g, '').replace(/(.{4})/g, '$1 ').trim());\n          setCardHolder(card.cardHolder || '');\n        }\n      })\n      .catch(err => setError(err.message))\n      .finally(() => setCardLoading(false));\n  }, []);\n\n  function formatCardNumber(value) {\n    return String(value || '').replace(/\\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();\n  }\n\n  async function handleSaveCard(e) {\n    e.preventDefault();\n    setCardMessage('');\n    setError('');\n    const raw = cardNumber.replace(/\\D/g, '');\n    if (raw.length < 12) {\n      setError('Karta raqamini to‘liq kiriting');\n      return;\n    }\n    setCardSaving(true);\n    try {\n      await saveAdminPaymentCard({ cardNumber: raw, cardHolder });\n      setCardNumber(formatCardNumber(raw));\n      setCardMessage('Karta saqlandi');\n    } catch (err) {\n      setError(err.message);\n    } finally {\n      setCardSaving(false);\n    }\n  }\n\n  async function handleChangePassword(e) {
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

      <form onSubmit={handleSaveCard} className="card" style={{ maxWidth: 500, marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>💳 Karta qo‘shish</div>
        <div className="form-group">
          <label className="form-label">Karta raqami</label>
          <input
            className="input"
            value={cardNumber}
            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="XXXX XXXX XXXX XXXX"
            inputMode="numeric"
            autoComplete="off"
            maxLength={23}
            disabled={cardLoading || cardSaving}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Karta egasi</label>
          <input
            className="input"
            value={cardHolder}
            onChange={e => setCardHolder(e.target.value)}
            placeholder="ISM FAMILIYA"
            disabled={cardLoading || cardSaving}
          />
        </div>
        {cardMessage && <div className="success-text">{cardMessage}</div>}
        <button className="btn btn-primary" disabled={cardLoading || cardSaving}>
          {cardSaving ? <span className="spinner" /> : 'Kartani saqlash'}
        </button>
      </form>

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
