import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', form);
      const { token, ...userData } = response.data;
      login(userData, token);

      if (userData.role === 'SHOP_OWNER') navigate('/owner-dashboard');
      else if (userData.role === 'ADMIN') navigate('/admin-dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="container">
      <form className="form-box" onSubmit={handleSubmit}>
        <h2>User Login</h2>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <input
          className="input"
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          className="input"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button className="button" type="submit">Login</button>
        <p>
          Need an account? <Link to="/register">Register</Link>
        </p>
        <p>
          Shop owner? <Link to="/owner-login">Owner Login</Link>
        </p>
        <p>
          Admin? <Link to="/admin-login">Admin Login</Link>
        </p>
      </form>
    </div>
  );
}
