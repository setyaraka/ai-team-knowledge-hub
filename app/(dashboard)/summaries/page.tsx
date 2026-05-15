import { DocumentsClient } from "@/components/dashboard/documents-client";

export const dynamic = "force-dynamic";

export default function SummariesPage() {
  return <DocumentsClient summariesOnly />;
}
