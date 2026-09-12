import React, { useEffect, useState } from 'react';
import { getBrands } from '../services/brandService';

export default function BrandSelector({ value, onChange }) {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    getBrands().then(res => {
      setBrands(res.brands);
      if (!value && res.brands.length) onChange(res.brands[0]._id);
    });
  }, []);

  return (
    <select className="input" style={{ maxWidth: 240 }} value={value || ''} onChange={e => onChange(e.target.value)}>
      {brands.map(b => (
        <option key={b._id} value={b._id}>{b.name}</option>
      ))}
    </select>
  );
}
