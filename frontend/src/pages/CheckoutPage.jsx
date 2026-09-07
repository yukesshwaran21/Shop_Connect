import { useEffect, useState } from 'react';
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
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '' });
  const [payment, setPayment] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');

  useEffect(() => {
    const shopId = items[0]?.shopId;
    if (!shopId) return;
    api.get(`/shops/${shopId}`)
      .then((response) => setPayment({ shopName: response.data.shopName, ...response.data.payment }))
      .catch(() => setPayment(null));
  }, [items]);

  const confirmPayment = async () => {
    try {
      const response = await api.patch(`/orders/${order._id}/payment-confirmation`, {}, { headers: getAuthHeaders() });
      setOrder(response.data);
      setPaymentMessage('Payment confirmation submitted. The shop owner will verify your payment.');
    } catch (error) { setPaymentMessage(error.response?.data?.message || 'Unable to submit payment confirmation.'); }
  };

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
      deliveryAddress: delivery,
    };

    setPlacingOrder(true);
    try {
      const response = await api.post('/orders', payload, { headers: getAuthHeaders() });
      setOrder(response.data);
      clearCart();
    } catch (error) {
      setCouponMessage(error.response?.data?.message || 'Unable to place order.');
    } finally { setPlacingOrder(false); }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Checkout</h2>
        {order ? (
          <>
            <h3>Order Placed Successfully!</h3>
            <p>Order ID: {order._id}</p>
            <p>Total: ₹{order.totalAmount}</p>
            <p>Payment: {order.paymentStatus}</p>
            <p>Status: {order.orderStatus}</p>
            {order.paymentConfirmationSubmitted ? <p>Payment confirmation submitted. The shop owner will verify your payment.</p> : <button className="button" type="button" onClick={confirmPayment}>I've Completed Payment</button>}
            {paymentMessage && <p>{paymentMessage}</p>}
            <button className="button" type="button" onClick={() => navigate('/my-orders')}>View My Orders</button>
          </>
        ) : items.length === 0 ? (
          <p className="text-muted">No items to order.</p>
        ) : (
          <>
            <h3>Delivery information</h3>
            {Object.keys(delivery).map((field) => <input key={field} className="input" name={field} value={delivery[field]} onChange={(event) => setDelivery({ ...delivery, [field]: event.target.value })} placeholder={field[0].toUpperCase() + field.slice(1)} required={field !== 'email'} type={field === 'email' ? 'email' : 'text'} />)}
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
            <section className="card mb-2">
              <h3>Payment</h3>
              {payment?.qrCode || payment?.upiId ? <>
                <h4>{payment.displayName || payment.shopName}</h4>
                {payment.qrCode && <img src={payment.qrCode} alt="Shop payment QR code" style={{ width: 220, height: 220, objectFit: 'contain' }} />}
                {payment.upiId && <p>UPI ID: {payment.upiId}</p>}
                <p>Amount to Pay: ₹{appliedCoupon?.finalAmount ?? subtotal}</p>
                {payment.instructions && <p>{payment.instructions}</p>}
              </> : <p>Online QR payment is not available for this shop.</p>}
            </section>
            {paymentMessage && <p>{paymentMessage}</p>}
            <button className="button" type="button" onClick={handlePlaceOrder} disabled={placingOrder}>{placingOrder ? 'Placing...' : 'Place Order'}</button>
          </>
        )}
      </div>
    </div>
  );
}
