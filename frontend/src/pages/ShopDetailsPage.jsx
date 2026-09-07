import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export default function ShopDetailsPage() {
  const { shopId } = useParams();
  const { addToCart } = useCart();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            <button className="button" type="button" disabled={product.stock === 0} onClick={() => addToCart(product, shop)}>
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
