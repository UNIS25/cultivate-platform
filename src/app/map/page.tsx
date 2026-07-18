import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DataSourceNotice } from "@/components/ui/data-source-notice";
import { PageHeader } from "@/components/ui/page-header";
import { FoodSharingMap } from "@/features/map/food-sharing-map";
import { getNetworkSnapshot } from "@/data";

export const metadata: Metadata = { title: "Food sharing map" };
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const data = await getNetworkSnapshot();

  return (
    <>
      <PageHeader
        eyebrow="Food sharing map"
        title="Explore the sharing network"
        description="Explore initiatives, donors, recipient organisations and active food offers across the fictional European demonstration network."
        actions={<Link href="/report" className="inline-flex min-h-11 items-center gap-2 rounded-[3px] border border-[var(--ink)] bg-[var(--ink)] px-4 text-sm font-bold text-white shadow-[4px_4px_0_var(--acid)] hover:bg-[var(--green)]"><Plus size={17} /> Report surplus</Link>}
      />
      <DataSourceNotice source={data.source} />
      <FoodSharingMap initiatives={data.initiatives} donors={data.donors} recipients={data.recipients} surplus={data.surplusListings} />
    </>
  );
}
