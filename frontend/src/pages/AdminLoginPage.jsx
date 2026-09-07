import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { ...form, role: 'ADMIN' });
      const { token, ...userData } = response.data;
      login(userData, token);
      navigate('/admin-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Admin login failed');
    }
  };

  return (
    <div className="container">
      <form className="form-box" onSubmit={handleSubmit}>
        <h2>Admin Login</h2>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <input className="input" name="email" type="email" placeholder="Admin email" onChange={handleChange} required />
        <input className="input" name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <button className="button" type="submit">Login as Admin</button>
      </form>
    </div>
  );
}
