import { ChevronDown, Music, Subtitles, Sparkles, Video as VideoIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FormatInfo, QualityPreset, Container, VideoInfo } from "../lib/types";
import { formatBytes } from "../lib/format";
import type { Strings } from "../lib/i18n";
import { cn } from "../lib/cn";

const VIDEO_PRESETS: { value: QualityPreset; label: string; badge?: string }[] = [
  { value: "best", label: "Best", badge: "auto" },
  { value: "2160p", label: "2160p", badge: "4K" },
  { value: "1440p", label: "1440p", badge: "2K" },
  { value: "1080p", label: "1080p", badge: "FHD" },
  { value: "720p", label: "720p", badge: "HD" },
  { value: "480p", label: "480p" },
  { value: "360p", label: "360p" },
];

const AUDIO_PRESETS: { value: QualityPreset; label: string; badge?: string }[] = [
  { value: "audio-mp3", label: "MP3", badge: "192k" },
  { value: "audio-m4a", label: "M4A" },
  { value: "audio-opus", label: "Opus" },
];

const VIDEO_CONTAINERS: Container[] = ["mp4", "mkv", "webm"];

interface FormatSelectorProps {
  info: VideoInfo;
  t: Strings;
  selection: Selection;
  onChange: (s: Selection) => void;
}

export interface Selection {
  mode: "video" | "audio" | "custom";
  quality: QualityPreset;
  container: Container;
  formatId: string | null;
  embedSubs: boolean;
  subtitleLang: string | null;
}

