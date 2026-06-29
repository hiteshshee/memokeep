// Reusable shimmer skeletons for polished loading states.

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

// Grid of product-style cards (image + text).
export function ProductsSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden p-0">
          <Skeleton className="h-40 w-full rounded-none" />
          <div className="space-y-2.5 p-4">
            <Skeleton className="h-3.5 w-16 rounded-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Grid of simple cards (vault / subscriptions).
export function CardsSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// Full dashboard skeleton.
export function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-3 w-60" />
      </div>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card flex items-center justify-between p-5">
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-24" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-56 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
