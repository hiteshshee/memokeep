import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-8xl font-bold gradient-text">404</p>
      <div className="my-5 rule-gold mx-auto" />
      <h1 className="text-3xl font-bold text-ink-900">Page not found</h1>
      <p className="mt-2 text-ink-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to="/" className="btn-primary mt-7">
        Return to Dashboard
      </Link>
    </div>
  );
}
