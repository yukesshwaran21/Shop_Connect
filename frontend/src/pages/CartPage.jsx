import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal } = useCart();

  return (
    <div className="container">
      <div className="card">
        <h2>Your Cart</h2>
        {items.length === 0 ? (
          <p className="text-muted">Your cart is empty.</p>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.productId} className="row mb-2" style={{ alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <strong>{item.name}</strong>
                  <div>₹{item.price} each</div>
                </div>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                  style={{ width: 80 }}
                />
                <button className="button secondary" type="button" onClick={() => removeFromCart(item.productId)}>
                  Remove
                </button>
              </div>
            ))}
            <h3>Total: ₹{subtotal}</h3>
            <Link to="/checkout" className="button">Proceed to Checkout</Link>
          </>
        )}
      </div>
    </div>
  );
}
