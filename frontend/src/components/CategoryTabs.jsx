import React from 'react';

export default function CategoryTabs({ categories, activeId, onChange }) {
  return (
    <div className="category-tabs">
      <button
        className={`category-tab${!activeId ? ' active' : ''}`}
        onClick={() => onChange(null)}
      >
        Barchasi
      </button>
      {categories.map(c => (
        <button
          key={c._id}
          className={`category-tab${activeId === c._id ? ' active' : ''}`}
          onClick={() => onChange(c._id)}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
