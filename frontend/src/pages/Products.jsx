import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import { currency, formatDate, CATEGORIES } from '../utils/format.js';

export default function Products() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('-createdAt');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort };
      if (q) params.q = q;
      if (category) params.category = category;
      const { data } = await api.get('/products', { params });
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, [q, category, sort]);

  // Debounce search/filter changes.
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <Link
          to="/products/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + Add Product
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, brand, model…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500"
        >
          <option value="-createdAt">Newest</option>
          <option value="createdAt">Oldest</option>
          <option value="name">Name A–Z</option>
          <option value="-purchasePrice">Price high–low</option>
          <option value="warrantyExpiry">Warranty soonest</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-slate-400">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <Link
              key={p._id}
              to={`/products/${p._id}`}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-36 items-center justify-center bg-slate-50 text-5xl">
                {p.coverImage ? (
                  <img src={p.coverImage} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  '📦'
                )}
              </div>
              <div className="p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {p.category}
                  </span>
                  {p.purchasePrice > 0 && (
                    <span className="text-sm font-semibold text-slate-700">
                      {currency(p.purchasePrice)}
                    </span>
                  )}
                </div>
                <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand-600">
                  {p.name}
                </h3>
                <p className="truncate text-sm text-slate-400">{p.brand || '—'}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Purchased {formatDate(p.purchaseDate)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
