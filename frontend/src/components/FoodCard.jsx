import React from 'react';

export default function FoodCard({ food, onAdd }) {
  return (
    <div className="food-card">
      <div className="food-card-img-wrap">
        {food.image ? (
          <img src={food.image} alt={food.name} className="food-card-img" loading="lazy" />
        ) : (
          <div
            style={{
              width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, color: 'var(--text-muted)'
            }}
          >
            🍽️
          </div>
        )}
      </div>
      <div className="food-card-body">
        <div className="food-card-name">{food.name}</div>
        {food.description && <div className="food-card-desc">{food.description}</div>}
        <div className="food-card-footer">
          <span className="food-card-price">{food.price.toLocaleString()} so'm</span>
          <button className="food-card-add-btn" onClick={() => onAdd(food)} aria-label="Savatga qo'shish">+</button>
        </div>
      </div>
    </div>
  );
}
