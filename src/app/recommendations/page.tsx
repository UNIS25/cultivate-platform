import type { Metadata } from "next";
import { DataSourceNotice } from "@/components/ui/data-source-notice";
import { PageHeader } from "@/components/ui/page-header";
import { getRecommendationResources } from "@/data";
import { RecommendationsWorkspace } from "@/features/recommendations/recommendations-workspace";

export const metadata: Metadata = { title: "Governance and engagement" };
export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const resources = await getRecommendationResources();
  return <><PageHeader eyebrow="Good governance & citizen engagement" title="Strengthen how the network works" description="Turn transparent maturity checks into practical governance actions and inclusive engagement resources." /><DataSourceNotice source={resources.source} /><RecommendationsWorkspace governanceActions={resources.governance} resources={resources.engagement} /></>;
}
