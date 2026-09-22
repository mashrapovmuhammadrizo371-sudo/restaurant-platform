import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useCustomerAuth } from '../../context/CustomerAuthContext.jsx';
import { getTables } from '../../services/tableService';
import { validatePromoCode } from '../../services/promoCodeService';
import { createOrder } from '../../services/orderService';
import { isValidUzPhone, formatUzPhoneInput, UZ_PHONE_PLACEHOLDER } from '../../utils/phone.js';

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
  // Customers can enter the app with just a name (no phone on the
  // account), so a contact number for the courier is collected here
  // instead — required for delivery orders only.
  const [contactPhone, setContactPhone] = useState('');
  const [tables, setTables] = useState([]);
  const [tableId, setTableId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('naqd');
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (orderType === 'table' && cart.brand) {
      getTables(cart.brand).then(res => setTables(res.tables.filter(t => t.status === 'available')));
    }
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

  async function handlePlaceOrder() {
    setError('');
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

    setPlacing(true);
    try {
      const payload = {
        brand: cart.brand,
        orderType,
        items: cart.items.map(i => ({ food: i.food._id, quantity: i.quantity })),
        paymentMethod,
        ...(orderType === 'delivery' ? { deliveryAddress, contactPhone } : { tableId }),
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
              <input
                className="input"
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                placeholder="Yetkazib berish manzili"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bog'lanish uchun telefon</label>
              <input
                className="input"
                placeholder={UZ_PHONE_PLACEHOLDER}
                value={contactPhone}
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
    </div>
  );
}
