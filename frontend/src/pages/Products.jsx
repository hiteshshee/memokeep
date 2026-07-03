import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, Plus, Search } from 'lucide-react';
import api from '../api/client.js';
import { ProductsSkeleton } from '../components/Skeleton.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { currency, formatDate, CATEGORIES, categoryTile } from '../utils/format.js';

const PAGE_SIZE = 24;

export default function Products() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('-createdAt');

  // Honour ?category= shortcuts coming from the sidebar.
  useEffect(() => {
    setCategory(searchParams.get('category') || '');
  }, [searchParams]);

  // pageNum 1 replaces the list (fresh search/filter); higher pages append.
  const load = useCallback(
    async (pageNum) => {
      const replace = pageNum === 1;
      replace ? setLoading(true) : setLoadingMore(true);
      try {
        const params = { sort, page: pageNum, limit: PAGE_SIZE };
        if (q) params.q = q;
        if (category) params.category = category;
        const { data } = await api.get('/products', { params });
        setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
        setTotal(data.total);
        setPages(data.pages);
        setPage(data.page);
      } finally {
        replace ? setLoading(false) : setLoadingMore(false);
      }
    },
    [q, category, sort]
  );

  // Debounce search/filter changes; always reset to the first page.
  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Your complete collection."
        action={
          <Link to="/products/new" className="btn-primary">
            <Plus size={16} strokeWidth={2.25} /> Add Product
          </Link>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, brand, model…"
            className="input pl-10"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input sm:w-48">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input sm:w-48">
          <option value="-createdAt">Newest</option>
          <option value="createdAt">Oldest</option>
          <option value="name">Name A–Z</option>
          <option value="-purchasePrice">Price high–low</option>
          <option value="warrantyExpiry">Warranty soonest</option>
        </select>
      </div>

      {loading ? (
        <ProductsSkeleton />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line py-16 text-center">
          <p className="text-ink-400">No products found.</p>
        </div>
      ) : (
        <>
        <p className="text-sm text-ink-400">Showing {items.length} of {total}</p>
        <div className="reveal-stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <Link
              key={p._id}
              to={`/products/${p._id}`}
              className="group card overflow-hidden p-0"
            >
              <div className="flex h-40 items-center justify-center overflow-hidden">
                {p.coverImage ? (
                  <img src={p.coverImage} alt={p.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : (
                  <span className={`icon-tile ${categoryTile(p.category)} h-full w-full rounded-none`}>
                    <Package size={44} strokeWidth={1.25} />
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="badge">{p.category}</span>
                  {p.purchasePrice > 0 && (
                    <span className="font-display text-sm font-semibold text-ink-800">
                      {currency(p.purchasePrice)}
                    </span>
                  )}
                </div>
                <h3 className="truncate font-display text-base font-semibold text-ink-900 group-hover:text-gold-700">
                  {p.name}
                </h3>
                <p className="truncate text-sm text-ink-400">{p.brand || '—'}</p>
                <p className="mt-2 text-xs text-ink-400">Purchased {formatDate(p.purchaseDate)}</p>
              </div>
            </Link>
          ))}
        </div>
        {page < pages && (
          <div className="flex justify-center pt-2">
            <button onClick={() => load(page + 1)} disabled={loadingMore} className="btn-ghost">
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
