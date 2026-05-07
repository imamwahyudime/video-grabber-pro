import { ClipboardPaste, Link as LinkIcon, Loader2, Search } from "lucide-react";
import { useRef, useState } from "react";
import { PlatformIcon } from "./PlatformIcon";
import type { Strings } from "../lib/i18n";
import { cn } from "../lib/cn";

interface UrlInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  detectedPlatformId: string | null;
  detectedPlatformName: string | null;
  t: Strings;
}

const URL_RE = /^https?:\/\//i;

export function UrlInput({
  value,
  onChange,
  onSubmit,
  loading,
  detectedPlatformId,
  detectedPlatformName,
  t,
}: UrlInputProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (v: string) => {
    if (localError) setLocalError(null);
    onChange(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!URL_RE.test(value.trim())) {
      setLocalError(t.invalidUrl);
      return;
    }
    onSubmit();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(text.trim());
        ref.current?.focus();
      }
    } catch {
      ref.current?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor="url-input" className="sr-only">
        {t.urlLabel}
      </label>
      <div
        className={cn(
          "card flex flex-col gap-2 p-2 sm:flex-row sm:items-center sm:gap-1.5",
          "ring-2 ring-transparent transition-all focus-within:ring-brand-500/30 focus-within:border-brand-500",
        )}
      >
        <div className="flex flex-1 items-center gap-2 px-2">
          {detectedPlatformId ? (
            <PlatformIcon id={detectedPlatformId} size={18} />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <LinkIcon size={18} aria-hidden />
            </span>
          )}
          <input
            id="url-input"
            ref={ref}
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent px-1 py-2 text-base outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder={t.urlPlaceholder}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            aria-invalid={!!localError}
            aria-describedby={localError ? "url-error" : undefined}
          />
          {detectedPlatformName && (
            <span className="hidden sm:inline-flex chip">
              {t.detected}: {detectedPlatformName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-1">
          <button type="button" className="btn-ghost h-11" onClick={() => { setLocalError(null); void handlePaste(); }} aria-label={t.pasteFromClipboard}>
            <ClipboardPaste size={16} />
            <span className="hidden sm:inline">{t.pasteFromClipboard}</span>
          </button>
          <button type="submit" className="btn-primary h-11 px-5" disabled={loading || !value.trim()}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            <span>{loading ? t.fetching : t.fetchInfo}</span>
          </button>
        </div>
      </div>
      {localError && (
        <p id="url-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {localError}
        </p>
      )}
    </form>
  );
}
