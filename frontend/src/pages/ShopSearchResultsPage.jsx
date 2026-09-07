import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function ShopSearchResultsPage() {
  const [searchParams] = useSearchParams();
  const [shops, setShops] = useState([]);

  useEffect(() => {
    const category = searchParams.get('category');
    const city = searchParams.get('city');

    if (!category || !city) return;

    api
      .get(`/shops/search?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`)
      .then((response) => setShops(response.data))
      .catch(() => setShops([]));
  }, [searchParams]);

  return (
    <div className="container">
      <h2>Shops in {searchParams.get('city')}</h2>
      <div className="grid grid-3">
        {shops.length ? (
          shops.map((shop) => (
            <div key={shop._id} className="shop-card">
              <h3>{shop.shopName}</h3>
              <p>{shop.category}</p>
              <p>{shop.city}</p>
              <p>{shop.description}</p>
              <Link to={`/shop/${shop._id}`}>View Shop</Link>
            </div>
          ))
        ) : (
          <p>No shops found for this search.</p>
        )}
      </div>
    </div>
  );
}
