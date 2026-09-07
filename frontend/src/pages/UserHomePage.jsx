import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function UserHomePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('Electronics');
  const [city, setCity] = useState('Erode');

  const handleSearch = () => {
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
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Electronics</option>
            <option>Clothes</option>
            <option>Food</option>
            <option>Groceries</option>
            <option>Furniture</option>
            <option>Beauty</option>
            <option>Sports</option>
          </select>
          <select className="select" value={city} onChange={(e) => setCity(e.target.value)}>
            <option>Erode</option>
            <option>Chennai</option>
            <option>Coimbatore</option>
            <option>Salem</option>
          </select>
          <button className="button" onClick={handleSearch}>Search Shops</button>
        </div>
      </section>

      <div className="container">
        <h2>Popular categories</h2>
        <div className="grid grid-3">
          {['Electronics', 'Clothes', 'Food', 'Groceries', 'Furniture', 'Beauty', 'Sports'].map((item) => (
            <div className="card" key={item}>{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
