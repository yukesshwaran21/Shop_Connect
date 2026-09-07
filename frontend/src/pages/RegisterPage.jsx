import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    ownerId: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        ...form,
        role: form.role || 'USER',
      };

      const response = await api.post('/auth/register', payload);
      const { token, ...userData } = response.data;
      login(userData, token);

      if (userData.role === 'SHOP_OWNER') navigate('/owner-dashboard');
      else if (userData.role === 'ADMIN') navigate('/admin-dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="container">
      <form className="form-box" onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        <select className="select" name="role" value={form.role} onChange={handleChange}>
          <option value="USER">User</option>
          <option value="SHOP_OWNER">Shop Owner</option>
        </select>

        <input
          className="input"
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          className="input"
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        {form.role === 'SHOP_OWNER' && (
          <input
            className="input"
            type="text"
            name="ownerId"
            placeholder="Owner ID"
            value={form.ownerId}
            onChange={handleChange}
            required
          />
        )}
        <input
          className="input"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button className="button" type="submit">Register</button>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
        <p>
          Create shop owner account? <Link to="/owner-register">Owner Register</Link>
        </p>
      </form>
    </div>
  );
}
