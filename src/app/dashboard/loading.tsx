export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-10 bg-zinc-800 rounded w-64"></div>
          <div className="h-10 bg-zinc-800 rounded w-32"></div>
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-lg p-6 space-y-3">
              <div className="h-4 bg-zinc-800 rounded w-24"></div>
              <div className="h-8 bg-zinc-800 rounded w-32"></div>
            </div>
          ))}
        </div>

        {/* Activity list skeleton */}
        <div className="glass rounded-lg p-6 space-y-4">
          <div className="h-6 bg-zinc-800 rounded w-48"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border-b border-zinc-800 last:border-0">
              <div className="h-16 w-16 bg-zinc-800 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-zinc-800 rounded w-3/4"></div>
                <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
