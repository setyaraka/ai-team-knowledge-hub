"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileUp, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/utils";

type DocumentItem = {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  status: "processing" | "ready" | "failed";
  summary: string | null;
  keyPoints: string[];
  actionItems: string[];
  errorMessage: string | null;
  createdAt: string;
};

export function DocumentsClient({ summariesOnly = false }: { summariesOnly?: boolean }) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chunkSize, setChunkSize] = useState(1200);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/documents");
    if (response.ok) {
      const data = await response.json();
      setDocuments(data.documents);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 4000);
    return () => window.clearInterval(interval);
  }, [load]);

  const upload = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setError("");
      setUploading(true);
      setProgress(0);

      const form = new FormData();
      form.append("file", file);
      form.append("chunkSize", String(chunkSize));
      form.append("chunkOverlap", String(chunkOverlap));
      form.append("metadata", JSON.stringify({ uploadedFrom: "dashboard" }));

      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/documents/upload");
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 400) setError("Upload failed. Check file type, size, and server logs.");
          resolve();
        };
        xhr.onerror = () => {
          setError("Upload failed.");
          resolve();
        };
        xhr.send(form);
      });

      setUploading(false);
      setProgress(0);
      await load();
    },
    [chunkOverlap, chunkSize, load]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: upload,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"]
    },
    multiple: false
  });

  async function remove(id: string) {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold tracking-normal">{summariesOnly ? "Summaries" : "Documents"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Upload files, tune chunking, and monitor RAG processing.</p>
      </section>

      {!summariesOnly ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                Chunk size
                <Input type="number" value={chunkSize} onChange={(event) => setChunkSize(Number(event.target.value))} />
              </label>
              <label className="space-y-1 text-sm">
                Chunk overlap
                <Input type="number" value={chunkOverlap} onChange={(event) => setChunkOverlap(Number(event.target.value))} />
              </label>
            </div>
            <div
              {...getRootProps()}
              className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 p-6 text-center transition-colors hover:bg-muted"
            >
              <input {...getInputProps()} />
              {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <FileUp className="h-8 w-8 text-primary" />}
              <p className="mt-3 text-sm font-medium">{isDragActive ? "Drop the document here" : "Drag a PDF, DOCX, or TXT file here"}</p>
              <p className="text-xs text-muted-foreground">Upload progress {uploading ? `${progress}%` : "appears during transfer"}</p>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {loading ? <p className="text-sm text-muted-foreground">Loading documents...</p> : null}
        {documents.map((document) => (
          <Card key={document.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{document.filename}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{formatBytes(Number(document.sizeBytes))}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{document.status}</Badge>
                {!summariesOnly ? (
                  <Button variant="ghost" size="icon" onClick={() => remove(document.id)} aria-label="Delete document">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {document.errorMessage ? <p className="text-sm text-destructive">{document.errorMessage}</p> : null}
              {document.summary ? <p className="text-sm leading-6">{document.summary}</p> : null}
              {document.keyPoints?.length ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Key points</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {document.keyPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {document.actionItems?.length ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Action items</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {document.actionItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
