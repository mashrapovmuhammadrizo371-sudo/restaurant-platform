import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../../services/customerService';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then(res => setRows(res.leaderboard)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container" style={{ paddingTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>←</button>
        <h2 style={{ margin: 0 }}>🏆 Reyting</h2>
      </div>

      {loading && <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>}
      {!loading && !rows.length && <div className="empty-state">Hozircha reyting mavjud emas</div>}

      {!loading && rows.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          {rows.map((r, idx) => (
            <div key={r._id} className="leaderboard-row">
              <div className="leaderboard-rank">{idx + 1}</div>
              <div style={{ flex: 1, fontWeight: 600 }}>{r.name}</div>
              <div style={{ fontWeight: 700, color: 'var(--brand-color)' }}>{r.points} ball</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
