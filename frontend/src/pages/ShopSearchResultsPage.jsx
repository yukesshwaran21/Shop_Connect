import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function ShopSearchResultsPage() {
  const [searchParams] = useSearchParams();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const category = searchParams.get('category');
    const city = searchParams.get('city');

    if (!category || !city) return;

    setLoading(true);
    setError('');
    api
      .get(`/shops/search?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`)
      .then((response) => setShops(response.data.shops || []))
      .catch(() => { setShops([]); setError('Unable to find shops right now.'); })
      .finally(() => setLoading(false));
  }, [searchParams]);

  return (
    <div className="container">
      <h2>{searchParams.get('category')} shops in {searchParams.get('city')}</h2>
      {loading && <p>Finding shops...</p>}
      {error && <p>{error}</p>}
      <div className="grid grid-3">
        {!loading && !error && shops.length ? (
          shops.map((shop) => (
            <div key={shop._id} className="shop-card">
              {shop.logo && <img className="shop-logo" src={shop.logo} alt={`${shop.shopName} logo`} />}
              <h3>{shop.shopName}</h3>
              <p>{shop.categories?.join(', ') || searchParams.get('category')}</p>
              <p>{shop.city}</p>
              <p>{shop.address}</p>
              <p>{shop.description}</p>
              <Link to={`/shop/${shop._id}`}>View Shop</Link>
            </div>
          ))
        ) : (
          <p>No shops found for {searchParams.get('category')} in {searchParams.get('city')}.</p>
        )}
      </div>
    </div>
  );
}
