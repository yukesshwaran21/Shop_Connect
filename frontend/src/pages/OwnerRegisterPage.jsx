import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function OwnerRegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    ownerId: '',
  });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/register', {
        ...form,
        role: 'SHOP_OWNER',
      });
      const { token, ...userData } = response.data;
      login(userData, token);
      navigate('/owner-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Owner registration failed');
    }
  };

  return (
    <div className="container">
      <form className="form-box" onSubmit={handleSubmit}>
        <h2>Shop Owner Registration</h2>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <input className="input" name="name" type="text" placeholder="Owner Name" value={form.name} onChange={handleChange} required />
        <input className="input" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input className="input" name="ownerId" type="text" placeholder="Owner ID" value={form.ownerId} onChange={handleChange} required />
        <input className="input" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <button className="button" type="submit">Register as Shop Owner</button>
        <p>
          Already have an owner account? <Link to="/owner-login">Login</Link>
        </p>
      </form>
    </div>
  );
}
