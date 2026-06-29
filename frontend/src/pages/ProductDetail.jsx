import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Package, ReceiptText, ShieldCheck, BookOpen, Receipt, Image as ImageIcon, Paperclip, Upload,
} from 'lucide-react';
import api from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { toast } from '../components/Toast.jsx';
import { currency, formatDate, daysUntil, DOC_TYPES } from '../utils/format.js';

const TYPE_ICON = {
  invoice: ReceiptText, warranty: ShieldCheck, manual: BookOpen, receipt: Receipt, image: ImageIcon, other: Paperclip,
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
      toast('Document uploaded');
    } catch (err) {
      toast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const deleteDoc = async (docId) => {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/documents/${docId}`);
    setDocuments((d) => d.filter((x) => x._id !== docId));
    toast('Document removed');
  };

  const deleteProduct = async () => {
    if (!confirm('Delete this product and all its documents?')) return;
    await api.delete(`/products/${id}`);
    toast('Product deleted');
    navigate('/products');
  };

  if (error) return <p className="text-red-600">{error}</p>;
  if (!product) return <Spinner />;

  const warrantyDays = daysUntil(product.warrantyExpiry);
  const docUrl = (d) => (d.storage === 'local' ? d.url : d.url);

  // How much of the warranty period has elapsed (0–100%).
  const warrantyPct = (() => {
    if (!product.purchaseDate || !product.warrantyExpiry) return 0;
    const start = new Date(product.purchaseDate).getTime();
    const end = new Date(product.warrantyExpiry).getTime();
    if (end <= start) return 0;
    return ((Date.now() - start) / (end - start)) * 100;
  })();
  const warrantyTone = warrantyDays < 0 ? 'red' : warrantyDays <= 30 ? 'amber' : 'green';

  const Row = ({ label, value }) =>
    value ? (
      <div className="flex justify-between border-b border-line/70 py-2.5 text-sm">
        <span className="text-ink-500">{label}</span>
        <span className="font-medium text-ink-800">{value}</span>
      </div>
    ) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/products" className="link-gold text-sm">
          ← All products
        </Link>
        <div className="flex gap-2">
          <Link to={`/products/${id}/edit`} className="btn-ghost px-4 py-2">
            Edit
          </Link>
          <button onClick={deleteProduct} className="btn-danger px-4 py-2">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Image / cover */}
        <div className="md:col-span-1">
          <div className="flex h-48 items-center justify-center overflow-hidden rounded-xl border border-line bg-ivory-100 text-ink-500">
            {product.coverImage ? (
              <img src={product.coverImage} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Package size={56} strokeWidth={1.25} />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="md:col-span-2">
          <span className="badge">{product.category}</span>
          <h1 className="mt-3 text-3xl font-bold text-ink-900">{product.name}</h1>
          <p className="mt-1 text-ink-500">{product.brand} {product.model}</p>

          {product.warrantyExpiry && (
            <div
              className={`mt-4 inline-block rounded-lg border px-3 py-1.5 text-sm font-medium ${
                warrantyDays < 0
                  ? 'border-line bg-ivory-100 text-ink-500'
                  : warrantyDays <= 30
                  ? 'border-gold-200 bg-gold-50 text-gold-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {warrantyDays < 0
                ? `Warranty expired ${formatDate(product.warrantyExpiry)}`
                : `Warranty valid until ${formatDate(product.warrantyExpiry)} (${warrantyDays}d)`}
            </div>
          )}

          {product.warrantyExpiry && product.purchaseDate && (
            <div className="mt-4 max-w-xs">
              <div className="mb-1.5 flex items-center justify-between text-xs text-ink-500">
                <span>Warranty used</span>
                <span>{warrantyDays < 0 ? 'Expired' : `${warrantyDays} days left`}</span>
              </div>
              <ProgressBar value={warrantyPct} tone={warrantyTone} />
            </div>
          )}

          <div className="mt-5">
            <Row label="Serial number" value={product.serialNumber} />
            <Row label="Purchase date" value={formatDate(product.purchaseDate)} />
            <Row label="Purchase price" value={product.purchasePrice ? currency(product.purchasePrice) : null} />
            <Row label="Purchased from" value={product.purchasedFrom} />
            <Row label="Warranty" value={product.warrantyMonths ? `${product.warrantyMonths} months` : null} />
          </div>

          {product.notes && (
            <div className="mt-5 rounded-lg border border-line bg-ivory-100/60 p-4 text-sm text-ink-700">
              {product.notes}
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink-900">Documents ({documents.length})</h2>
          <div className="flex items-center gap-2">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="input w-auto py-2 text-sm capitalize"
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
              className="btn-gold px-4 py-2"
            >
              {uploading ? (
                'Uploading…'
              ) : (
                <>
                  <Upload size={15} strokeWidth={2} /> Upload
                </>
              )}
            </button>
          </div>
        </div>

        {documents.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-400">
            No documents yet. Upload invoices, warranty cards, manuals or receipts.
          </p>
        ) : (
          <ul className="divide-y divide-line/70">
            {documents.map((d) => {
              const Icon = TYPE_ICON[d.type] || Paperclip;
              return (
                <li key={d._id} className="flex items-center justify-between py-3">
                  <a
                    href={docUrl(d)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 text-sm text-ink-800 transition hover:text-gold-700"
                  >
                    <span className="icon-tile flex h-10 w-10 items-center justify-center">
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <div>
                      <p className="font-medium">{d.title}</p>
                      <p className="text-xs capitalize text-ink-400">
                        {d.type} · {formatDate(d.createdAt)}
                      </p>
                    </div>
                  </a>
                  <button onClick={() => deleteDoc(d._id)} className="text-sm font-medium text-red-500 hover:underline">
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
