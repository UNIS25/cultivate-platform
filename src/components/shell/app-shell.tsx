"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Calculator,
  Command,
  Handshake,
  LayoutDashboard,
  Map,
  Eye,
  Menu,
  Search,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const navItems = [
  { href: "/", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, index: "01" },
  { href: "/map", label: "Network map", shortLabel: "Map", icon: Map, index: "02" },
  { href: "/report", label: "Report surplus", shortLabel: "Report", icon: Calculator, index: "03" },
  { href: "/matches", label: "Matching", shortLabel: "Matches", icon: Handshake, index: "04" },
  { href: "/recommendations", label: "Governance", shortLabel: "Guidance", icon: ShieldCheck, index: "05" },
  { href: "/impact", label: "Impact", icon: BarChart3, index: "06" },
  { href: "/transparency", label: "Transparency", shortLabel: "Public", icon: Eye, index: "07" },
];

function isCurrentPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function Navigation({ pathname, onNavigate, mobile = false }: { pathname: string; onNavigate?: () => void; mobile?: boolean }) {
  return (
    <nav aria-label="Main navigation" className={mobile ? "mt-8" : "hidden h-full items-stretch lg:flex"}>
      {navItems.map(({ href, label, shortLabel, icon: Icon, index }) => {
        const active = isCurrentPath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              mobile
                ? "group flex min-h-14 items-center gap-4 border-b border-white/10 px-1 text-sm font-semibold"
                : "group relative flex min-w-24 items-center justify-center gap-2 px-3 text-[12px] font-semibold transition-colors xl:min-w-28",
              active ? "text-white lg:text-[var(--ink)]" : "text-white/55 hover:text-white lg:text-[var(--muted)] lg:hover:text-[var(--ink)]",
            )}
          >
            {mobile && <span className="font-mono text-[10px] text-white/35">{index}</span>}
            <Icon aria-hidden="true" size={mobile ? 19 : 16} strokeWidth={active ? 2.4 : 1.8} />
            <span>{mobile ? label : (shortLabel ?? label)}</span>
            {mobile && <ArrowRight aria-hidden="true" className="ml-auto text-white/30 transition-transform group-hover:translate-x-1" size={16} />}
            {!mobile && <span className={cn("absolute inset-x-3 bottom-0 h-[3px] transition-transform", active ? "scale-x-100 bg-[var(--green)]" : "scale-x-0 bg-[var(--acid)] group-hover:scale-x-100")} />}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children, dateLabel }: { children: ReactNode; dateLabel: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const supabaseConnected = isSupabaseConfigured();

  const currentItem = navItems.find((item) => isCurrentPath(pathname, item.href));
  const pageLabel = pathname.startsWith("/initiatives/") ? "Initiative profile" : currentItem?.label ?? "Workspace";
  const filteredCommands = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    return query ? navItems.filter((item) => `${item.label} ${item.shortLabel ?? ""}`.toLowerCase().includes(query)) : navItems;
  }, [commandQuery]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setNotificationsOpen(false);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-[800] border-b border-[var(--line)] bg-white/95 backdrop-blur-xl">
        <div className="hidden h-7 items-center bg-[var(--ink)] px-5 text-[9px] font-bold text-white/60 sm:flex lg:px-7">
          <span className="flex items-center gap-2 text-white"><span className="cn-live-dot" /> INDEPENDENT EXPLORATORY PROTOTYPE</span>
          <span className="mx-4 h-3 w-px bg-white/15" />
          <span>FICTIONAL DATA ONLY</span>
          <span className="ml-auto hidden items-center gap-5 md:flex"><span>SUPABASE / {supabaseConnected ? "CONNECTED" : "SETUP REQUIRED"}</span><span>OPENSTREETMAP / ACTIVE</span><span>{dateLabel.toUpperCase()}</span></span>
        </div>
        <div className="mx-auto flex h-16 max-w-[1760px] items-stretch px-4 sm:px-6 lg:px-7">
          <button className="mr-2 grid w-10 place-items-center text-[var(--muted)] hover:text-[var(--ink)] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" title="Open navigation">
            <Menu size={21} />
          </button>
          <Link href="/" aria-label="CULTIVATE Next dashboard" className="flex shrink-0 items-center border-r border-[var(--line)] pr-5 sm:pr-7">
            <Logo />
          </Link>
          <Navigation pathname={pathname} />
          <div className="ml-auto flex items-center gap-1 border-l border-[var(--line)] pl-2 sm:pl-4">
            <button onClick={() => setCommandOpen(true)} className="hidden h-9 min-w-44 items-center gap-2 border border-[var(--line)] bg-[var(--surface-raised)] px-3 text-left text-[11px] font-semibold text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)] xl:flex" aria-label="Search workspace">
              <Search aria-hidden="true" size={15} /> Search workspace
              <span className="ml-auto flex items-center gap-0.5 border-l border-[var(--line)] pl-2 font-mono text-[9px]"><Command size={10} />K</span>
            </button>
            <div className="relative">
              <button onClick={() => setNotificationsOpen((current) => !current)} className="relative grid size-10 place-items-center text-[var(--muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]" aria-label="Notifications" aria-expanded={notificationsOpen} title="Notifications">
                <Bell size={18} />
                <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-[var(--coral)]" />
              </button>
              {notificationsOpen && (
                <div className="cn-panel absolute right-0 top-12 z-40 w-[min(380px,calc(100vw-20px))] shadow-[10px_12px_0_rgb(17_24_20_/_12%)]">
                  <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--ink)] px-4 py-3 text-white"><div className="flex items-center gap-2"><Zap size={14} className="text-[var(--acid)]" /><p className="text-xs font-bold">Demo notifications</p></div><span className="font-mono text-[9px] text-white/55">03 UNREAD</span></div>
                  <div className="divide-y divide-[var(--line)]">
                    <Link href="/matches" onClick={() => setNotificationsOpen(false)} className="cn-row-action block px-4 py-4"><p className="text-xs font-bold">Four high-confidence matches are ready</p><p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">Review recipient capacity and collection windows.</p></Link>
                    <Link href="/map" onClick={() => setNotificationsOpen(false)} className="cn-row-action block px-4 py-4"><p className="text-xs font-bold">Three offers collect today</p><p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">Open the live map to coordinate nearby activity.</p></Link>
                    <Link href="/recommendations" onClick={() => setNotificationsOpen(false)} className="cn-row-action block px-4 py-4"><p className="text-xs font-bold">Governance review is due</p><p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">Four initiatives need a data check.</p></Link>
                  </div>
                </div>
              )}
            </div>
            <div className="ml-1 flex items-center gap-2 border-l border-[var(--line)] pl-3">
              <span className="grid size-8 place-items-center bg-[var(--blue)] text-[11px] font-bold text-white">AV</span>
              <span className="hidden text-[11px] font-bold text-[var(--ink)] 2xl:block">Demo coordinator</span>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[1000] lg:hidden">
          <button className="absolute inset-0 bg-[var(--ink)]/55 backdrop-blur-sm" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-[min(88vw,360px)] flex-col bg-[var(--ink)] px-5 py-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <Logo inverse />
              <button className="grid size-10 place-items-center text-white/65 hover:bg-white/10 hover:text-white" aria-label="Close navigation" onClick={() => setMobileOpen(false)} title="Close navigation"><X size={20} /></button>
            </div>
            <Navigation pathname={pathname} onNavigate={() => setMobileOpen(false)} mobile />
            <div className="mt-auto border-t border-white/10 pt-5 text-[10px] text-white/45"><span className="flex items-center gap-2"><span className="cn-live-dot" /> Demonstration workspace online</span></div>
          </aside>
        </div>
      )}

      {commandOpen && (
        <div className="fixed inset-0 z-[1200] flex items-start justify-center bg-[var(--ink)]/60 px-4 pt-[12vh] backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setCommandOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-label="Search workspace" className="cn-panel w-full max-w-xl shadow-[14px_16px_0_rgb(17_24_20_/_18%)]">
            <label className="flex h-14 items-center gap-3 border-b border-[var(--line)] px-4"><Search aria-hidden="true" className="text-[var(--green)]" size={19} /><span className="sr-only">Search workspace</span><input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Jump to a workspace…" className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-[var(--muted)]" /><button onClick={() => setCommandOpen(false)} className="grid size-8 place-items-center text-[var(--muted)] hover:bg-[var(--surface-subtle)]" aria-label="Close search" title="Close search"><X size={17} /></button></label>
            <div className="p-2">
              <p className="px-3 py-2 font-mono text-[9px] font-bold text-[var(--muted)]">WORKSPACES</p>
              {filteredCommands.map(({ href, label, icon: Icon, index }) => <Link key={href} href={href} onClick={() => setCommandOpen(false)} className="group flex min-h-12 items-center gap-3 px-3 text-sm font-semibold hover:bg-[var(--surface-subtle)]"><span className="font-mono text-[9px] text-[var(--muted)]">{index}</span><Icon size={17} className="text-[var(--green)]" /><span>{label}</span><ArrowRight size={15} className="ml-auto text-[var(--muted)] transition-transform group-hover:translate-x-1" /></Link>)}
              {filteredCommands.length === 0 && <p className="px-3 py-8 text-center text-sm text-[var(--muted)]">No workspace matches that search.</p>}
            </div>
            <footer className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--surface-raised)] px-4 py-2 font-mono text-[9px] text-[var(--muted)]"><span>ENTER TO OPEN</span><span>ESC TO CLOSE</span></footer>
          </section>
        </div>
      )}

      <main className="mx-auto min-h-[calc(100vh-92px)] max-w-[1760px] px-4 py-6 pb-24 sm:px-6 lg:px-7 lg:py-8 lg:pb-10">
        <div className="mb-4 flex items-center gap-2 font-mono text-[9px] font-bold text-[var(--muted)] lg:hidden"><span>{currentItem?.index ?? "--"}</span><span className="h-px w-5 bg-[var(--line-strong)]" /><span>{pageLabel.toUpperCase()}</span></div>
        {children}
      </main>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-[900] grid grid-cols-7 border-t border-[var(--line)] bg-white/96 px-1 pb-[max(5px,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_28px_rgb(17_24_20_/_10%)] backdrop-blur-xl lg:hidden">
        {navItems.map(({ href, label, shortLabel, icon: Icon }) => {
          const active = isCurrentPath(pathname, href);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("relative flex min-w-0 flex-col items-center gap-1 py-1.5 text-[9px] font-bold", active ? "text-[var(--ink)]" : "text-[var(--muted)]")}><Icon aria-hidden="true" size={18} strokeWidth={active ? 2.5 : 1.8} /><span className="max-w-full truncate">{shortLabel ?? label}</span>{active && <span className="absolute -top-1.5 h-[3px] w-7 bg-[var(--acid)] shadow-[0_0_0_1px_var(--green)]" />}</Link>;
        })}
      </nav>
    </div>
  );
}
