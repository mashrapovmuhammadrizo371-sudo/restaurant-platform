import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBrand } from '../../services/brandService';
import { getCategories } from '../../services/categoryService';
import { getFoods } from '../../services/foodService';
import { getBanners } from '../../services/bannerService';
import CategoryTabs from '../../components/CategoryTabs.jsx';
import FoodCard from '../../components/FoodCard.jsx';
import { useCart } from '../../context/CartContext.jsx';

// selecting a brand from Home opens straight into its menu — this page.
export default function BrandMenuPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addItem } = useCart();

  const [brand, setBrand] = useState(null);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      getBrand(id),
      getBanners(id),
      getCategories(id),
      getFoods({ brand: id })
    ])
      .then(([brandRes, bannersRes, categoriesRes, foodsRes]) => {
        setBrand(brandRes.brand);
        setBanners(bannersRes.banners);
        setCategories(categoriesRes.categories);
        setFoods(foodsRes.foods);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const visibleFoods = useMemo(() => {
    return foods.filter(f => {
      if (activeCategory && (f.category?._id || f.category) !== activeCategory) return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [foods, activeCategory, search]);

  function handleAdd(food) {
    if (cart.brand && cart.brand !== id && cart.items.length) {
      const confirmed = window.confirm(
        "Savatda boshqa brend taomlari bor. Ularni tozalab, yangi taom qo'shilsinmi?"
      );
      if (!confirmed) return;
    }
    addItem(id, food);
  }

  if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  if (error) return <div className="container" style={{ paddingTop: 16 }}><div className="error-text">{error}</div></div>;
  if (!brand) return null;

  return (
    <div>
      <div className="top-bar brand-menu-top-bar">
        <button className="btn btn-secondary brand-back-button" onClick={() => navigate('/')}>← <span>Orqaga</span></button>
        <div style={{ fontWeight: 700 }}>{brand.name}</div>
        <div style={{ width: 40 }} />
      </div>

      <div className="container" style={{ paddingTop: 16 }}>
        {banners.length > 0 && (
          <div className="banner-scroll">
            {banners.map(b => <img key={b._id} src={b.image} alt={b.title || brand.name} />)}
          </div>
        )}

        <div className="card" style={{ marginTop: 12, borderTop: `4px solid ${brand.mainColor}` }}>
          {brand.address && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>📍 {brand.address}</div>}
          {brand.phone && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>📞 {brand.phone}</div>}
          {brand.openingHours && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>🕒 {brand.openingHours}</div>}
          {brand.description && <p style={{ fontSize: 13, marginBottom: 0, marginTop: 6 }}>{brand.description}</p>}
        </div>

        <input
          className="input"
          style={{ marginTop: 12 }}
          placeholder="Taom qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <CategoryTabs categories={categories} activeId={activeCategory} onChange={setActiveCategory} />

        {!visibleFoods.length && <div className="empty-state">Taomlar topilmadi</div>}
        <div className="food-grid">
          {visibleFoods.map(f => <FoodCard key={f._id} food={f} onAdd={handleAdd} />)}
        </div>
      </div>
    </div>
  );
}
