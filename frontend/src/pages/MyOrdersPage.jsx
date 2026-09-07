import { useEffect, useState } from 'react';
import api, { getAuthHeaders } from '../services/api';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api
      .get('/orders/my-orders', { headers: getAuthHeaders() })
      .then((response) => setOrders(response.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const confirmPayment = async (orderId) => {
    try {
      const response = await api.patch(`/orders/${orderId}/payment-confirmation`, {}, { headers: getAuthHeaders() });
      setOrders((current) => current.map((order) => order._id === orderId ? response.data : order));
      setMessage('Payment confirmation submitted. The shop owner will verify your payment.');
    } catch (error) { setMessage(error.response?.data?.message || 'Unable to submit payment confirmation.'); }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>My Orders</h2>
        {message && <p>{message}</p>}
        {loading ? <p>Loading orders...</p> : orders.length === 0 ? (
          <p className="text-muted">No orders placed yet.</p>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="card mb-2">
              <p>Order ID: {order._id}</p>
              <p>Shop: {order.shopId?.shopName || 'Shop'}</p>
              <p>Order date: {new Date(order.createdAt).toLocaleString()}</p>
              <p>Amount: ₹{order.totalAmount}</p>
              {order.couponCode && <p>Coupon: {order.couponCode} (-₹{order.couponDiscount})</p>}
              <p>Payment: {order.paymentStatus}</p>
              {order.paymentStatus === 'Pending' && !order.paymentConfirmationSubmitted && <button className="button" type="button" onClick={() => confirmPayment(order._id)}>I've Completed Payment</button>}
              {order.paymentConfirmationSubmitted && <p>Payment confirmation submitted. Awaiting shop owner verification.</p>}
              <p>Status: {order.orderStatus}</p>
              <ul>
                {order.products?.map((item, index) => (
                  <li key={`${order._id}-${index}`}>
                    {item.name} × {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
