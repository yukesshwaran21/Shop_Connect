import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminRegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
        role: 'ADMIN',
      });
      const { token, ...userData } = response.data;
      login(userData, token);
      navigate('/admin-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Admin registration failed');
    }
  };

  return (
    <div className="container">
      <form className="form-box" onSubmit={handleSubmit}>
        <h2>Admin Registration</h2>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <input className="input" name="name" type="text" placeholder="Admin Name" value={form.name} onChange={handleChange} required />
        <input className="input" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input className="input" name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <button className="button" type="submit">Register as Admin</button>
        <p>
          Already have admin access? <Link to="/admin-login">Admin Login</Link>
        </p>
      </form>
    </div>
  );
}
