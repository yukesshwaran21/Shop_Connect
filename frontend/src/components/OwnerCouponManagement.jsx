import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const emptyCoupon = {
  couponCode: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minimumPurchase: '0',
  maximumDiscount: '0',
  applicableProducts: [],
  applicableBrands: [],
  applicableCategories: [],
  startDate: '',
  endDate: '',
  usageLimit: '1',
  isActive: true,
};

const dateValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function OwnerCouponManagement({ products }) {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyCoupon);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const brands = useMemo(() => [...new Set(products.map((product) => product.brand).filter(Boolean))], [products]);
  const categories = useMemo(() => [...new Set(products.map((product) => product.category).filter(Boolean))], [products]);

  const fetchCoupons = async () => {
    try {
      const response = await api.get('/coupons/my-coupons', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setCoupons(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load coupons.');
    }
  };

  useEffect(() => { fetchCoupons(); }, [products]);

  const change = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleList = (name, value) => {
    setForm((current) => ({ ...current, [name]: current[name].includes(value) ? current[name].filter((item) => item !== value) : [...current[name], value] }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = { ...form, couponCode: form.couponCode.toUpperCase(), discountValue: Number(form.discountValue), minimumPurchase: Number(form.minimumPurchase), maximumDiscount: Number(form.maximumDiscount), usageLimit: Number(form.usageLimit) };
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      if (editingId) await api.put(`/coupons/${editingId}`, payload, config);
      else await api.post('/coupons', payload, config);
      setForm(emptyCoupon);
      setEditingId(null);
      setMessage('Coupon saved successfully.');
      await fetchCoupons();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save coupon.');
    } finally { setLoading(false); }
  };

  const edit = (coupon) => {
    setEditingId(coupon._id);
    setForm({
      couponCode: coupon.couponCode,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumPurchase: coupon.minimumPurchase,
      maximumDiscount: coupon.maximumDiscount,
      applicableProducts: coupon.applicableProducts || [],
      applicableBrands: coupon.applicableBrands || (coupon.applicableBrand ? [coupon.applicableBrand] : []),
      applicableCategories: coupon.applicableCategories || (coupon.applicableCategory ? [coupon.applicableCategory] : []),
      startDate: dateValue(coupon.startDate),
      endDate: dateValue(coupon.endDate),
      usageLimit: coupon.usageLimit,
      isActive: coupon.isActive,
    });
  };

  const status = async (coupon) => {
    try {
      await api.patch(`/coupons/${coupon._id}/status`, { isActive: !coupon.isActive }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      await fetchCoupons();
    } catch (error) { setMessage(error.response?.data?.message || 'Unable to update coupon status.'); }
  };

  const remove = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.couponCode}?`)) return;
    try {
      await api.delete(`/coupons/${coupon._id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setCoupons((current) => current.filter((item) => item._id !== coupon._id));
    } catch (error) { setMessage(error.response?.data?.message || 'Unable to delete coupon.'); }
  };

  return (
    <section className="card">
      <h3>Coupons</h3>
      {message && <p>{message}</p>}
      <form onSubmit={submit}>
        <h4>{editingId ? 'Edit Coupon' : 'Add Coupon'}</h4>
        <input className="input" name="couponCode" value={form.couponCode} onChange={change} placeholder="Coupon Code" required disabled={Boolean(editingId)} />
        <select className="select" name="discountType" value={form.discountType} onChange={change}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount</option></select>
        <input className="input" type="number" min="0.01" step="0.01" name="discountValue" value={form.discountValue} onChange={change} placeholder="Discount value" required />
        <input className="input" type="number" min="0" step="0.01" name="minimumPurchase" value={form.minimumPurchase} onChange={change} placeholder="Minimum purchase" />
        <input className="input" type="number" min="0" step="0.01" name="maximumDiscount" value={form.maximumDiscount} onChange={change} placeholder="Maximum discount (0 = none)" />
        <label>Start date<input className="input" type="datetime-local" name="startDate" value={form.startDate} onChange={change} required /></label>
        <label>End date<input className="input" type="datetime-local" name="endDate" value={form.endDate} onChange={change} required /></label>
        <input className="input" type="number" min="1" step="1" name="usageLimit" value={form.usageLimit} onChange={change} placeholder="Usage limit" required />
        <p>Applicable products</p>
        {products.map((product) => <label key={product._id} style={{ display: 'block' }}><input type="checkbox" checked={form.applicableProducts.includes(product._id)} onChange={() => toggleList('applicableProducts', product._id)} /> {product.productName}</label>)}
        <p>Applicable brands</p>
        {brands.map((brand) => <label key={brand} style={{ marginRight: 12 }}><input type="checkbox" checked={form.applicableBrands.includes(brand)} onChange={() => toggleList('applicableBrands', brand)} /> {brand}</label>)}
        <p>Applicable categories</p>
        {categories.map((category) => <label key={category} style={{ marginRight: 12 }}><input type="checkbox" checked={form.applicableCategories.includes(category)} onChange={() => toggleList('applicableCategories', category)} /> {category}</label>)}
        <label><input type="checkbox" name="isActive" checked={form.isActive} onChange={change} /> Active</label>
        <div><button className="button" type="submit" disabled={loading}>{loading ? 'Saving...' : editingId ? 'Update Coupon' : 'Add Coupon'}</button>{' '}{editingId && <button className="button" type="button" onClick={() => { setEditingId(null); setForm(emptyCoupon); }}>Cancel</button>}</div>
      </form>
      {coupons.length === 0 ? <p>No coupons created yet.</p> : <div style={{ overflowX: 'auto', marginTop: 16 }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th>Code</th><th>Discount</th><th>Minimum</th><th>Limit</th><th>Used</th><th>Status</th><th>Actions</th></tr></thead><tbody>{coupons.map((coupon) => <tr key={coupon._id}><td>{coupon.couponCode}</td><td>{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td><td>₹{coupon.minimumPurchase}</td><td>{coupon.usageLimit}</td><td>{coupon.usedCount}</td><td>{coupon.isActive ? 'Active' : 'Inactive'}</td><td><button className="button" type="button" onClick={() => edit(coupon)}>Edit</button>{' '}<button className="button" type="button" onClick={() => status(coupon)}>{coupon.isActive ? 'Deactivate' : 'Activate'}</button>{' '}<button className="button" type="button" onClick={() => remove(coupon)}>Delete</button></td></tr>)}</tbody></table></div>}
    </section>
  );
}
