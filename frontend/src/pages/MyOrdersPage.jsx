import { useEffect, useState } from 'react';
import api, { getAuthHeaders } from '../services/api';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api
      .get('/orders/my-orders', { headers: getAuthHeaders() })
      .then((response) => setOrders(response.data))
      .catch(() => setOrders([]));
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2>My Orders</h2>
        {orders.length === 0 ? (
          <p className="text-muted">No orders placed yet.</p>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="card mb-2">
              <p>Order ID: {order._id}</p>
              <p>Amount: ₹{order.totalAmount}</p>
              <p>Payment: {order.paymentStatus}</p>
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
