import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx';
import { updateMyProfile, addMyAddress, deleteMyAddress } from '../../services/customerService';

export default function ProfilePage() {
  const { customer, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(customer?.name || '');
  const [addresses, setAddresses] = useState(customer?.addresses || []);
  const [newAddress, setNewAddress] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function saveName() {
    setError(''); setMessage('');
    try {
      await updateMyProfile({ name });
      setMessage('Saqlandi');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddAddress() {
    if (!newAddress) return;
    setError('');
    try {
      const res = await addMyAddress({ address: newAddress });
      setAddresses(res.customer.addresses);
      setNewAddress('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteAddress(addressId) {
    setError('');
    try {
      const res = await deleteMyAddress(addressId);
      setAddresses(res.customer.addresses);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="container" style={{ paddingTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>Profil</h2>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Ism</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={saveName}>Saqlash</button>
        {message && <div className="success-text">{message}</div>}
        {error && <div className="error-text">{error}</div>}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Manzillar</div>
        {!addresses.length && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manzillar yo'q</div>}
        {addresses.map(a => (
          <div key={a._id} className="cart-line">
            <span>{a.address}{a.isDefault ? ' (asosiy)' : ''}</span>
            <button className="btn btn-secondary" onClick={() => handleDeleteAddress(a._id)}>🗑</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input className="input" value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Yangi manzil" />
          <button className="btn btn-secondary" onClick={handleAddAddress}>Qo'shish</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Sodiqlik ballari</span>
        <strong style={{ color: 'var(--brand-color)' }}>{customer?.points || 0} ball</strong>
      </div>

      <button className="btn btn-secondary" style={{ width: '100%', marginTop: 16 }} onClick={handleLogout}>
        Chiqish
      </button>
    </div>
  );
}
