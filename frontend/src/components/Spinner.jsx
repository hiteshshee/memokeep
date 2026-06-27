export default function Spinner({ full = false }) {
  const spinner = (
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-100 border-t-gold-500" />
  );
  if (!full) return <div className="flex justify-center py-10">{spinner}</div>;
  return (
    <div className="flex h-screen items-center justify-center bg-ivory-50">{spinner}</div>
  );
}
