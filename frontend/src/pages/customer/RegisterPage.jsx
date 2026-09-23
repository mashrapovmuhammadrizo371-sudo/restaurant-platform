import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx';
import { formatUzPhoneInput, UZ_PHONE_PLACEHOLDER } from '../../utils/phone.js';
import LocationInput from '../../components/LocationInput.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useCustomerAuth();
  const [form, setForm] = useState({ name: '', surname: '', phone: '', password: '', confirmPassword: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const recaptchaRef = useRef(null);
  const recaptchaWidgetRef = useRef(null);
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!recaptchaSiteKey || !recaptchaRef.current) return;

    let cancelled = false;
    let timer = null;

    const renderRecaptcha = () => {
      if (
        cancelled ||
        !window.grecaptcha ||
        !recaptchaRef.current ||
        recaptchaWidgetRef.current !== null
      ) return;

      try {
        recaptchaWidgetRef.current = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: recaptchaSiteKey,
          theme: 'light',
          callback: token => setRecaptchaToken(token),
          'expired-callback': () => setRecaptchaToken(''),
          'error-callback': () => setRecaptchaToken('')
        });
      } catch (err) {
        // The script may still be initializing; retry shortly.
        timer = window.setTimeout(renderRecaptcha, 300);
      }
    };

    const waitForRecaptcha = () => {
      if (cancelled) return;
      if (window.grecaptcha) {
        window.grecaptcha.ready(renderRecaptcha);
        return;
      }
      timer = window.setTimeout(waitForRecaptcha, 300);
    };

    const existingScript = document.querySelector('script[src^="https://www.google.com/recaptcha/api.js"]');

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = waitForRecaptcha;
      script.onerror = () => setError('reCAPTCHA yuklanmadi. Internet yoki domen sozlamasini tekshiring.');
      document.head.appendChild(script);
    }

    waitForRecaptcha();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [recaptchaSiteKey]);

  async function detectAddress() {
    if (!navigator.geolocation) {
      setError('Bu qurilmada joylashuvni aniqlash qo‘llab-quvvatlanmaydi.');
      return;
    }
    setLocationLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords;
        try {
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ru`);
          if (!response.ok) throw new Error('Address lookup failed');
          const data = await response.json();
          const address = [data.locality, data.city, data.principalSubdivision, data.countryName]
            .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
          if (address) update('address', address);
          else setError('Joylashuv aniqlandi, lekin manzilni olishning iloji bo‘lmadi.');
        } catch {
          setError('Manzilni avtomatik aniqlab bo‘lmadi.');
        } finally {
          setLocationLoading(false);
        }
      },
      err => {
        const messages = { 1: 'Joylashuvga ruxsat berilmadi.', 2: 'Joylashuvni aniqlab bo‘lmadi.', 3: 'Joylashuvni aniqlash vaqti tugadi.' };
        setError(messages[err.code] || 'Joylashuvni aniqlab bo‘lmadi.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!/^\+998 \d{2} \d{3} \d{2} \d{2}$/.test(form.phone)) return setError('Telefon raqami +998 XX XXX XX XX formatida bo‘lishi kerak.');
    if (form.password.length < 6) return setError('Parol kamida 6 ta belgidan iborat bo‘lishi kerak.');
    if (form.password !== form.confirmPassword) return setError('Parollar bir xil emas.');
    if (!recaptchaSiteKey) return setError('reCAPTCHA hali sozlanmagan.');
    if (!recaptchaToken) return setError('I am not a robot tasdiqlash katagiga bosing.');
    setLoading(true);
    try {
      await register(form.name.trim(), form.surname.trim(), form.phone.trim(), form.password, form.address.trim(), recaptchaToken);
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
        <div className="form-group"><label className="form-label">Номер телефона</label><input className="input" type="tel" inputMode="numeric" placeholder={UZ_PHONE_PLACEHOLDER} value={form.phone || '+998 '} onFocus={() => { if (!form.phone) update('phone', '+998 '); }} onChange={e => update('phone', formatUzPhoneInput(e.target.value))} required /></div>
        <div className="form-group">
          <label className="form-label">Адрес</label>
          <LocationInput value={form.address} onChange={address => update('address', address)} placeholder="Введите адрес" />
        </div>
        <div className="form-group" style={{ marginTop: 18, marginBottom: 18 }}><div ref={recaptchaRef} /></div>
        <div className="form-group"><label className="form-label">Пароль</label><input className="input" type="password" value={form.password} onChange={e => update('password', e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Подтвердить пароль</label><input className="input" type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required /></div>
        {error && <div className="error-text" style={{ marginBottom: 12 }}>{error}</div>}
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Сохранение...' : 'Зарегистрироваться'}</button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 14 }}>
        <span style={{ color: 'var(--text-muted)' }}>У меня уже есть аккаунт</span>{' '}
        <button type="button" className="btn" style={{ padding: 0, background: 'transparent', color: 'var(--primary)', fontWeight: 700 }} onClick={() => navigate('/login')}>
          Войти
        </button>
      </div>
    </div>
  </div>;
}
