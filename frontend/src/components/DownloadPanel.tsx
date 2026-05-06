import { motion } from "framer-motion";
import { CheckCircle2, Download, Loader2, X, AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { Selection } from "./FormatSelector";
import type { VideoInfo } from "../lib/types";
import { downloadVideo, triggerBlobDownload, type DownloadProgress, ApiError } from "../lib/api";
import { appendHistory } from "../lib/storage";
import { formatBytes } from "../lib/format";
import type { Strings } from "../lib/i18n";
import { cn } from "../lib/cn";

interface DownloadPanelProps {
  info: VideoInfo;
  selection: Selection;
  t: Strings;
  onHistoryUpdate: () => void;
}

type Status = "idle" | "running" | "done" | "error";

function selectionKey(s: Selection, url: string): string {
  return `${url}|${s.mode}|${s.quality}|${s.container}|${s.formatId ?? ""}|${s.embedSubs ? 1 : 0}|${s.subtitleLang ?? ""}`;
}

export function DownloadPanel({ info, selection, t, onHistoryUpdate }: DownloadPanelProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<DownloadProgress>({ receivedBytes: 0, totalBytes: null, percent: null });
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState<string>("");
  const [controller, setController] = useState<AbortController | null>(null);

  // React 19 pattern: reset derived state when an external key changes,
  // computed during render rather than via an effect.
  const key = selectionKey(selection, info.webpage_url);
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    if (status === "done" || status === "error") {
      setStatus("idle");
      setProgress({ receivedBytes: 0, totalBytes: null, percent: null });
      setResultBlob(null);
      setError(null);
    }
  }

  const start = async () => {
    setStatus("running");
    setError(null);
    setProgress({ receivedBytes: 0, totalBytes: null, percent: null });
    setResultBlob(null);

    const ac = new AbortController();
    setController(ac);
    try {
      const result = await downloadVideo(
        {
          url: info.webpage_url,
          format_id: selection.mode === "custom" ? selection.formatId ?? undefined : undefined,
          quality: selection.mode !== "custom" ? selection.quality : undefined,
          container: selection.container,
          embed_subs: selection.embedSubs,
          subtitle_lang: selection.subtitleLang ?? undefined,
        },
        setProgress,
        ac.signal,
      );
      setResultBlob(result.blob);
      setResultFilename(result.filename);
      triggerBlobDownload(result.blob, result.filename);
      appendHistory({
        id: `${info.id}-${selection.quality ?? "auto"}-${Date.now()}`,
        url: info.webpage_url,
        title: info.title,
        thumbnail: info.thumbnail,
        platform_id: info.platform_id,
        platform_name: info.platform_name,
        quality: selection.quality,
        container: selection.container,
        filename: result.filename,
        size_bytes: result.size,
        downloaded_at: Date.now(),
      });
      onHistoryUpdate();
      setStatus("done");
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setStatus("idle");
        return;
      }
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.message || "Download failed");
      setStatus("error");
    } finally {
      setController(null);
    }
  };

  const cancel = () => {
    controller?.abort();
  };

  const summary = describeSelection(selection);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex flex-col gap-4 p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.download}
          </span>
          <span className="font-semibold">{summary || t.noFormatPickedYet}</span>
        </div>
        {status === "running" ? (
          <button type="button" className="btn-secondary" onClick={cancel}>
            <X size={14} /> {t.cancel}
          </button>
        ) : status === "done" ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => resultBlob && triggerBlobDownload(resultBlob, resultFilename)}
          >
            <Download size={16} /> {t.saveToDevice}
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={start} disabled={!summary}>
            <Download size={16} /> {t.download}
          </button>
        )}
      </div>

      {status === "running" && <ProgressBar progress={progress} t={t} />}

      {status === "done" && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">{t.downloadComplete}</span>
          <span className="ml-auto text-xs opacity-70">{resultFilename}</span>
        </div>
      )}

      {status === "error" && error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-red-800 dark:bg-red-950/40 dark:text-red-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div className="text-sm">
            <div className="font-medium">{t.errorTitle}</div>
            <div className="mt-1 break-words font-mono text-xs opacity-80">{error}</div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ProgressBar({ progress, t }: { progress: DownloadProgress; t: Strings }) {
  const pct = progress.percent != null ? Math.max(0, Math.min(100, progress.percent)) : null;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 size={14} className="animate-spin text-brand-500" />
        <span>{t.downloading}</span>
        <span className="ml-auto font-mono text-xs text-slate-500 dark:text-slate-400">
          {formatBytes(progress.receivedBytes)}
          {progress.totalBytes ? ` / ${formatBytes(progress.totalBytes)}` : ""}
          {pct != null ? ` · ${pct.toFixed(0)}%` : ""}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all",
            pct == null && "w-1/3 animate-pulse",
          )}
          style={pct != null ? { width: `${pct}%` } : undefined}
        />
      </div>
    </div>
  );
}

function describeSelection(s: Selection): string {
  if (s.mode === "audio") {
    if (s.quality === "audio-mp3") return "MP3 192kbps";
    if (s.quality === "audio-m4a") return "M4A";
    if (s.quality === "audio-opus") return "Opus";
    return s.container.toUpperCase();
  }
  if (s.mode === "custom") {
    return s.formatId ? `Custom: ${s.formatId} → ${s.container.toUpperCase()}` : "";
  }
  return `${s.quality === "best" ? "Best" : s.quality} → ${s.container.toUpperCase()}`;
}
