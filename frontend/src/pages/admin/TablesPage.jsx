import React, { useEffect, useState } from 'react';
import BrandSelector from '../../components/BrandSelector.jsx';
import { getStaffTables, createTable, updateTable, deleteTable } from '../../services/tableService';

export default function TablesPage() {
  const [brandId, setBrandId] = useState(null);
  const [tables, setTables] = useState([]);
  const [newNumber, setNewNumber] = useState('');
  const [error, setError] = useState('');

  function load() {
    if (!brandId) return;
    getStaffTables(brandId).then(res => setTables(res.tables)).catch(err => setError(err.message));
  }
  useEffect(load, [brandId]);

  async function handleAdd() {
    if (!newNumber) return;
    try {
      await createTable({ brand: brandId, number: Number(newNumber) });
      setNewNumber('');
      load();
    } catch (err) { setError(err.message); }
  }
  async function toggleStatus(t) {
    try {
      await updateTable(t._id, { status: t.status === 'available' ? 'busy' : 'available' });
      load();
    } catch (err) { setError(err.message); }
  }
  async function handleDelete(id) {
    if (!window.confirm("Stolni o'chirishga ishonchingiz komilmi?")) return;
    try { await deleteTable(id); load(); } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Stollar</h2>
      <BrandSelector value={brandId} onChange={setBrandId} />
      {error && <div className="error-text">{error}</div>}

      {brandId && (
        <>
          <div className="card" style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <input className="input" type="number" min={1} value={newNumber} onChange={e => setNewNumber(e.target.value)} placeholder="Stol raqami" />
            <button className="btn btn-primary" onClick={handleAdd}>Qo'shish</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginTop: 16 }}>
            {tables.map(t => (
              <div key={t._id} className="card">
                <div style={{ fontWeight: 700 }}>Stol #{t.number}</div>
                <span className={`status-badge ${t.status === 'available' ? 'status-delivered' : 'status-rejected'}`}>
                  {t.status === 'available' ? "Bo'sh" : 'Band'}
                </span>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button className="btn btn-secondary" onClick={() => toggleStatus(t)}>O'zgartirish</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(t._id)}>O'chirish</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
