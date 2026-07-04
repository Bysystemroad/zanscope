export function WorkspaceLoading({ title = "Loading your workspace", steps = [] }: { title?: string; steps?: string[] }) {
  const displaySteps = steps.length > 0 ? steps : ["Preparing workspace", "Loading saved data", "Rendering your dashboard"];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-2xl p-6">
        <div className="mb-5 text-lg font-semibold text-white">{title}</div>
        <div className="grid gap-3 md:grid-cols-3">
          {displaySteps.map((step, index) => (
            <div key={step} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full animate-pulse rounded-full bg-white/80" style={{ width: `${50 + index * 18}%` }} />
              </div>
              <div className="text-sm font-medium text-[#d8e0e8]">{step}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
