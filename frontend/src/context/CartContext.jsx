import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '{"brand":null,"items":[]}');
  } catch {
    return { brand: null, items: [] };
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  function addItem(brandId, food) {
    setCart(prev => {
      // Switching brands clears the cart — orders belong to a single restaurant.
      if (prev.brand && prev.brand !== brandId) {
        return { brand: brandId, items: [{ food, quantity: 1 }] };
      }
      const existing = prev.items.find(i => i.food._id === food._id);
      const items = existing
        ? prev.items.map(i => i.food._id === food._id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev.items, { food, quantity: 1 }];
      return { brand: brandId, items };
    });
  }

  function changeQuantity(foodId, delta) {
    setCart(prev => {
      const items = prev.items
        .map(i => i.food._id === foodId ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0);
      return { ...prev, items };
    });
  }

  function removeItem(foodId) {
    setCart(prev => ({ ...prev, items: prev.items.filter(i => i.food._id !== foodId) }));
  }

  function clearCart() {
    setCart({ brand: null, items: [] });
  }

  const total = cart.items.reduce((sum, i) => sum + i.food.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, changeQuantity, removeItem, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
