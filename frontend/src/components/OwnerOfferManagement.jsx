import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyOffer = {
  productId: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

const inputDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const formatDate = (value) => new Date(value).toLocaleString();

export default function OwnerOfferManagement({ products }) {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(emptyOffer);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchOffers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await api.get('/offers/my-offers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffers(response.data);
    } catch (error) {
      setOffers([]);
      setMessage(error.response?.data?.message || 'Unable to load offers.');
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [products]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    setLoading(true);
    setMessage('');

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingOfferId) {
        await api.put(`/offers/${editingOfferId}`, {
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          startDate: form.startDate,
          endDate: form.endDate,
          isActive: form.isActive,
        }, config);
        setMessage('Offer updated successfully.');
      } else {
        await api.post('/offers', {
          productId: form.productId,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          startDate: form.startDate,
          endDate: form.endDate,
          isActive: form.isActive,
        }, config);
        setMessage('Offer created successfully.');
      }
      setForm(emptyOffer);
      setEditingOfferId(null);
      await fetchOffers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save offer.');
    } finally {
      setLoading(false);
    }
  };

  const editOffer = (offer) => {
    setEditingOfferId(offer._id);
    setForm({
      productId: offer.productId,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      startDate: inputDate(offer.startDate),
      endDate: inputDate(offer.endDate),
      isActive: offer.isActive,
    });
    setMessage('');
  };

  const updateStatus = async (offer) => {
    const token = localStorage.getItem('token');
    try {
      await api.patch(`/offers/${offer._id}/status`, { isActive: !offer.isActive }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchOffers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update offer status.');
    }
  };

  const deleteOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    const token = localStorage.getItem('token');

    try {
      await api.delete(`/offers/${offerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffers((current) => current.filter((offer) => offer._id !== offerId));
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete offer.');
    }
  };

  return (
    <section className="card">
      <h3>Offers</h3>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <h4>{editingOfferId ? 'Edit Offer' : 'Add Offer'}</h4>
        <select className="select" name="productId" value={form.productId} onChange={handleChange} required disabled={Boolean(editingOfferId)}>
          <option value="">Select product</option>
          {products.map((product) => <option key={product._id} value={product._id}>{product.productName}</option>)}
        </select>
        {editingOfferId && <p>Product: {offers.find((offer) => offer._id === editingOfferId)?.product?.productName || 'Selected product'}</p>}
        <select className="select" name="discountType" value={form.discountType} onChange={handleChange} required>
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed amount</option>
        </select>
        <input className="input" type="number" min="0.01" step="0.01" name="discountValue" value={form.discountValue} onChange={handleChange} placeholder="Discount value" required />
        <label>Start date<input className="input" type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange} required /></label>
        <label>End date<input className="input" type="datetime-local" name="endDate" value={form.endDate} onChange={handleChange} required /></label>
        <label><input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} /> Active</label>
        <button className="button" type="submit" disabled={loading || (!editingOfferId && products.length === 0)}>{loading ? 'Saving...' : editingOfferId ? 'Update Offer' : 'Add Offer'}</button>{' '}
        {editingOfferId && <button className="button" type="button" onClick={() => { setEditingOfferId(null); setForm(emptyOffer); }}>Cancel</button>}
      </form>

      {offers.length === 0 ? <p>No offers created yet.</p> : (
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th>Product</th><th>Brand</th><th>Original</th><th>Discount</th><th>Final</th><th>Dates</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer._id}>
                  <td>{offer.product?.image && <img src={offer.product.image} alt="" style={{ width: 42, height: 42, objectFit: 'cover', verticalAlign: 'middle', marginRight: 6 }} />}{offer.product?.productName}</td>
                  <td>{offer.product?.brand}</td>
                  <td>₹{offer.product?.sellingPrice}</td>
                  <td>{offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}</td>
                  <td>₹{offer.finalPrice}</td>
                  <td>{formatDate(offer.startDate)} - {formatDate(offer.endDate)}</td>
                  <td>{offer.isCurrentlyActive ? 'Active' : offer.isActive ? 'Scheduled/Expired' : 'Inactive'}</td>
                  <td>
                    <button className="button" type="button" onClick={() => editOffer(offer)}>Edit</button>{' '}
                    <button className="button" type="button" onClick={() => updateStatus(offer)}>{offer.isActive ? 'Deactivate' : 'Activate'}</button>{' '}
                    <button className="button" type="button" onClick={() => deleteOffer(offer._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
