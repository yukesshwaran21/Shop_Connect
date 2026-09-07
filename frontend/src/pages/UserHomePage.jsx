import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useEffect } from 'react';
import api from '../services/api';

export default function UserHomePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/shops/discovery-options')
      .then((response) => {
        setCategories(response.data.categories || []);
        setCities(response.data.cities || []);
        setCategory(response.data.categories?.[0] || '');
        setCity(response.data.cities?.[0] || '');
      })
      .catch(() => setError('Unable to load shop search options.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = () => {
    if (!category || !city) return;
    navigate(`/search?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`);
  };

  return (
    <div>
      <nav className="navbar">
        <h3>Shop Connect</h3>
        <div className="nav-links">
          <button className="button secondary" onClick={() => navigate('/login')}>Login</button>
          <button className="button" onClick={() => navigate('/cart')}>Cart</button>
          <button className="button secondary" onClick={() => navigate('/my-orders')}>My Orders</button>
        </div>
      </nav>

      <section className="hero">
        <h1>Find shops near you</h1>
        <div className="container search-bar">
          <label>
            Category
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} disabled={loading || !categories.length}>
              <option value="">Select category</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            City
            <select className="select" value={city} onChange={(e) => setCity(e.target.value)} disabled={loading || !cities.length}>
              <option value="">Select city</option>
              {cities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button className="button" onClick={handleSearch} disabled={loading || !category || !city}>Search Shops</button>
        </div>
        {loading && <p>Loading search options...</p>}
        {error && <p>{error}</p>}
      </section>

      <div className="container">
        <h2>Available categories</h2>
        <div className="grid grid-3">
          {categories.map((item) => (
            <div className="card" key={item}>{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
