import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const HELP = {
  operator: {
    title: 'Operator qo‘llanmasi',
    steps: [
      ['Yangi buyurtmalar', 'Yangi tushgan buyurtmalarni ko‘ring va qabul qilish yoki rad etish tugmasidan foydalaning.'],
      ['Kuryer biriktirish', 'Yetkazib beriladigan buyurtmaga mavjud kuryerni tanlang va biriktiring.'],
      ['Buyurtmani kuzatish', 'Buyurtma holatini kuzatib boring va kerak bo‘lsa amaliy harakatni bajaring.'],
    ]
  },
  courier: {
    title: 'Kuryer qo‘llanmasi',
    steps: [
      ['Buyurtmani qabul qilish', 'Sizga biriktirilgan yetkazmalarni ko‘ring va buyurtma ma’lumotlarini tekshiring.'],
      ['Manzilga borish', 'Manzil ostidagi navigatsiya tugmasi orqali xaritani ochib, mijoz manziliga yo‘l oling.'],
      ['Yetkazilgach', 'Buyurtma holatini tizimdagi keyingi holatga o‘tkazing.'],
    ]
  },
  ofitsiant: {
    title: 'Ofitsiant qo‘llanmasi',
    steps: [
      ['Stollar', 'Stol holatini ko‘ring va bo‘sh yoki band holatini boshqaring.'],
      ['Stolga buyurtma', 'Kerakli stolni tanlab, yangi buyurtma yarating va taomlarni qo‘shing.'],
      ['Buyurtma holati', 'Faol stol buyurtmalarini kuzating va kerakli holatni yangilang.'],
    ]
  },
  cashier: {
    title: 'Kassir qo‘llanmasi',
    steps: [
      ['Buyurtmalar', 'To‘lov kutilayotgan buyurtmalarni ko‘rib chiqing va ma’lumotlarni tekshiring.'],
      ['To‘lov', 'Mijoz to‘lovini qabul qilgach, buyurtmani to‘lov qilingan holatga o‘tkazing.'],
      ['Kuryer va ofitsiant', 'Kerak bo‘lsa buyurtmaga kuryer yoki ofitsiant biriktirish amallaridan foydalaning.'],
    ]
  },
  staff: {
    title: 'Ishchi paneli qo‘llanmasi',
    steps: [
      ['Paneldan foydalanish', 'Sizga tegishli buyurtma, stol yoki yetkazma ishlarini shu paneldan boshqaring.'],
      ['Holatlarni tekshirish', 'Har bir buyurtma yoki vazifaning joriy holatini tekshirib, kerakli amalni bajaring.'],
      ['Qo‘llanma', 'Istalgan payt pastdagi ? tugmasini bosib, shu panel bo‘yicha qisqa qo‘llanmani ochishingiz mumkin.'],
    ]
  }
};

export default function StaffLayout({ title, children }) {
  const { user, logout } = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);
  const roleKey = String(user?.role || '').toLowerCase();
  const help = HELP[roleKey] || HELP.staff;
  const initial = (user?.name || 'I').slice(0, 1).toUpperCase();

  return (
    <div className="staff-shell">
      <aside className="staff-sidebar">
        <div className="staff-brand">
          <div className="staff-brand-mark">R</div>
          <div><div className="staff-brand-title">Restaurant</div><div className="staff-brand-subtitle">Ishchi paneli</div></div>
        </div>
        <div className="staff-sidebar-label">ISHCHI PANELI</div>
        <div className="staff-role-card">
          <div className="staff-role-icon">◉</div>
          <div><strong>{title}</strong><span>{user?.role || 'staff'}</span></div>
        </div>
        <div className="staff-sidebar-note"><span className="staff-online-dot" />Tizimga ulangan</div>
        <div className="staff-sidebar-footer">
          <div className="staff-user-card"><div className="staff-user-avatar">{initial}</div><div className="staff-user-info"><strong>{user?.name || 'Ishchi'}</strong><span>{user?.role || 'staff'}</span></div></div>
          <button className="staff-logout" onClick={logout}><span>↪</span> Chiqish</button>
        </div>
      </aside>

      <div className="staff-main">
        <header className="staff-topbar">
          <div><div className="staff-topbar-title">{title}</div><div className="staff-topbar-subtitle">Restaurant · Ishchi paneli</div></div>
          <div className="staff-topbar-user"><div className="staff-user-avatar">{initial}</div><div><strong>{user?.name || 'Ishchi'}</strong><small>{user?.role || 'staff'}</small></div></div>
        </header>
        <main className="staff-page">{children}</main>
      </div>

      <button className="staff-help-button" onClick={() => setHelpOpen(true)} aria-label="Qo‘llanma">?</button>
      {helpOpen && (
        <>
          <div className="staff-help-backdrop" onClick={() => setHelpOpen(false)} />
          <section className="staff-help-modal" role="dialog" aria-modal="true">
            <div className="staff-help-head">
              <h3>{help.title}</h3>
              <button className="staff-help-close" onClick={() => setHelpOpen(false)} aria-label="Yopish">×</button>
            </div>
            {help.steps.map(([heading, text], index) => (
              <div className="staff-help-step" key={heading}>
                <div className="staff-help-number">{index + 1}</div>
                <div><strong>{heading}</strong><p>{text}</p></div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
