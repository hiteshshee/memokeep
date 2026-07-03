import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Users, Package, FileText, FolderLock, ShieldCheck, ShieldAlert } from 'lucide-react';
import api from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import Spinner from '../components/Spinner.jsx';
import { formatDate, formatDateTime } from '../utils/format.js';

const StatTile = ({ icon: Icon, label, value }) => (
  <div className="card flex items-center gap-4 p-5">
    <span className="icon-tile flex h-11 w-11 shrink-0 items-center justify-center">
      <Icon size={20} strokeWidth={2} />
    </span>
    <div>
      <p className="font-display text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
    </div>
  </div>
);

export default function Admin() {
  const { user } = useSelector((s) => s.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/users')
      .then(({ data }) => setData(data))
      .catch((e) => setError(e.response?.data?.message || 'Could not load users'))
      .finally(() => setLoading(false));
  }, []);

  // Client-side guard — the backend also enforces this with requireRole('admin').
  if (user && user.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <PageHeader title="Admin" subtitle="Every user, their activity, and what they've stored." />

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="rounded-xl border border-dashed border-line py-16 text-center">
          <p className="text-ink-400">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile icon={Users} label="Users" value={data.totals.users} />
            <StatTile icon={Package} label="Products" value={data.totals.products} />
            <StatTile icon={FileText} label="Documents" value={data.totals.documents} />
            <StatTile icon={FolderLock} label="Vault items" value={data.totals.vault} />
          </div>

          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Products</th>
                  <th className="px-4 py-3 text-right font-semibold">Docs</th>
                  <th className="px-4 py-3 text-right font-semibold">Vault</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Last login</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u._id} className="border-b border-line/60 last:border-0 hover:bg-ivory-100/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-300 bg-gold-50 font-display text-sm font-semibold text-gold-700">
                          {u.name?.[0]?.toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-900">
                            {u.name}
                            {u.role === 'admin' && (
                              <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-purple-700">
                                Admin
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-ink-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <ShieldCheck size={14} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                          <ShieldAlert size={14} /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">{u.products}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">{u.documents}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-700">{u.vault}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-500">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-500">{formatDateTime(u.lastLoginAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
