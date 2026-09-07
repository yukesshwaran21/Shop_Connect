import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

export default function ShopDetailsPage() {
  const { shopId } = useParams();
  const { addToCart } = useCart();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!shopId) return;

    api.get(`/shops/${shopId}`).then((response) => setShop(response.data));
    api.get(`/products/shop/${shopId}`).then((response) => setProducts(response.data));
  }, [shopId]);

  if (!shop) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div className="card mb-2">
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
            <p>Selling: ₹{product.sellingPrice}</p>
            <p>Stock: {product.stock}</p>
            <button className="button" type="button" onClick={() => addToCart(product, shop)}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
