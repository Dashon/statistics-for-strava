export default function ActivityDetailLoading() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div className="glass rounded-lg p-6 space-y-4">
          <div className="h-8 bg-zinc-800 rounded w-3/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-20"></div>
                <div className="h-6 bg-zinc-800 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-zinc-800 rounded w-24"></div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="glass rounded-lg p-6 space-y-4">
          <div className="h-6 bg-zinc-800 rounded w-48"></div>
          <div className="space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-full"></div>
            <div className="h-4 bg-zinc-800 rounded w-full"></div>
            <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
