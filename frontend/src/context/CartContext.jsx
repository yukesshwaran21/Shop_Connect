import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function useCart() {
  return useContext(CartContext);
}

export default function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('shop-connect-cart');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((item) => item?.productId && item?.shopId) : [];
    } catch (error) {
      localStorage.removeItem('shop-connect-cart');
      return [];
    }
  });
  const [cartMessage, setCartMessage] = useState('');

  useEffect(() => {
    localStorage.setItem('shop-connect-cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, shop) => {
    if (!localStorage.getItem('token')) {
      setCartMessage('Please log in before adding products to your cart.');
      return false;
    }
    if (!shop?._id || product.stock <= 0) {
      setCartMessage('This product is currently out of stock.');
      return false;
    }
    const current = items;
    if (current.length && String(current[0].shopId) !== String(shop._id)) {
      setCartMessage('Your cart contains products from another shop. Please checkout or clear your cart before adding products from this shop.');
      return false;
    }

    const existingItem = current.find((item) => item.productId === product._id);
    if (existingItem && existingItem.quantity >= product.stock) {
      setCartMessage(`Only ${product.stock} unit(s) of ${product.productName} are available.`);
      return false;
    }

    const nextItems = existingItem
      ? current.map((item) => item.productId === product._id
        ? { ...item, quantity: item.quantity + 1, stock: product.stock }
        : item)
      : [
          ...current,
          {
            productId: product._id,
            name: product.productName,
            productName: product.productName,
            image: product.image || '',
            brand: product.brand || '',
            originalPrice: product.originalPrice,
            price: product.currentPrice ?? product.sellingPrice,
            quantity: 1,
            stock: product.stock,
            activeOffer: product.activeOffer || null,
            shopId: shop._id,
            shopName: shop.shopName || '',
          },
        ];

    setItems(nextItems);
    setCartMessage(existingItem ? `${product.productName} quantity increased.` : `${product.productName} added to cart.`);
    return true;
  };

  const updateQuantity = (productId, quantity) => {
    const item = items.find((currentItem) => currentItem.productId === productId);
    if (item && quantity > item.stock) {
      setCartMessage(`Only ${item.stock} unit(s) of ${item.name} are available.`);
    }
    setItems((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, quantity: Math.min(item.stock, Math.max(1, quantity)) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  const clearCart = () => { setItems([]); setCartMessage(''); };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = useMemo(
    () => ({ items, addToCart, updateQuantity, removeFromCart, clearCart, subtotal, cartMessage, setCartMessage }),
    [items, subtotal, cartMessage]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
