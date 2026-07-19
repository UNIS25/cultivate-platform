import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DataSourceNotice } from "@/components/ui/data-source-notice";
import { PageHeader } from "@/components/ui/page-header";
import { getNetworkSnapshot } from "@/data";
import { RoleDashboard } from "@/features/dashboard/role-dashboard";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getNetworkSnapshot();
  return (
    <>
      <PageHeader eyebrow={`Live operations / ${formatDate(new Date())}`} title="Good morning, Demo coordinator" description="Track today’s surplus, coordinate matches and monitor the network’s shared impact." actions={<Link href="/report" className="inline-flex min-h-11 items-center gap-2 rounded-[3px] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-bold text-white shadow-[4px_4px_0_var(--acid)] hover:bg-[var(--green)]"><Plus size={17} /> Report surplus</Link>} />
      <DataSourceNotice source={data.source} />
      <RoleDashboard data={data} />
    </>
  );
}
