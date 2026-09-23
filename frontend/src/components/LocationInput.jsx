import React, { useState } from 'react';

export default function LocationInput({ value, onChange, placeholder, rows = 0 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function detect() {
    if (!navigator.geolocation) {
      setError("Bu qurilmada joylashuvni aniqlash qo‘llab-quvvatlanmaydi.");
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=ru`
          );
          if (!response.ok) throw new Error();
          const data = await response.json();
          const address = [data.locality, data.city, data.principalSubdivision, data.countryName]
            .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
          if (address) onChange(address);
          else setError("Joylashuv aniqlandi, lekin manzilni olishning iloji bo‘lmadi.");
        } catch {
          setError("Manzilni avtomatik aniqlab bo‘lmadi.");
        } finally { setLoading(false); }
      },
      err => {
        const messages = { 1: "Joylashuvga ruxsat berilmadi.", 2: "Joylashuvni aniqlab bo‘lmadi.", 3: "Joylashuvni aniqlash vaqti tugadi." };
        setError(messages[err.code] || "Joylashuvni aniqlab bo‘lmadi.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  const style = { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', cursor: loading ? 'wait' : 'pointer', display: 'grid', placeItems: 'center', fontSize: 18, padding: 0 };
  return <div>
    <div style={{ position: 'relative' }}>
      {rows ? <textarea className="input" rows={rows} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ paddingRight: 52 }} /> :
        <input className="input" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ paddingRight: 52 }} />}
      <button type="button" onClick={detect} disabled={loading} title="Joriy joylashuvni aniqlash" aria-label="Joriy joylashuvni aniqlash" style={style}>{loading ? '⏳' : '📍'}</button>
    </div>
    {error && <div className="error-text" style={{ marginTop: 5 }}>{error}</div>}
  </div>;
}
