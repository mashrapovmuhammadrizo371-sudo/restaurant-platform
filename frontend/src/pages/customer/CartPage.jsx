import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx';
import { getTables } from '../../services/tableService';
import { validatePromoCode } from '../../services/promoCodeService';
import { createOrder } from '../../services/orderService';
import { isValidUzPhone, formatUzPhoneInput, UZ_PHONE_PLACEHOLDER } from '../../utils/phone.js';
import LocationInput from '../../components/LocationInput.jsx';
import { getPublicPaymentCard } from '../../services/paymentCardService';

const PAYMENT_LABELS = { naqd: 'Naqd', karta: 'Karta', online: 'Onlayn' };

export default function CartPage() {
  const { cart, changeQuantity, removeItem, clearCart, total } = useCart();
  const { customer } = useCustomerAuth();
  const navigate = useNavigate();

  const defaultAddress = customer?.addresses?.find(a => a.isDefault)?.address
    || customer?.addresses?.[0]?.address
    || '';

  const [orderType, setOrderType] = useState('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState(defaultAddress);
  const [deliveryLocation, setDeliveryLocation] = useState({ latitude: null, longitude: null, accuracy: null });
  // Customers can enter the app with just a name (no phone on the
  // account), so a contact number for the courier is collected here
  // instead — required for delivery orders only.
  const [contactPhone, setContactPhone] = useState('');
  const [tables, setTables] = useState([]);
  const [tableId, setTableId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('naqd');
  const [receiptFile, setReceiptFile] = useState(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [showRegistrationNotice, setShowRegistrationNotice] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [paymentCard, setPaymentCard] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPublicPaymentCard()
      .then(res => {
        if (!cancelled) setPaymentCard(res?.card || null);
      })
      .catch(() => {
        if (!cancelled) setPaymentCard(null);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTables() {
      if (orderType !== 'table' || !cart.brand) {
        setTables([]);
        return;
      }

      try {
        const res = await getTables(cart.brand);
        if (cancelled) return;

        // Customer API returns { tables }, but keep this tolerant of an
        // array response so the selector never silently becomes empty.
        const list = Array.isArray(res) ? res : (Array.isArray(res?.tables) ? res.tables : []);
        setTables(list.filter(t => t && t.isActive !== false && t.status === 'available'));
        setError('');
      } catch (err) {
        if (!cancelled) {
          setTables([]);
          setError(err.message || 'Stollarni yuklab bo\'lmadi');
        }
      }
    }

    loadTables();
    return () => { cancelled = true; };
  }, [orderType, cart.brand]);

  async function applyPromo() {
    setPromoError('');
    setPromoApplied(null);
    if (!promoInput) return;
    try {
      const res = await validatePromoCode(cart.brand, promoInput, total);
      setPromoApplied({ code: promoInput.toUpperCase(), discount: res.discount });
    } catch (err) {
      setPromoError(err.message);
    }
  }

  async function detectDeliveryAddress() {
    if (!navigator.geolocation) {
      setError("Bu qurilmada joylashuvni aniqlash qo‘llab-quvvatlanmaydi.");
      return;
    }
    setLocationLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=ru`);
          if (!response.ok) throw new Error('Address lookup failed');
          const data = await response.json();
          const address = [data.locality, data.city, data.principalSubdivision, data.countryName]
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i)
            .join(', ');
          if (address) setDeliveryAddress(address);
          else setError("Joylashuv aniqlandi, lekin manzilni olishning iloji bo‘lmadi.");
        } catch {
          setError("Manzilni avtomatik aniqlab bo‘lmadi.");
        } finally {
          setLocationLoading(false);
        }
      },
      err => {
        const messages = {
          1: "Joylashuvga ruxsat berilmadi.",
          2: "Joylashuvni aniqlab bo‘lmadi.",
          3: "Joylashuvni aniqlash vaqti tugadi."
        };
        setError(messages[err.code] || "Joylashuvni aniqlab bo‘lmadi.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  async function handlePlaceOrder() {
    setError('');
    if (!customer) {
      setShowRegistrationNotice(true);
      return;
    }
    if (!cart.items.length) return;
    if (orderType === 'delivery' && !deliveryAddress) {
      setError('Yetkazib berish manzilini kiriting');
      return;
    }
    if (orderType === 'delivery' && !isValidUzPhone(contactPhone)) {
      setError("Bog'lanish uchun telefon raqamini +998 XX XXX XX XX shaklida kiriting");
      return;
    }
    if (orderType === 'table' && !tableId) {
      setError('Stolni tanlang');
      return;
    }

    if (paymentMethod === 'karta' && !receiptFile) {
      setError('Karta orqali to‘lov uchun chek rasmini yuklang');
      return;
    }
    setPlacing(true);
    try {
      let receiptImage = null;
      if (paymentMethod === 'karta' && receiptFile) {
        receiptImage = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Chek rasmini o‘qib bo‘lmadi'));
          reader.readAsDataURL(receiptFile);
        });
      }
      const payload = {
        brand: cart.brand,
        orderType,
        items: cart.items.map(i => ({ food: i.food._id, quantity: i.quantity })),
        paymentMethod,
        ...(receiptImage ? { receiptImage } : {}),
        ...(orderType === 'delivery' ? {
          deliveryAddress,
          contactPhone,
          ...(deliveryLocation.latitude !== null && deliveryLocation.longitude !== null ? {
            deliveryLatitude: deliveryLocation.latitude,
            deliveryLongitude: deliveryLocation.longitude,
            deliveryLocationAccuracy: deliveryLocation.accuracy
          } : {})
        } : { tableId }),
        ...(promoApplied ? { promoCode: promoApplied.code } : {})
      };
      await createOrder(payload);
      clearCart();
      navigate('/orders');
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  const finalTotal = Math.max(0, total - (promoApplied?.discount || 0));

  if (!cart.items.length) {
    return (
      <div className="container" style={{ paddingTop: 24 }}>
        <div className="empty-state">Savatingiz bo'sh</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>Savat</h2>

      {cart.items.map(i => (
        <div key={i.food._id} className="cart-line">
          <div>
            <div style={{ fontWeight: 600 }}>{i.food.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{i.food.price.toLocaleString()} so'm</div>
          </div>
          <div className="qty-control">
            <button onClick={() => changeQuantity(i.food._id, -1)}>−</button>
            <span>{i.quantity}</span>
            <button onClick={() => changeQuantity(i.food._id, 1)}>+</button>
            <button className="btn btn-secondary" onClick={() => removeItem(i.food._id)}>🗑</button>
          </div>
        </div>
      ))}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="form-group">
          <label className="form-label">Buyurtma turi</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={`btn ${orderType === 'delivery' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setOrderType('delivery')}
            >
              🚚 Yetkazib berish
            </button>
            <button
              type="button"
              className={`btn ${orderType === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => setOrderType('table')}
            >
              🍽️ Stol uchun
            </button>
          </div>
        </div>

        {orderType === 'delivery' ? (
          <>
            <div className="form-group">
              <label className="form-label">Manzil</label>
              <LocationInput value={deliveryAddress} onChange={setDeliveryAddress} onLocation={setDeliveryLocation} placeholder="Yetkazib berish manzili" />
            </div>
            <div className="form-group">
              <label className="form-label">Bog'lanish uchun telefon</label>
              <input
                className="input"
                placeholder={UZ_PHONE_PLACEHOLDER}
                value={contactPhone || '+998 '}
                onFocus={() => { if (!contactPhone) setContactPhone('+998 '); }}
                onChange={e => setContactPhone(formatUzPhoneInput(e.target.value))}
                inputMode="numeric"
                maxLength={17}
              />
            </div>
          </>
        ) : (
          <div className="form-group">
            <label className="form-label">Stol</label>
            <select className="input" value={tableId} onChange={e => setTableId(e.target.value)}>
              <option value="">Stolni tanlang</option>
              {tables.map(t => <option key={t._id} value={t._id}>Stol #{t.number}</option>)}
            </select>
            {!tables.length && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Bo'sh stollar topilmadi</div>
            )}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">To'lov turi</label>
          <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {paymentMethod === 'karta' && (
          <div className="form-group card" style={{ marginTop: 10 }}>
            <strong>Karta orqali to‘lov</strong>
            <div style={{ marginTop: 6 }}>Karta raqami: {paymentCard?.cardNumber ? paymentCard.cardNumber.replace(/(\\d{4})(?=\\d)/g, '$1 ') : 'Admin karta ma’lumotini kiritmagan'}</div>
            <div>Karta egasi: {paymentCard?.cardHolder || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Pul o‘tkazgach, chek rasmini yuklang. Buyurtma to‘lovi kassir tekshirguncha kutilmoqda.</div>
            <input className="input" type="file" accept="image/jpeg,image/png,image/webp" style={{ marginTop: 8 }} onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
            {receiptFile && <div className="success-text">Chek tanlandi: {receiptFile.name}</div>}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Promokod</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              value={promoInput}
              onChange={e => setPromoInput(e.target.value.toUpperCase())}
              placeholder="PROMO2024"
            />
            <button type="button" className="btn btn-secondary" onClick={applyPromo}>Qo'llash</button>
          </div>
          {promoError && <div className="error-text">{promoError}</div>}
          {promoApplied && (
            <div className="success-text">Chegirma qo'llandi: -{promoApplied.discount.toLocaleString()} so'm</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, marginTop: 12 }}>
          <span>Jami:</span>
          <span>{finalTotal.toLocaleString()} so'm</span>
        </div>

        {error && <div className="error-text">{error}</div>}

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handlePlaceOrder} disabled={placing}>
          {placing ? <span className="spinner" /> : 'Buyurtma berish'}
        </button>
      </div>

      {showRegistrationNotice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="registration-notice-title"
          onClick={() => setShowRegistrationNotice(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
          }}
        >
          <div
            className="card"
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 360, padding: 20, background: 'var(--card-bg, #fff)' }}
          >
            <h3 id="registration-notice-title" style={{ marginTop: 0 }}>Регистрация</h3>
            <p style={{ lineHeight: 1.5, marginBottom: 18 }}>
              Кечирасиз, сиз буюртма беришингиздан олдин регистрациядан ўтинг. Хавотир олманг, сиз киритган маълумотлар хавфсиз жойда сақланади.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => navigate('/register?returnTo=%2Fcart')}
            >
              Ўтиш
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
