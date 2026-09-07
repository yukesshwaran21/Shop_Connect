import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export default function ShopDetailsPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartMessage } = useCart();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedProductId, setAddedProductId] = useState(null);

  const handleAddToCart = (product) => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    const added = addToCart(product, shop);
    if (added) {
      setAddedProductId(product._id);
      window.setTimeout(() => setAddedProductId(null), 1500);
    }
  };

  useEffect(() => {
    if (!shopId) return;

    setLoading(true);
    setError('');
    Promise.all([
      api.get(`/shops/${shopId}`),
      api.get(`/products/shop/${shopId}`),
    ]).then(async ([shopResponse, productsResponse]) => {
      setShop(shopResponse.data);
      const response = { data: productsResponse.data };
      const productsWithOffers = await Promise.all(response.data.map(async (product) => {
        try {
          const offerResponse = await api.get(`/offers/product/${product._id}`);
          const offer = offerResponse.data[0];
          return offer ? { ...product, activeOffer: offer, currentPrice: offer.finalPrice } : product;
        } catch (error) {
          return product;
        }
      }));
      setProducts(productsWithOffers);
    }).catch(() => setError('Unable to load this shop right now.'))
      .finally(() => setLoading(false));
  }, [shopId]);

  if (loading) return <div className="container">Loading shop...</div>;
  if (error || !shop) return <div className="container">{error || 'Shop not found.'}</div>;

  return (
    <div className="container">
      <div className="card mb-2">
        {shop.logo && <img className="shop-detail-logo" src={shop.logo} alt={`${shop.shopName} logo`} />}
        <h2>{shop.shopName}</h2>
        <p>{shop.description}</p>
        <p>City: {shop.city}</p>
        <p>Address: {shop.address}</p>
        <p>Contact: {shop.contactNumber}</p>
      </div>

      <h3>Products</h3>
      {cartMessage && <p>{cartMessage}</p>}
      <div className="grid grid-3">
        {products.map((product) => (
          <div className="card" key={product._id}>
            <h4>{product.productName}</h4>
            <p>{product.brand}</p>
            <p>{product.description}</p>
            <p>Original: ₹{product.originalPrice}</p>
            {product.activeOffer ? (
              <>
                <p>Offer: {product.activeOffer.discountType === 'PERCENTAGE' ? `${product.activeOffer.discountValue}% OFF` : `₹${product.activeOffer.discountValue} OFF`}</p>
                <p>Offer Price: ₹{product.currentPrice}</p>
              </>
            ) : <p>Selling: ₹{product.sellingPrice}</p>}
            <p>{product.stock > 0 ? `Stock available: ${product.stock}` : 'Out of Stock'}</p>
            <button className="button" type="button" disabled={product.stock === 0} onClick={() => handleAddToCart(product)}>
              {product.stock === 0 ? 'Out of Stock' : addedProductId === product._id ? 'Added to Cart' : 'Add to Cart'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
