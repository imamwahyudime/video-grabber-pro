import { History, Trash2, X, Image as ImageIcon } from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";
import type { HistoryEntry } from "../lib/types";
import type { Strings } from "../lib/i18n";
import { formatBytes } from "../lib/format";

interface HistoryListProps {
  entries: HistoryEntry[];
  onClear: () => void;
  onRemove: (id: string) => void;
  onSelect: (url: string) => void;
  t: Strings;
}

export function HistoryList({ entries, onClear, onRemove, onSelect, t }: HistoryListProps) {
  return (
    <section className="card flex flex-col gap-3 p-5">
      <header className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <History size={16} className="text-slate-500" />
          {t.history}
          {entries.length > 0 && (
            <span className="chip">{entries.length}</span>
          )}
        </h3>
        {entries.length > 0 && (
          <button type="button" className="btn-ghost text-xs" onClick={onClear}>
            <Trash2 size={14} /> {t.clearHistory}
          </button>
        )}
      </header>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.noHistory}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.slice(0, 10).map((e) => (
            <li
              key={e.id}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white/60 p-2 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700"
            >
              <button
                type="button"
                onClick={() => onSelect(e.url)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  {e.thumbnail ? (
                    <img
                      src={e.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-slate-400">
                      <ImageIcon size={16} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={e.title}>
                    {e.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <PlatformIcon id={e.platform_id} size={12} />
                    <span>{e.platform_name}</span>
                    {e.quality && <span>· {e.quality}</span>}
                    {e.container && <span>· {e.container}</span>}
                    {e.size_bytes != null && <span>· {formatBytes(e.size_bytes)}</span>}
                  </div>
                </div>
              </button>
              <button
                type="button"
                aria-label={t.removeEntry}
                className="btn-ghost h-8 w-8 p-0 opacity-0 transition group-hover:opacity-100"
                onClick={() => onRemove(e.id)}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
