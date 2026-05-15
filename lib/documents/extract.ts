import mammoth from "mammoth";
import pdfParse from "pdf-parse";

const supportedTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain"
]);

export function validateFile(file: File, maxBytes: number) {
  if (!supportedTypes.has(file.type)) {
    throw Object.assign(new Error("Only PDF, DOCX, and TXT files are supported"), { status: 400 });
  }

  if (file.size > maxBytes) {
    throw Object.assign(new Error("File is too large"), { status: 400 });
  }
}

export async function extractText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf") {
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }

  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value;
  }

  return buffer.toString("utf8");
}
