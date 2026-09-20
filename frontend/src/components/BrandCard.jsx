import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function BrandCard({ brand }) {
  const navigate = useNavigate();
  return (
    <div
      className="brand-card"
      onClick={() => navigate(`/brand/${brand._id}`)}
      style={{ borderTop: `4px solid ${brand.mainColor}` }}
    >
      {brand.logo && <img src={brand.logo} alt={brand.name} className="brand-card-logo" />}
      <div className="brand-card-name">{brand.name}</div>
      {brand.address && <div className="brand-card-address">{brand.address}</div>}
    </div>
  );
}
