import React from 'react';

const LABELS = {
  new: 'Yangi',
  accepted: 'Qabul qilindi',
  delivering: 'Yetkazilmoqda',
  delivered: 'Yetkazildi',
  rejected: 'Rad etildi',
  preparing: 'Tayyorlanmoqda',
  ready: 'Tayyor',
  completed: 'Yakunlandi'
};

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{LABELS[status] || status}</span>;
}
