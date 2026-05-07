import type { DownloadRequest, VideoInfo } from "./types";

const DEFAULT_BASE = (import.meta as unknown as { env: Record<string, string | undefined> }).env
  .VITE_API_URL;

function apiBase(): string {
  const fromEnv = DEFAULT_BASE?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    // Same-origin fallback (useful for self-hosting / local dev with proxy)
    return window.location.origin.replace(/\/$/, "");
  }
  return "";
}

export class ApiError extends Error {
  status: number;
  detail?: string;
  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function parseError(resp: Response): Promise<ApiError> {
  let detail: string | undefined;
  let error = resp.statusText;
  try {
    const data = (await resp.json()) as { error?: string; detail?: string };
    if (data?.error) error = data.error;
    if (data?.detail) detail = data.detail;
  } catch {
    /* ignore */
  }
  return new ApiError(error || "request_failed", resp.status, detail);
}

export async function fetchInfo(url: string, signal?: AbortSignal): Promise<VideoInfo> {
  const resp = await fetch(`${apiBase()}/api/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
    signal,
  });
  if (!resp.ok) throw await parseError(resp);
  return (await resp.json()) as VideoInfo;
}

export interface DownloadProgress {
  receivedBytes: number;
  totalBytes: number | null;
  percent: number | null; // 0..100 or null when unknown
}

export interface DownloadResult {
  blob: Blob;
  filename: string;
  contentType: string;
  size: number;
}

/** Download via fetch streaming so we can show progress to the user. */
export async function downloadVideo(
  payload: DownloadRequest,
  onProgress: (p: DownloadProgress) => void,
  signal?: AbortSignal,
): Promise<DownloadResult> {
  const resp = await fetch(`${apiBase()}/api/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!resp.ok) throw await parseError(resp);

  const totalHeader = resp.headers.get("Content-Length");
  const total = totalHeader ? parseInt(totalHeader, 10) : null;
  const filename = parseFilename(resp.headers.get("Content-Disposition"));
  const contentType = resp.headers.get("Content-Type") || "application/octet-stream";

  const reader = resp.body?.getReader();
  if (!reader) {
    const blob = await resp.blob();
    onProgress({ receivedBytes: blob.size, totalBytes: blob.size, percent: 100 });
    return { blob, filename, contentType, size: blob.size };
  }

  const chunks: Uint8Array[] = [];
  let received = 0;
  // Stream the body and emit progress.
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      onProgress({
        receivedBytes: received,
        totalBytes: total,
        percent: total ? Math.min(100, (received / total) * 100) : null,
      });
    }
  }
  const blob = new Blob(chunks as BlobPart[], { type: contentType });
  onProgress({ receivedBytes: blob.size, totalBytes: total ?? blob.size, percent: 100 });
  return { blob, filename, contentType, size: blob.size };
}

export function thumbnailDownloadUrl(thumbnail: string): string {
  return `${apiBase()}/api/thumbnail?url=${encodeURIComponent(thumbnail)}`;
}

function parseFilename(disposition: string | null): string {
  if (!disposition) return "video";
  // Prefer RFC5987 filename* if present (handles UTF-8 properly).
  const star = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/"/g, ""));
    } catch {
      /* fall through */
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(disposition);
  if (plain) return plain[1].trim();
  return "video";
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
