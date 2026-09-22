import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useCustomerAuth();
  const [form, setForm] = useState({ name: '', surname: '', phone: '', password: '', confirmPassword: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!/^\+998 \d{2} \d{3} \d{2} \d{2}$/.test(form.phone)) return setError('Telefon raqami +998 XX XXX XX XX formatida bo‘lishi kerak.');
    if (form.password.length < 6) return setError('Parol kamida 6 ta belgidan iborat bo‘lishi kerak.');
    if (form.password !== form.confirmPassword) return setError('Parollar bir xil emas.');
    setLoading(true);
    try {
      await register(form.name.trim(), form.surname.trim(), form.phone.trim(), form.password, form.address.trim());
      navigate('/', { replace: true });
    } catch (err) { setError(err.message || 'Ro‘yxatdan o‘tishda xatolik.'); }
    finally { setLoading(false); }
  }

  return <div className="container" style={{ maxWidth: 560, paddingTop: 28, paddingBottom: 100 }}>
    <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
      <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: 18 }}>← Orqaga</button>
      <h2 style={{ marginTop: 0 }}>Регистрация</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Мижоз маълумотларингиз буюртмалар учун сақланади.</p>
      <form onSubmit={submit}>
        <div className="form-group"><label className="form-label">Имя</label><input className="input" value={form.name} onChange={e => update('name', e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Фамилия</label><input className="input" value={form.surname} onChange={e => update('surname', e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Номер телефона</label><input className="input" type="tel" inputMode="tel" placeholder="+998 XX XXX XX XX" value={form.phone} onChange={e => update('phone', e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Адрес</label><input className="input" value={form.address} onChange={e => update('address', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Пароль</label><input className="input" type="password" value={form.password} onChange={e => update('password', e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Подтвердить пароль</label><input className="input" type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required /></div>
        {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Сохранение...' : 'Зарегистрироваться'}</button>
      </form>
    </div>
  </div>;
}
