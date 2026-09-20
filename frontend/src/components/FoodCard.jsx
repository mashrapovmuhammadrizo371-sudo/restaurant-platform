import React from 'react';

export default function FoodCard({ food, onAdd }) {
  return (
    <div className="food-card">
      {food.image && <img src={food.image} alt={food.name} className="food-card-img" />}
      <div className="food-card-body">
        <div className="food-card-name">{food.name}</div>
        {food.description && <div className="food-card-desc">{food.description}</div>}
        <div className="food-card-footer">
          <span className="food-card-price">{food.price.toLocaleString()} so'm</span>
          <button className="btn btn-primary" onClick={() => onAdd(food)}>+ Savatga</button>
        </div>
      </div>
    </div>
  );
}
