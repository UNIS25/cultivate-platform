import type { Metadata } from "next";
import { DataSourceNotice } from "@/components/ui/data-source-notice";
import { PageHeader } from "@/components/ui/page-header";
import { getNetworkSnapshot } from "@/data";
import { calculateImpactReport } from "@/features/impact/calculations";
import { ImpactDashboard } from "@/features/impact/impact-dashboard";

export const metadata: Metadata = { title: "Impact dashboard" };
export const dynamic = "force-dynamic";

export default async function ImpactPage() {
  const data = await getNetworkSnapshot();
  const report = calculateImpactReport(data.surplusListings, data.recipients);

  return (
    <>
      <PageHeader
        eyebrow="Food sharing calculator"
        title="Impact dashboard"
        description="Review completed demonstration collections, direct operational totals, and transparent estimates based on published assumptions."
      />
      <DataSourceNotice source={data.source} />
      <ImpactDashboard report={report} />
    </>
  );
}
