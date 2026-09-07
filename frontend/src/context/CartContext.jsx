import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function useCart() {
  return useContext(CartContext);
}

export default function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('shop-connect-cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('shop-connect-cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, shop) => {
    setItems((current) => {
      const existingItem = current.find((item) => item.productId === product._id);
      if (existingItem) {
        return current.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...current,
        {
          productId: product._id,
          name: product.productName,
          price: product.sellingPrice,
          quantity: 1,
          shopId: shop?._id || null,
          shopName: shop?.shopName || '',
        },
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setItems((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, quantity: Math.max(0, quantity) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = useMemo(
    () => ({ items, addToCart, updateQuantity, removeFromCart, clearCart, subtotal }),
    [items, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
