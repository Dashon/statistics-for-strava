export default function ActivitiesLoading() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-10 bg-zinc-800 rounded w-64"></div>

        <div className="grid gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="glass rounded-lg p-6 space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-6 bg-zinc-800 rounded w-3/4"></div>
                  <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                </div>
                <div className="h-8 w-8 bg-zinc-800 rounded"></div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-4 bg-zinc-800 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
