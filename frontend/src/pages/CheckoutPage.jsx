import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getAuthHeaders } from '../services/api';
import { useCart } from '../context/CartContext';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  const applyCoupon = async () => {
    setCouponMessage('');
    try {
      const response = await api.post('/coupons/validate', {
        couponCode,
        shopId: items[0]?.shopId,
        cartItems: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      });
      setAppliedCoupon(response.data);
      setCouponMessage('Coupon applied successfully.');
    } catch (error) {
      setAppliedCoupon(null);
      setCouponMessage(error.response?.data?.message || 'Invalid coupon.');
    }
  };

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
      totalAmount: appliedCoupon?.finalAmount ?? subtotal,
      couponCode: appliedCoupon?.couponCode,
      couponId: appliedCoupon?.couponId,
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
    };

    setPlacingOrder(true);
    try {
      await api.post('/orders', payload, { headers: getAuthHeaders() });
      clearCart();
      navigate('/my-orders');
    } catch (error) {
      setCouponMessage(error.response?.data?.message || 'Unable to place order.');
    } finally { setPlacingOrder(false); }
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
            <div className="row mb-2"><input className="input" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Coupon Code" /><button className="button" type="button" onClick={applyCoupon}>Apply</button></div>
            {couponMessage && <p>{couponMessage}</p>}
            {appliedCoupon && <p>Coupon {appliedCoupon.couponCode}: -₹{appliedCoupon.discount} <button className="button" type="button" onClick={() => { setAppliedCoupon(null); setCouponMessage('Coupon removed.'); }}>Remove</button></p>}
            <p>Subtotal: ₹{appliedCoupon?.subtotal ?? subtotal}</p>
            <h3>Final Total: ₹{appliedCoupon?.finalAmount ?? subtotal}</h3>
            <button className="button" type="button" onClick={handlePlaceOrder} disabled={placingOrder}>{placingOrder ? 'Placing...' : 'Place Order'}</button>
          </>
        )}
      </div>
    </div>
  );
}
