import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionFromRequest } from "@/lib/auth/session";
import { query } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionFromRequest();
  const analytics = user
    ? (
        await query<{
          documentCount: number;
          readyDocumentCount: number;
          chunkCount: number;
          chatCount: number;
          tokenUsage: number;
        }>(
          `
          SELECT
            (SELECT COUNT(*)::int FROM documents WHERE user_id = $1) AS "documentCount",
            (SELECT COUNT(*)::int FROM documents WHERE user_id = $1 AND status = 'ready') AS "readyDocumentCount",
            (SELECT COUNT(*)::int FROM document_chunks dc JOIN documents d ON d.id = dc.document_id WHERE d.user_id = $1) AS "chunkCount",
            (SELECT COUNT(*)::int FROM chats WHERE user_id = $1) AS "chatCount",
            (SELECT COALESCE(SUM(m.token_count), 0)::int FROM messages m JOIN chats c ON c.id = m.chat_id WHERE c.user_id = $1) AS "tokenUsage"
          `,
          [user.id]
        )
      ).rows[0]
    : null;

  const cards = [
    { label: "Documents", value: analytics?.documentCount ?? 0 },
    { label: "Ready", value: analytics?.readyDocumentCount ?? 0 },
    { label: "Chunks", value: analytics?.chunkCount ?? 0 },
    { label: "Tokens", value: analytics?.tokenUsage ?? 0 }
  ];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-normal">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">Operational snapshot of your document intelligence system.</p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{card.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
