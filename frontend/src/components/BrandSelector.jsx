import React, { useEffect, useState } from 'react';
import { getStaffBrands } from '../services/brandService';

// Staff-only brand picker (used across the admin/staff panel: Menu,
// Banners, Tables, PromoCodes, Brands). Uses getStaffBrands() (staffApi)
// specifically so a non-boss Admin only ever sees brands they're actually
// assigned to — see brandService.js for why the plain customer-facing
// getBrands() must not be used here.
export default function BrandSelector({ value, onChange }) {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    getStaffBrands().then(res => {
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
