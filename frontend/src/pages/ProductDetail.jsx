import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import { currency, formatDate, daysUntil, DOC_TYPES } from '../utils/format.js';

const TYPE_ICON = {
  invoice: '🧾', warranty: '🛡️', manual: '📘', receipt: '🧾', image: '🖼️', other: '📎',
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('invoice');
  const fileRef = useRef();

  const load = () =>
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.product);
        setDocuments(data.documents);
      })
      .catch(() => setError('Product not found'));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('product', id);
    fd.append('type', docType);
    fd.append('title', file.name);
    try {
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const deleteDoc = async (docId) => {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/documents/${docId}`);
    setDocuments((d) => d.filter((x) => x._id !== docId));
  };

  const deleteProduct = async () => {
    if (!confirm('Delete this product and all its documents?')) return;
    await api.delete(`/products/${id}`);
    navigate('/products');
  };

  if (error) return <p className="text-red-600">{error}</p>;
  if (!product) return <Spinner />;

  const warrantyDays = daysUntil(product.warrantyExpiry);
  const docUrl = (d) => (d.storage === 'local' ? d.url : d.url);

  const Row = ({ label, value }) =>
    value ? (
      <div className="flex justify-between border-b border-slate-100 py-2 text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-800">{value}</span>
      </div>
    ) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/products" className="text-sm text-brand-600 hover:underline">
          ← All products
        </Link>
        <div className="flex gap-2">
          <Link
            to={`/products/${id}/edit`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>
          <button
            onClick={deleteProduct}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Image / cover */}
        <div className="md:col-span-1">
          <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-6xl">
            {product.coverImage ? (
              <img src={product.coverImage} alt={product.name} className="h-full w-full rounded-xl object-cover" />
            ) : (
              '📦'
            )}
          </div>
        </div>

        {/* Info */}
        <div className="md:col-span-2">
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
            {product.category}
          </span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{product.name}</h1>
          <p className="text-slate-500">{product.brand} {product.model}</p>

          {product.warrantyExpiry && (
            <div
              className={`mt-3 inline-block rounded-lg px-3 py-1.5 text-sm font-medium ${
                warrantyDays < 0
                  ? 'bg-slate-100 text-slate-500'
                  : warrantyDays <= 30
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {warrantyDays < 0
                ? `Warranty expired ${formatDate(product.warrantyExpiry)}`
                : `Warranty valid until ${formatDate(product.warrantyExpiry)} (${warrantyDays}d)`}
            </div>
          )}

          <div className="mt-4">
            <Row label="Serial number" value={product.serialNumber} />
            <Row label="Purchase date" value={formatDate(product.purchaseDate)} />
            <Row label="Purchase price" value={product.purchasePrice ? currency(product.purchasePrice) : null} />
            <Row label="Purchased from" value={product.purchasedFrom} />
            <Row label="Warranty" value={product.warrantyMonths ? `${product.warrantyMonths} months` : null} />
          </div>

          {product.notes && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{product.notes}</div>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Documents ({documents.length})</h2>
          <div className="flex items-center gap-2">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input ref={fileRef} type="file" hidden onChange={handleUpload} accept="image/*,.pdf" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : '+ Upload'}
            </button>
          </div>
        </div>

        {documents.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            No documents yet. Upload invoices, warranty cards, manuals or receipts.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {documents.map((d) => (
              <li key={d._id} className="flex items-center justify-between py-3">
                <a
                  href={docUrl(d)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-sm text-slate-800 hover:text-brand-600"
                >
                  <span className="text-xl">{TYPE_ICON[d.type] || '📎'}</span>
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs capitalize text-slate-400">
                      {d.type} · {formatDate(d.createdAt)}
                    </p>
                  </div>
                </a>
                <button
                  onClick={() => deleteDoc(d._id)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
