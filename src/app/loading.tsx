export default function Loading() {
  return (
    <div className="animate-pulse space-y-5" aria-label="Loading page">
      <div className="h-7 w-56 rounded bg-[#e1e7e4]" />
      <div className="h-4 w-full max-w-xl rounded bg-[#e1e7e4]" />
      <div className="grid gap-px overflow-hidden rounded-md border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 bg-white" />)}
      </div>
    </div>
  );
}
