import type { Metadata } from "next";
import { DataSourceNotice } from "@/components/ui/data-source-notice";
import { PageHeader } from "@/components/ui/page-header";
import { getNetworkSnapshot } from "@/data";
import { ReportForm } from "@/features/surplus/report-form";

export const metadata: Metadata = { title: "Report surplus" };
export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const data = await getNetworkSnapshot();
  return <><PageHeader eyebrow="Food sharing calculator" title="Report surplus food" description="Create a time-sensitive offer and see its potential social and environmental value before matching." /><DataSourceNotice source={data.source} /><ReportForm donors={data.donors} dataReady={data.source.status === "ready"} /></>;
}
