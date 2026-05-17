"use client";

import { marked } from "marked";
import { SendHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Citation = {
  marker: number;
  documentName: string;
  chunkIndex: number;
  quote: string;
  similarity: number;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim() || loading) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: input };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage.content, chatId })
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: data.error ?? "The assistant could not answer." }
      ]);
      return;
    }

    setChatId(data.chatId);
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "assistant", content: data.answer, citations: data.citations }
    ]);
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <section className="mb-4">
        <h2 className="text-2xl font-semibold tracking-normal">RAG Chat</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ask grounded questions across processed documents.</p>
      </section>
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!hasMessages ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <h3 className="text-lg font-semibold">Ask about your team knowledge</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Answers use semantic search over pgvector chunks and include citations from source documents.
                </p>
              </div>
            </div>
          ) : null}
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Searching documents and drafting a grounded answer...
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        </div>
        <form onSubmit={send} className="border-t p-4">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question about uploaded documents..."
              className="min-h-12"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <Button size="icon" disabled={loading || !input.trim()} aria-label="Send message">
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const html = useMemo(() => marked.parse(message.content), [message.content]);

  const uniqueCitations = useMemo(() => {
    if (!message.citations) return [];
    const seen = new Set<string>();
    const list: typeof message.citations = [];
    for (const c of message.citations) {
      if (!seen.has(c.documentName)) {
        seen.add(c.documentName);
        list.push(c);
      }
    }
    return list;
  }, [message.citations]);

  return (
    <div className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-lg px-4 py-3 text-sm leading-6",
          message.role === "user" ? "bg-primary text-white" : "bg-secondary text-secondary-foreground"
        )}
      >
        <div
          className={cn(
            "prose prose-sm max-w-none",
            message.role === "user" ? "prose-invert text-white" : "dark:prose-invert"
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {uniqueCitations.length ? (
          <div className="mt-3 text-xs text-muted-foreground/80 border-t pt-2 border-border/40">
            <span className="font-semibold block mb-1">Sources:</span>
            <div className="flex flex-col gap-1">
              {uniqueCitations.map((citation) => (
                <div key={citation.documentName}>
                  [{citation.marker}] Document: {citation.documentName}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
