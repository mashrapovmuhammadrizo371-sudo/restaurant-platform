import React, { useState } from 'react';
import { createHttpClient } from '../../services/httpClient';

const api = createHttpClient('staffToken');
const SUGGESTIONS = [
  'Saytimning bo‘limlari va xodimlar vazifalarini tushuntir.',
  'Saytimni yaxshilash uchun yangi g‘oyalar ber.',
  'Buyurtma jarayonida qaysi joylarni tekshirish kerak?',
  'Mijozlar uchun qulayliklarni qanday oshirsam bo‘ladi?'
];

export default function AdminAiPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Assalomu alaykum! Men Restaurant admin AI yordamchisiman. Sayt haqida savol bering, xato matnini yuboring yoki yangi g‘oya so‘rang.\n\nEslatma: hozircha men jonli buyurtmalar bazasi yoki production loglarini avtomatik ko‘ra olmayman.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendMessage(value = input) {
    const message = value.trim();
    if (!message || loading) return;
    setInput('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setLoading(true);
    try {
      const result = await api.post('/admin-ai/chat', { message });
      setMessages(prev => [...prev, { role: 'assistant', content: result.answer }]);
    } catch (err) {
      setError(err.message || 'AI bilan bog‘lanib bo‘lmadi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>ADMIN TOOLS</div>
        <h1 style={{ margin: '6px 0', fontSize: 28 }}>AI yordamchi</h1>
        <p style={{ margin: 0, color: '#64748b' }}>Sayt bo‘yicha ma’lumot, muammolarni tahlil qilish va yangi g‘oyalar.</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {SUGGESTIONS.map(s => <button key={s} type="button" onClick={() => sendMessage(s)} disabled={loading} style={{ border: '1px solid #dbe3ef', borderRadius: 12, padding: '9px 12px', background: '#fff', cursor: 'pointer', color: '#334155' }}>{s}</button>)}
      </div>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 18, background: '#fff', overflow: 'hidden', boxShadow: '0 8px 28px rgba(15,23,42,.05)' }}>
        <div style={{ minHeight: 320, maxHeight: 520, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m, i) => <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', whiteSpace: 'pre-wrap', lineHeight: 1.55, borderRadius: 14, padding: '12px 14px', background: m.role === 'user' ? '#1d4ed8' : '#f1f5f9', color: m.role === 'user' ? '#fff' : '#0f172a' }}>{m.content}</div>)}
          {loading && <div style={{ color: '#64748b' }}>AI javob tayyorlamoqda…</div>}
          {error && <div role="alert" style={{ color: '#b91c1c', background: '#fef2f2', borderRadius: 10, padding: 12 }}>{error}</div>}
        </div>
        <form onSubmit={e => { e.preventDefault(); sendMessage(); }} style={{ display: 'flex', gap: 10, borderTop: '1px solid #e2e8f0', padding: 12 }}>
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={2} maxLength={4000} placeholder="Savolingizni yozing yoki xatolik matnini kiriting..." style={{ flex: 1, resize: 'vertical', border: '1px solid #cbd5e1', borderRadius: 12, padding: 12, font: 'inherit', minWidth: 0 }} />
          <button type="submit" disabled={loading || !input.trim()} style={{ alignSelf: 'stretch', border: 0, borderRadius: 12, padding: '0 20px', background: '#1d4ed8', color: '#fff', fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}>{loading ? '...' : 'Yuborish'}</button>
        </form>
      </div>
      <p style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>AI javoblari tavsiya sifatida beriladi. Jonli buyurtmalar va texnik loglar hozircha avtomatik ulanmagan. Maxfiy ma’lumot, parol yoki API kalit yubormang.</p>
    </section>
  );
}
