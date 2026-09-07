import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const statuses = ['All', 'Pending', 'Confirmed', 'Processing', 'Ready', 'Completed', 'Cancelled'];

const statusLabel = (status) => status || 'Pending';

export default function OwnerOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/shop-owner', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setOrders(response.data);
    } catch (error) {
      setMessage(error.response?.status === 403 ? 'You are not authorized to view these orders.' : 'Unable to load orders.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const visibleOrders = useMemo(() => filter === 'All' ? orders : orders.filter((order) => statusLabel(order.orderStatus) === filter), [orders, filter]);
  const summary = useMemo(() => statuses.slice(1).reduce((result, status) => ({ ...result, [status]: orders.filter((order) => statusLabel(order.orderStatus) === status).length }), {}), [orders]);

  const updateStatus = async (order, status) => {
    try {
      const response = await api.patch(`/orders/${order._id}/status`, { status }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setOrders((current) => current.map((item) => item._id === order._id ? response.data : item));
      setSelectedOrder(response.data);
      setMessage('Order status updated.');
    } catch (error) { setMessage(error.response?.data?.message || 'Unable to update order status.'); }
  };

  return (
    <section className="card">
      <h3>Orders</h3>
      {message && <p>{message}</p>}
      {!loading && <div className="row mb-2">{statuses.slice(1).map((status) => <span key={status} className="text-muted">{status}: {summary[status] || 0}</span>)}</div>}
      <div className="row mb-2">{statuses.map((status) => <button key={status} className={filter === status ? 'button' : 'button secondary'} type="button" onClick={() => setFilter(status)}>{status}</button>)}</div>
      {loading ? <p>Loading orders...</p> : visibleOrders.length === 0 ? <p>No orders yet.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th>Order</th><th>Customer</th><th>Shop</th><th>Products</th><th>Total</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{visibleOrders.map((order) => <tr key={order._id}>
              <td>{order._id.slice(-8)}<br />{new Date(order.createdAt).toLocaleDateString()}</td>
              <td>{order.userId?.name || order.deliveryAddress?.name}<br />{order.userId?.email || order.deliveryAddress?.email}</td>
              <td>{order.shopId?.shopName || 'Shop'}</td>
              <td>{(order.items || order.products || []).map((item) => <div key={`${order._id}-${item.productId}`}>{item.productName || item.name} x {item.quantity}</div>)}</td>
              <td>₹{order.totalAmount}</td>
              <td>{order.paymentStatus}</td>
              <td>{statusLabel(order.orderStatus)}</td>
              <td><button className="button" type="button" onClick={() => setSelectedOrder(order)}>Details</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
      {selectedOrder && <div className="card mb-2">
        <h4>Order Details</h4>
        <p>Order ID: {selectedOrder._id}</p>
        <p>Customer: {selectedOrder.deliveryAddress?.name} | {selectedOrder.deliveryAddress?.email}</p>
        <p>Delivery: {selectedOrder.deliveryAddress?.address}, {selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} {selectedOrder.deliveryAddress?.pincode}</p>
        <p>Subtotal: ₹{selectedOrder.subtotal} | Coupon: {selectedOrder.couponCode || 'None'} (-₹{selectedOrder.couponDiscount || 0})</p>
        {(selectedOrder.items || selectedOrder.products || []).map((item) => <p key={`${selectedOrder._id}-detail-${item.productId}`}>{item.productName || item.name} x {item.quantity} at ₹{item.unitPrice || item.price} = ₹{item.totalPrice || item.price * item.quantity}</p>)}
        <p>Total: ₹{selectedOrder.totalAmount} | Payment: {selectedOrder.paymentStatus}</p>
        <select className="select" value={statusLabel(selectedOrder.orderStatus)} onChange={(event) => updateStatus(selectedOrder, event.target.value)} disabled={statusLabel(selectedOrder.orderStatus) === 'Completed' || statusLabel(selectedOrder.orderStatus) === 'Cancelled'}>
          {statuses.slice(1).map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <button className="button secondary" type="button" onClick={() => setSelectedOrder(null)}>Close</button>
      </div>}
    </section>
  );
}
