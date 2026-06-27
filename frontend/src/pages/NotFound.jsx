import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-center">
      <div className="text-6xl">🤷</div>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">404 — Page not found</h1>
      <p className="mt-2 text-slate-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
