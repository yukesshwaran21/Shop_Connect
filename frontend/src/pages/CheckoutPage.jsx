import { useNavigate } from 'react-router-dom';
import api, { getAuthHeaders } from '../services/api';
import { useCart } from '../context/CartContext';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();

  const handlePlaceOrder = async () => {
    if (!items.length) return;

    const shopId = items[0]?.shopId;
    const payload = {
      shopId,
      products: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: subtotal,
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
    };

    await api.post('/orders', payload, { headers: getAuthHeaders() });
    clearCart();
    navigate('/my-orders');
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Checkout</h2>
        {items.length === 0 ? (
          <p className="text-muted">No items to order.</p>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.productId} className="row mb-2">
                <span>{item.name}</span>
                <span>Qty: {item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
            <h3>Total: ₹{subtotal}</h3>
            <button className="button" type="button" onClick={handlePlaceOrder}>Place Order</button>
          </>
        )}
      </div>
    </div>
  );
}
