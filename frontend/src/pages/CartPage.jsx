import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal, cartMessage } = useCart();

  return (
    <div className="container">
      <div className="card">
        <h2>Your Cart</h2>
        {items.length === 0 ? (
          <p className="text-muted">Your cart is empty.</p>
        ) : (
          <>
            <h3>{items[0].shopName}</h3>
            {cartMessage && <p>{cartMessage}</p>}
            {items.map((item) => (
              <div key={item.productId} className="row mb-2" style={{ alignItems: 'center' }}>
                {item.image && <img src={item.image} alt={item.name} style={{ width: 72, height: 72, objectFit: 'cover' }} />}
                <div style={{ flex: 1 }}>
                  <strong>{item.name}</strong>
                  {item.brand && <div>{item.brand}</div>}
                  {item.originalPrice !== item.price && <div>Original: ₹{item.originalPrice}</div>}
                  {item.activeOffer && <div>Offer: {item.activeOffer.discountType === 'PERCENTAGE' ? `${item.activeOffer.discountValue}%` : `₹${item.activeOffer.discountValue}`}</div>}
                  <div>₹{item.price} each</div>
                </div>
                <button className="button secondary" type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button className="button" type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stock}>+</button>
                <strong>₹{item.price * item.quantity}</strong>
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
