import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx';

// Customer entry point. Deliberately simple: a name and a "Kirish"
// button — no phone, no password, no separate registration step. See
// CustomerAuthContext.continueAsGuest() / backend authController.customerGuest.
export default function CustomerLoginPage() {
  const { continueAsGuest } = useCustomerAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Ismingizni kiriting');
      return;
    }
    setLoading(true);
    try {
      await continueAsGuest(name.trim());
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'radial-gradient(circle at 20% 20%, #ffede3 0%, var(--bg) 55%)'
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: 'var(--brand-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              margin: '0 auto 16px',
              boxShadow: '0 10px 24px -8px rgba(255, 90, 31, 0.55)'
            }}
          >
            🍔
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>Xush kelibsiz!</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            Buyurtma berishni boshlash uchun ismingizni kiriting
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card"
          style={{ boxShadow: '0 20px 40px -24px rgba(0,0,0,0.25)' }}
        >
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Ismingiz</label>
            <input
              className="input"
              style={{ padding: '13px 14px', fontSize: 15 }}
              placeholder="Masalan: Aziz"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          {error && <div className="error-text" style={{ marginBottom: 8 }}>{error}</div>}

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '13px 16px', fontSize: 15 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Kirish →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 18 }}>
          Davom etish orqali siz bizning xizmat shartlarimizga rozilik bildirasiz
        </p>
      </div>
    </div>
  );
}
