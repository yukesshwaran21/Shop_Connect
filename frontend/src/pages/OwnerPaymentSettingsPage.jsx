import { useEffect, useState } from 'react';
import api from '../services/api';

const emptyPayment = { upiId: '', qrCode: '', displayName: '', instructions: '' };
const maxQrSize = 5 * 1024 * 1024;

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function OwnerPaymentSettingsPage() {
  const [payment, setPayment] = useState(emptyPayment);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/shops/my-shop/payment', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then((response) => setPayment({ ...emptyPayment, ...response.data }))
      .catch((error) => setMessage(error.response?.data?.message || 'Unable to load payment settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleQrChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file for the QR code.');
      return;
    }
    if (file.size > maxQrSize) {
      setMessage('QR code image must be 5 MB or smaller.');
      return;
    }
    try {
      const qrCode = await fileToDataUrl(file);
      setPayment((current) => ({ ...current, qrCode }));
      setMessage('QR preview updated. Save to apply it.');
    } catch (error) {
      setMessage('Unable to read that image.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await api.put('/shops/my-shop/payment', payment, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setPayment({ ...emptyPayment, ...response.data });
      setMessage('Payment settings saved.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save payment settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container">Loading payment settings...</div>;

  return (
    <div className="container">
      <form className="card" onSubmit={handleSubmit}>
        <h2>Payment Settings</h2>
        {message && <p>{message}</p>}
        <label>UPI ID<input className="input" value={payment.upiId} onChange={(event) => setPayment({ ...payment, upiId: event.target.value })} placeholder="name@upi" /></label>
        <label>Payment Display Name<input className="input" value={payment.displayName} onChange={(event) => setPayment({ ...payment, displayName: event.target.value })} placeholder="Your shop name" /></label>
        <label>Payment Instructions<textarea className="input" rows="4" value={payment.instructions} onChange={(event) => setPayment({ ...payment, instructions: event.target.value })} placeholder="Scan the QR code and pay the exact order amount." /></label>
        <label>QR Code<input className="input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleQrChange} /></label>
        {payment.qrCode && <img src={payment.qrCode} alt="Payment QR preview" style={{ width: 220, height: 220, objectFit: 'contain', display: 'block', margin: '12px 0' }} />}
        {payment.qrCode && <button className="button secondary" type="button" onClick={() => setPayment({ ...payment, qrCode: '' })}>Remove QR Code</button>}
        <button className="button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Payment Settings'}</button>
      </form>
    </div>
  );
}
