import React, { useEffect, useState } from 'react';
import BrandSelector from '../../components/BrandSelector.jsx';
import { getCategories, createCategory, deleteCategory } from '../../services/categoryService';
import { getFoods, createFood, updateFood, deleteFood } from '../../services/foodService';

const EMPTY_FOOD = { category: '', name: '', description: '', ingredients: '', price: '', imageFile: null };

function formatPrice(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US').replace(/,/g, ' ');
}

function priceToNumber(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

export default function MenuPage() {
  const [brandId, setBrandId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [foodForm, setFoodForm] = useState(EMPTY_FOOD);
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [error, setError] = useState('');

  function load() {
    if (!brandId) return;
    getCategories(brandId).then(res => setCategories(res.categories));
    getFoods({ brand: brandId }).then(res => setFoods(res.foods));
  }
  useEffect(load, [brandId]);

  async function handleAddCategory() {
    if (!newCategoryName) return;
    try {
      await createCategory({ brand: brandId, name: newCategoryName, order: categories.length });
      setNewCategoryName('');
      load();
    } catch (err) { setError(err.message); }
  }
  async function handleDeleteCategory(id) {
    if (!window.confirm("Kategoriyani o'chirishga ishonchingiz komilmi?")) return;
    try { await deleteCategory(id); load(); } catch (err) { setError(err.message); }
  }

  function startEditFood(f) {
    setEditingFoodId(f._id);
    setFoodForm({
      category: f.category?._id || f.category,
      name: f.name,
      description: f.description,
      ingredients: f.ingredients,
      price: formatPrice(f.price),
      imageFile: null
    });
  }
  function resetFoodForm() {
    setEditingFoodId(null);
    setFoodForm(EMPTY_FOOD);
  }

  async function handleSubmitFood(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...foodForm, price: priceToNumber(foodForm.price) };
      if (editingFoodId) await updateFood(editingFoodId, payload);
      else await createFood({ ...payload, brand: brandId });
      resetFoodForm();
      load();
    } catch (err) { setError(err.message); }
  }
  async function handleDeleteFood(id) {
    if (!window.confirm("Taomni o'chirishga ishonchingiz komilmi?")) return;
    try { await deleteFood(id); load(); } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Menyu</h2>
      <BrandSelector value={brandId} onChange={setBrandId} />
      {error && <div className="error-text">{error}</div>}

      {brandId && (
        <>
          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Kategoriyalar</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {categories.map(c => (
                <span key={c._id} className="status-badge status-new" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {c.name}
                  <button
                    onClick={() => handleDeleteCategory(c._id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Yangi kategoriya (masalan: Burgerlar)"
              />
              <button className="btn btn-secondary" onClick={handleAddCategory}>Qo'shish</button>
            </div>
          </div>

          <form onSubmit={handleSubmitFood} className="card" style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{editingFoodId ? 'Taomni tahrirlash' : "Yangi taom qo'shish"}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Kategoriya</label>
                <select className="input" value={foodForm.category} onChange={e => setFoodForm({ ...foodForm, category: e.target.value })} required>
                  <option value="">Tanlang</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nomi</label>
                <input className="input" value={foodForm.name} onChange={e => setFoodForm({ ...foodForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Narxi (so'm)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input"
                  value={foodForm.price}
                  onChange={e => setFoodForm({ ...foodForm, price: formatPrice(e.target.value) })}
                  placeholder="50 000"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rasm</label>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setFoodForm({ ...foodForm, imageFile: e.target.files[0] })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Qisqa tavsif</label>
              <input className="input" value={foodForm.description} onChange={e => setFoodForm({ ...foodForm, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Tarkibi</label>
              <input className="input" value={foodForm.ingredients} onChange={e => setFoodForm({ ...foodForm, ingredients: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary">{editingFoodId ? 'Yangilash' : "Qo'shish"}</button>
              {editingFoodId && <button type="button" className="btn btn-secondary" onClick={resetFoodForm}>Bekor qilish</button>}
            </div>
          </form>

          <div className="food-grid" style={{ marginTop: 16 }}>
            {foods.map(f => (
              <div key={f._id} className="food-card">
                {f.image && <img src={f.image} alt={f.name} className="food-card-img" />}
                <div className="food-card-body">
                  <div className="food-card-name">{f.name}</div>
                  <div className="food-card-footer">
                    <span className="food-card-price">{f.price.toLocaleString()} so'm</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button className="btn btn-secondary" onClick={() => startEditFood(f)}>Tahrirlash</button>
                    <button className="btn btn-danger" onClick={() => handleDeleteFood(f._id)}>O'chirish</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
