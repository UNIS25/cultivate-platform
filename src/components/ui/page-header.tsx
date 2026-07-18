import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="cn-enter relative flex flex-col gap-5 border-b border-[var(--line-strong)] pb-6 sm:flex-row sm:items-end sm:justify-between lg:pb-7">
      <span className="absolute -bottom-px left-0 h-[3px] w-24 bg-[var(--ink)]" />
      <div className="max-w-3xl">
        {eyebrow && <p className="cn-kicker mb-3">{eyebrow}</p>}
        <h1 className="max-w-4xl text-[30px] font-semibold leading-[1.04] text-[var(--ink)] sm:text-[38px]">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