export function FormatSelector({ info, selection, onChange, t }: FormatSelectorProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const availableHeights = useMemo(() => {
    const heights = new Set<number>();
    for (const f of info.formats) {
      if (!f.has_video) continue;
      const m = f.resolution?.match(/(\d{3,4})p?$/);
      if (m) heights.add(parseInt(m[1], 10));
      else if (f.note?.match(/(\d{3,4})p/)) heights.add(parseInt(RegExp.$1, 10));
    }
    return heights;
  }, [info.formats]);

  const audioFormats = useMemo(
    () => info.formats.filter((f) => !f.has_video && f.has_audio),
    [info.formats],
  );
  const videoFormats = useMemo(
    () => info.formats.filter((f) => f.has_video),
    [info.formats],
  );

  const allSubs = [
    ...info.subtitles.map((s) => ({ ...s, auto: false })),
    ...info.automatic_captions.map((s) => ({ ...s, auto: true })),
  ];

  const setMode = (mode: Selection["mode"]) => {
    if (mode === "video") {
      onChange({ ...selection, mode, quality: "best", formatId: null, container: "mp4" });
    } else if (mode === "audio") {
      onChange({
        ...selection,
        mode,
        quality: "audio-mp3",
        container: "mp3",
        formatId: null,
        embedSubs: false,
      });
    } else {
      onChange({ ...selection, mode });
    }
  };

  return (
    <div className="card flex flex-col gap-5 p-5">
      <header className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Sparkles size={16} className="text-brand-500" />
          {t.chooseFormat}
        </h3>
        <Tabs
          value={selection.mode}
          onChange={setMode}
          options={[
            { value: "video", label: t.videoQuality, icon: <VideoIcon size={14} /> },
            { value: "audio", label: t.audioOnly, icon: <Music size={14} /> },
          ]}
        />
      </header>

      {selection.mode === "video" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {VIDEO_PRESETS.map((p) => {
              const heightMatch = p.value.match(/(\d+)p/);
              const height = heightMatch ? parseInt(heightMatch[1], 10) : null;
              const unavailable = height != null && availableHeights.size > 0 && !Array.from(availableHeights).some((h) => h >= height);
              return (
                <PresetButton
                  key={p.value}
                  active={selection.quality === p.value}
                  unavailable={unavailable}
                  onClick={() =>
                    onChange({
                      ...selection,
                      quality: p.value,
                      formatId: null,
                    })
                  }
                  label={p.label}
                  badge={p.badge}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.container}
            </span>
            <div className="flex gap-1.5">
              {VIDEO_CONTAINERS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange({ ...selection, container: c })}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium uppercase transition",
                    selection.container === c
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-500/10 dark:text-brand-300"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {allSubs.length > 0 && (
            <div className="flex flex-wrap items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
              <Subtitles size={18} className="mt-0.5 shrink-0 text-slate-500" />
              <div className="flex flex-1 flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    checked={selection.embedSubs}
                    onChange={(e) =>
                      onChange({
                        ...selection,
                        embedSubs: e.target.checked,
                        subtitleLang: selection.subtitleLang ?? allSubs[0]?.lang ?? null,
                      })
                    }
                  />
                  <span>{t.embedSubtitles}</span>
                </label>
                {selection.embedSubs && (
                  <select
                    aria-label={t.pickSubLang}
                    className="input h-9 max-w-xs py-1 text-sm"
                    value={selection.subtitleLang ?? ""}
                    onChange={(e) => onChange({ ...selection, subtitleLang: e.target.value })}
                  >
                    {allSubs.map((s) => (
                      <option key={`${s.auto ? "auto" : "manual"}-${s.lang}`} value={s.lang}>
                        {s.lang} {s.name ? `— ${s.name}` : ""} {s.auto ? "(auto)" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {selection.mode === "audio" && (
        <div className="grid grid-cols-3 gap-2">
          {AUDIO_PRESETS.map((p) => (
            <PresetButton
              key={p.value}
              active={selection.quality === p.value}
              onClick={() =>
                onChange({
                  ...selection,
                  quality: p.value,
                  container:
                    p.value === "audio-mp3"
                      ? "mp3"
                      : p.value === "audio-m4a"
                        ? "m4a"
                        : "opus",
                  formatId: null,
                })
              }
              label={p.label}
              badge={p.badge}
            />
          ))}
        </div>
      )}

      <div className="border-t border-dashed border-slate-200 pt-2 dark:border-slate-800">
        <button
          type="button"
          className="flex w-full items-center justify-between text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          onClick={() => setAdvancedOpen((v) => !v)}
          aria-expanded={advancedOpen}
        >
          <span className="font-medium">{t.customFormats}</span>
          <ChevronDown
            size={16}
            className={cn("transition-transform", advancedOpen && "rotate-180")}
          />
        </button>
        <AnimatePresence initial={false}>
          {advancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <FormatTable
                  formats={[...videoFormats, ...audioFormats]}
                  selectedId={selection.formatId}
                  onSelect={(id) => onChange({ ...selection, formatId: id, mode: "custom" })}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">{t.qualityFallback}</p>
    </div>
  );
}

function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-medium dark:bg-slate-800">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition",
            value === opt.value
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-300",
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PresetButton({
  active,
  unavailable,
  onClick,
  label,
  badge,
}: {
  active: boolean;
  unavailable?: boolean;
  onClick: () => void;
  label: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={unavailable}
      className={cn(
        "group relative flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition",
        active
          ? "border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-200"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
        unavailable && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="text-sm font-semibold">{label}</span>
      {badge && (
        <span className="rounded bg-slate-900/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-500 dark:bg-white/5 dark:text-slate-400">
          {badge}
        </span>
      )}
    </button>
  );
}

function FormatTable({
  formats,
  selectedId,
  onSelect,
}: {
  formats: FormatInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <tr>
          <th className="px-3 py-2">ID</th>
          <th className="px-3 py-2">Type</th>
          <th className="px-3 py-2">Quality</th>
          <th className="px-3 py-2">Codec</th>
          <th className="px-3 py-2">Size</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {formats.map((f) => (
          <tr
            key={f.format_id}
            onClick={() => onSelect(f.format_id)}
            className={cn(
              "cursor-pointer transition",
              selectedId === f.format_id
                ? "bg-brand-50 dark:bg-brand-500/10"
                : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
            )}
          >
            <td className="px-3 py-2 font-mono text-xs">{f.format_id}</td>
            <td className="px-3 py-2">
              {f.has_video && f.has_audio
                ? "AV"
                : f.has_video
                  ? "Video"
                  : "Audio"}
              <span className="ml-1 text-xs uppercase text-slate-400">{f.ext}</span>
            </td>
            <td className="px-3 py-2">{f.resolution || f.quality || "—"}</td>
            <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
              {[f.vcodec, f.acodec].filter(Boolean).join(" / ") || "—"}
            </td>
            <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
              {formatBytes(f.filesize ?? f.filesize_approx)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
