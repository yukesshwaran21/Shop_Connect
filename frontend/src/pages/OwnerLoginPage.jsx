import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function OwnerLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ ownerId: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', {
        ...form,
        ownerId: form.ownerId,
      });
      const { token, ...userData } = response.data;
      login(userData, token);
      navigate('/owner-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Owner login failed');
    }
  };

  return (
    <div className="container">
      <form className="form-box" onSubmit={handleSubmit}>
        <h2>Shop Owner Login</h2>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <input
          className="input"
          type="text"
          name="ownerId"
          placeholder="Owner ID or Email"
          value={form.ownerId}
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
        <button className="button" type="submit">Login as Shop Owner</button>
      </form>
    </div>
  );
}
