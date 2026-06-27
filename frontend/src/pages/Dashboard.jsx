import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import api from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import { currency, formatDate, daysUntil } from '../utils/format.js';

const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#94a3b8'];

function StatCard({ label, value, icon, accent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`text-2xl ${accent}`}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <Spinner />;

  const { stats, expiringWarranties, byCategory, recentProducts } = data;
  const pieData = byCategory.map((c) => ({ name: c._id, value: c.count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Everything you own, at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Products" value={stats.productCount} icon="📦" accent="" />
        <StatCard label="Documents" value={stats.documentCount} icon="📄" accent="" />
        <StatCard label="Expiring (30d)" value={stats.expiringCount} icon="⏰" accent="" />
        <StatCard label="Total Value" value={currency(stats.totalValue)} icon="💰" accent="" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">By Category</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-slate-400">No products yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {pieData.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expiring warranties */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Warranties Expiring Soon</h2>
          {expiringWarranties.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing expiring in the next 30 days. 🎉</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {expiringWarranties.map((p) => {
                const days = daysUntil(p.warrantyExpiry);
                return (
                  <li key={p._id} className="flex items-center justify-between py-2.5">
                    <div>
                      <Link to={`/products/${p._id}`} className="font-medium text-slate-800 hover:text-brand-600">
                        {p.name}
                      </Link>
                      <p className="text-xs text-slate-400">{p.brand || p.category}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        days <= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {days}d left
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Recent products */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recently Added</h2>
          <Link to="/products" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {recentProducts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-400">No products yet.</p>
            <Link
              to="/products/new"
              className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {recentProducts.map((p) => (
              <Link
                key={p._id}
                to={`/products/${p._id}`}
                className="rounded-lg border border-slate-100 p-3 transition hover:border-brand-200 hover:shadow"
              >
                <div className="mb-2 flex h-20 items-center justify-center rounded bg-slate-50 text-3xl">
                  {p.coverImage ? (
                    <img src={p.coverImage} alt={p.name} className="h-full w-full rounded object-cover" />
                  ) : (
                    '📦'
                  )}
                </div>
                <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-400">{formatDate(p.createdAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
