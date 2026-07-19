export default function TransparencyLoading() {
  return <div role="status" className="cn-panel min-h-96 animate-pulse p-6"><span className="sr-only">Loading public transparency statistics</span><div className="h-4 w-36 bg-[var(--line)]" /><div className="mt-5 h-10 w-2/3 bg-[var(--line)]" /><div className="mt-8 grid gap-3 sm:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-36 bg-[var(--surface-subtle)]" />)}</div></div>;
}
