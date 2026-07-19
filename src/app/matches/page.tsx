import type { Metadata } from "next";
import { Info } from "lucide-react";
import { DataSourceNotice } from "@/components/ui/data-source-notice";
import { PageHeader } from "@/components/ui/page-header";
import { getListingMatchGroups, getNetworkSnapshot } from "@/data";
import { MatchesWorkspace } from "@/features/matching/matches-workspace";

export const metadata: Metadata = { title: "Matching recommendations" };
export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const data = await getNetworkSnapshot();
  return <><PageHeader eyebrow="Operational matching" title="Matching recommendations" description="Compare deterministic recipient rankings with a complete, factor-by-factor explanation." actions={<span className="hidden items-center gap-2 border-l-4 border-[var(--blue)] bg-[var(--blue-soft)] px-3 py-2 text-xs font-bold text-[var(--blue)] sm:inline-flex"><Info size={15} /> Rules-based v1 / No AI</span>} /><DataSourceNotice source={data.source} /><MatchesWorkspace groups={getListingMatchGroups(data)} events={data.resourceEvents} dataReady={data.source.status === "ready"} /></>;
}
