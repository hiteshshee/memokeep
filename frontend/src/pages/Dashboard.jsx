import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import { Package, FileText, AlarmClock, Wallet, ArrowRight } from 'lucide-react';
import api from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { currency, formatDate, daysUntil } from '../utils/format.js';

// Colourful (non-monotonous) palette for the chart + rotating tiles.
const COLORS = ['#2f6bff', '#7c3aed', '#ec4899', '#f97316', '#22c55e', '#06b6d4', '#eab308', '#f43f5e', '#14b8a6'];
const TILES = ['tile-blue', 'tile-purple', 'tile-pink', 'tile-green', 'tile-orange', 'tile-cyan', 'tile-indigo', 'tile-red'];

function StatCard({ label, value, Icon, tile }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{label}</p>
          <p className="mt-1 truncate font-display text-2xl font-bold text-ink-900">{value}</p>
        </div>
        <span className={`icon-tile ${tile} h-12 w-12 shrink-0`}>
          <Icon size={20} strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const user = useSelector((s) => s.auth.user);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard'));
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <Spinner />;

  const { stats, expiringWarranties, byCategory, recentProducts } = data;
  const pieData = byCategory.map((c) => ({ name: c._id, value: c.count }));

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Everything you own, at a glance." />

      {/* Stat row — each a different colour */}
      <div className="reveal-stagger grid grid-cols-2 gap-5 lg:grid-cols-4">
        <StatCard label="Products" value={stats.productCount} Icon={Package} tile="tile-blue" />
        <StatCard label="Documents" value={stats.documentCount} Icon={FileText} tile="tile-purple" />
        <StatCard label="Expiring (30d)" value={stats.expiringCount} Icon={AlarmClock} tile="tile-orange" />
        <StatCard label="Total Value" value={currency(stats.totalValue)} Icon={Wallet} tile="tile-green" />
      </div>

      {/* Hero + category */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Welcome hero — soft light gradient with colour accents */}
        <div
          className="card relative overflow-hidden p-8 lg:col-span-2"
          style={{ background: 'linear-gradient(120deg, #eaf1ff, #eef0ff 50%, #f4ecff)' }}
        >
          <div className="pointer-events-none absolute -right-8 -top-10 h-56 w-56 rounded-full bg-gradient-to-br from-blue-400/35 to-violet-400/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-14 right-1/3 h-44 w-44 rounded-full bg-pink-300/30 blur-3xl" />
          <div className="relative z-10 max-w-md">
            <p className="text-sm font-semibold text-gold-600">Welcome back,</p>
            <h2 className="mt-1 font-display text-3xl font-bold text-ink-900">{user?.name || 'there'}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              Glad to see you again. Everything you own is safe, searchable and beautifully organised.
            </p>
            <Link to="/products" className="btn-primary mt-7">
              Browse your collection <ArrowRight size={16} strokeWidth={2.25} />
            </Link>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card p-6">
          <h2 className="mb-2 text-lg font-semibold text-ink-900">By Category</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-ink-400">No products yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} stroke="none">
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e7ecf5', borderRadius: 12, color: '#10193b', boxShadow: '0 8px 24px -12px rgba(20,30,80,0.25)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent + expiring */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recently added */}
        <div className="card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-900">Recently Added</h2>
            <Link to="/products" className="link-gold text-sm">
              View all →
            </Link>
          </div>
          {recentProducts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-ink-400">No products yet.</p>
              <Link to="/products/new" className="btn-primary mt-4">
                Add your first product
              </Link>
            </div>
          ) : (
            <div className="reveal-stagger grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {recentProducts.map((p, i) => (
                <Link
                  key={p._id}
                  to={`/products/${p._id}`}
                  className="group rounded-2xl border border-line bg-ivory-50 p-3 transition duration-300 hover:-translate-y-1 hover:border-gold-300 hover:shadow-[0_18px_36px_-18px_rgba(47,107,255,0.5)]"
                >
                  <div className="mb-2 flex h-20 items-center justify-center overflow-hidden rounded-xl">
                    {p.coverImage ? (
                      <img src={p.coverImage} alt={p.name} className="h-full w-full rounded-xl object-cover" />
                    ) : (
                      <span className={`icon-tile ${TILES[i % TILES.length]} h-full w-full`}>
                        <Package size={26} strokeWidth={1.75} />
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm font-semibold text-ink-800 group-hover:text-gold-600">{p.name}</p>
                  <p className="text-xs text-ink-400">{formatDate(p.createdAt)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Expiring warranties */}
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">Expiring Soon</h2>
          {expiringWarranties.length === 0 ? (
            <p className="text-sm text-ink-400">Nothing expiring in the next 30 days.</p>
          ) : (
            <ul className="divide-y divide-line">
              {expiringWarranties.map((p) => {
                const days = daysUntil(p.warrantyExpiry);
                return (
                  <li key={p._id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <Link to={`/products/${p._id}`} className="block truncate font-semibold text-ink-700 transition hover:text-gold-600">
                        {p.name}
                      </Link>
                      <p className="truncate text-xs text-ink-400">{p.brand || p.category}</p>
                    </div>
                    <span
                      className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        days <= 7 ? 'bg-red-100 text-red-600' : 'bg-gold-50 text-gold-600'
                      }`}
                    >
                      {days}d
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
