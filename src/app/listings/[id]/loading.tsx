export default function ListingLoading() {
  return <div className="cn-panel min-h-72 animate-pulse p-6" role="status"><span className="sr-only">Loading resource event</span><div className="h-3 w-32 bg-[var(--line)]" /><div className="mt-5 h-9 w-2/3 bg-[var(--line)]" /><div className="mt-8 grid gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 bg-[var(--surface-subtle)]" />)}</div></div>;
}
