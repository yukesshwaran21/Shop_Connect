import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import OwnerOfferManagement from '../components/OwnerOfferManagement';
import OwnerCouponManagement from '../components/OwnerCouponManagement';

const emptyForm = {
  shopName: '',
  logo: '',
  paymentQrCode: '',
  description: '',
  address: '',
  city: '',
  category: '',
  contactNumber: '',
};

const emptyProduct = {
  productName: '',
  image: '',
  description: '',
  brand: '',
  category: '',
  originalPrice: '',
  sellingPrice: '',
  stock: '',
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productMessage, setProductMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMyShop = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await api.get('/shops/my-shops', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const firstShop = response.data[0] || null;
      setShop(firstShop);
      if (firstShop) {
        setForm({
          shopName: firstShop.shopName || '',
          logo: firstShop.logo || '',
          paymentQrCode: firstShop.paymentQrCode || '',
          description: firstShop.description || '',
          address: firstShop.address || '',
          city: firstShop.city || '',
          category: firstShop.category || '',
          contactNumber: firstShop.contactNumber || '',
        });
      } else {
        setForm(emptyForm);
      }
    } catch (error) {
      setShop(null);
      setForm(emptyForm);
    }
  };

  useEffect(() => {
    fetchMyShop();
  }, [user]);

  const fetchProducts = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await api.get('/products/my-products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data);
    } catch (error) {
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user, shop]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await fileToDataUrl(file);
    setForm((current) => ({ ...current, [event.target.name]: dataUrl }));
  };

  const handleProductChange = (event) => {
    setProductForm({ ...productForm, [event.target.name]: event.target.value });
  };

  const handleProductImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await fileToDataUrl(file);
    setProductForm((current) => ({ ...current, image: dataUrl }));
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setProductLoading(true);
    setProductMessage('');

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, productForm, config);
        setProductMessage('Product updated successfully.');
      } else {
        await api.post('/products', productForm, config);
        setProductMessage('Product created successfully.');
      }
      setProductForm(emptyProduct);
      setEditingProductId(null);
      await fetchProducts();
    } catch (error) {
      if (error.response?.status === 403) {
        setProductMessage('Owner access is required. Log out and sign in through Owner Login before managing products.');
      } else {
        setProductMessage(error.response?.data?.message || 'Unable to save product.');
      }
    } finally {
      setProductLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      productName: product.productName || '',
      image: product.image || '',
      description: product.description || '',
      brand: product.brand || '',
      category: product.category || '',
      originalPrice: product.originalPrice ?? '',
      sellingPrice: product.sellingPrice ?? '',
      stock: product.stock ?? '',
    });
    setProductMessage('');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    const token = localStorage.getItem('token');
    try {
      await api.delete(`/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((current) => current.filter((product) => product._id !== productId));
      if (editingProductId === productId) {
        setEditingProductId(null);
        setProductForm(emptyProduct);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setProductMessage('Owner access is required. Log out and sign in through Owner Login before managing products.');
      } else {
        setProductMessage(error.response?.data?.message || 'Unable to delete product.');
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);

    try {
      if (shop) {
        await api.put(`/shops/${shop._id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post('/shops', form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await fetchMyShop();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Shop Owner Dashboard</h2>
        <p>Owner: {user?.name}</p>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <h3>{shop ? 'Edit Shop Profile' : 'Create Your Shop'}</h3>

        <input className="input" name="shopName" value={form.shopName} onChange={handleChange} placeholder="Shop Name" required />
        <textarea className="input" name="description" value={form.description} onChange={handleChange} placeholder="Description" rows="4" />
        <input className="input" name="address" value={form.address} onChange={handleChange} placeholder="Address" required />
        <input className="input" name="city" value={form.city} onChange={handleChange} placeholder="City" required />
        <input className="input" name="category" value={form.category} onChange={handleChange} placeholder="Category" required />
        <input className="input" name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="Contact Number" required />

        <label className="mb-2">
          Shop Logo
          <input className="input" type="file" name="logo" accept="image/*" onChange={handleImageChange} />
        </label>

        {form.logo && <img src={form.logo} alt="Shop logo preview" style={{ maxWidth: 180, maxHeight: 120, display: 'block', marginBottom: 12 }} />}

        <label className="mb-2">
          Payment QR Code
          <input className="input" type="file" name="paymentQrCode" accept="image/*" onChange={handleImageChange} />
        </label>

        {form.paymentQrCode && <img src={form.paymentQrCode} alt="Payment QR preview" style={{ maxWidth: 180, maxHeight: 180, display: 'block', marginBottom: 12 }} />}

        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Saving...' : shop ? 'Update Shop' : 'Create Shop'}
        </button>
      </form>

      <section className="card">
        <h3>Products</h3>
        {products.length === 0 ? (
          <p>No products added yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Original Price</th>
                  <th>Selling Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>{product.image && <img src={product.image} alt={product.productName} style={{ width: 52, height: 52, objectFit: 'cover' }} />}</td>
                    <td>{product.productName}</td>
                    <td>{product.brand}</td>
                    <td>{product.category}</td>
                    <td>{product.originalPrice}</td>
                    <td>{product.sellingPrice}</td>
                    <td>{product.stock}</td>
                    <td>
                      <button className="button" type="button" onClick={() => handleEditProduct(product)}>Edit</button>{' '}
                      <button className="button" type="button" onClick={() => handleDeleteProduct(product._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <form className="card" onSubmit={handleProductSubmit}>
        <h3>{editingProductId ? 'Edit Product' : 'Add Product'}</h3>
        {productMessage && <p>{productMessage}</p>}
        <input className="input" name="productName" value={productForm.productName} onChange={handleProductChange} placeholder="Product Name" required />
        <input className="input" type="file" name="image" accept="image/*" onChange={handleProductImageChange} />
        {productForm.image && <img src={productForm.image} alt="Product preview" style={{ width: 120, height: 120, objectFit: 'cover', display: 'block', marginBottom: 12 }} />}
        <textarea className="input" name="description" value={productForm.description} onChange={handleProductChange} placeholder="Description" rows="3" />
        <input className="input" name="brand" value={productForm.brand} onChange={handleProductChange} placeholder="Brand" required />
        <input className="input" name="category" value={productForm.category} onChange={handleProductChange} placeholder="Category" required />
        <input className="input" type="number" min="0" step="0.01" name="originalPrice" value={productForm.originalPrice} onChange={handleProductChange} placeholder="Original Price" required />
        <input className="input" type="number" min="0" step="0.01" name="sellingPrice" value={productForm.sellingPrice} onChange={handleProductChange} placeholder="Selling Price" required />
        <input className="input" type="number" min="0" step="1" name="stock" value={productForm.stock} onChange={handleProductChange} placeholder="Available Stock" required />
        <button className="button" type="submit" disabled={productLoading}>
          {productLoading ? 'Saving...' : editingProductId ? 'Update Product' : 'Add Product'}
        </button>{' '}
        {editingProductId && <button className="button" type="button" onClick={() => { setEditingProductId(null); setProductForm(emptyProduct); }}>Cancel Edit</button>}
      </form>

      <OwnerOfferManagement products={products} />
      <OwnerCouponManagement products={products} />
    </div>
  );
}
