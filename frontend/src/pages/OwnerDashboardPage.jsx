import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [form, setForm] = useState({
    shopName: '',
    description: '',
    address: '',
    city: '',
    category: '',
    contactNumber: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    api
      .get('/shops/my-shops', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const firstShop = response.data[0] || null;
        setShop(firstShop);
        if (firstShop) {
          setForm({
            shopName: firstShop.shopName,
            description: firstShop.description,
            address: firstShop.address,
            city: firstShop.city,
            category: firstShop.category,
            contactNumber: firstShop.contactNumber,
          });
        }
      })
      .catch(() => setShop(null));
  }, [user]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');

    if (!shop) return;

    await api.put(`/shops/${shop._id}`, form, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const updated = await api.get('/shops/my-shops', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setShop(updated.data[0]);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Shop Owner Dashboard</h2>
        <p>Owner: {user?.name}</p>
      </div>

      {shop ? (
        <form className="card" onSubmit={handleSave}>
          <h3>Manage Shop Profile</h3>
          <input className="input" name="shopName" value={form.shopName} onChange={handleChange} placeholder="Shop Name" />
          <input className="input" name="description" value={form.description} onChange={handleChange} placeholder="Description" />
          <input className="input" name="address" value={form.address} onChange={handleChange} placeholder="Address" />
          <input className="input" name="city" value={form.city} onChange={handleChange} placeholder="City" />
          <input className="input" name="category" value={form.category} onChange={handleChange} placeholder="Category" />
          <input className="input" name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="Contact Number" />
          <button className="button" type="submit">Save Shop Details</button>
        </form>
      ) : (
        <div className="card">
          <p>No shop created yet. Create one from the owner flow to manage products and orders.</p>
        </div>
      )}
    </div>
  );
}
