import React, { useState } from 'react';

export default function LocationInput({ value, onChange, onLocation, placeholder, rows = 0 }) {
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
        const latitude = Number(coords.latitude);
        const longitude = Number(coords.longitude);
        const accuracy = Number(coords.accuracy);
        onLocation?.({ latitude, longitude, accuracy });
        try {
          // BigDataCloud is city/suburb level only, so use a street-level
          // reverse geocoder for the actual road/building address.
          const url = new URL('https://nominatim.openstreetmap.org/reverse');
          url.searchParams.set('format', 'jsonv2');
          url.searchParams.set('lat', latitude);
          url.searchParams.set('lon', longitude);
          url.searchParams.set('zoom', '18');
          url.searchParams.set('addressdetails', '1');
          const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
          if (!response.ok) throw new Error();
          const data = await response.json();
          const a = data.address || {};
          const address = [
            a.road || a.pedestrian || a.footway,
            a.house_number,
            a.house_name,
            a.suburb || a.neighbourhood,
            a.city_district || a.town || a.city || a.village,
            a.state
          ].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i).join(', ');
          if (address) onChange(address);
          else setError(`Aniq koordinata olindi (${latitude.toFixed(6)}, ${longitude.toFixed(6)}), lekin ko‘cha/manzil topilmadi.`);
        } catch {
          setError(`Aniq koordinata olindi: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}. Ko‘cha manzilini avtomatik topib bo‘lmadi.`);
        } finally { setLoading(false); }
      },
      err => {
        const messages = { 1: "Joylashuvga ruxsat berilmadi.", 2: "Joylashuvni aniqlab bo‘lmadi.", 3: "Joylashuvni aniqlash vaqti tugadi." };
        setError(messages[err.code] || "Joylashuvni aniqlab bo‘lmadi.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
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
