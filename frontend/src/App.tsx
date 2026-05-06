import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck } from "lucide-react";
import { Header } from "./components/Header";
import { UrlInput } from "./components/UrlInput";
import { VideoCard } from "./components/VideoCard";
import { FormatSelector, type Selection } from "./components/FormatSelector";
import { DownloadPanel } from "./components/DownloadPanel";
import { HistoryList } from "./components/HistoryList";
import { SupportedPlatforms } from "./components/SupportedPlatforms";
import { ApiError, fetchInfo } from "./lib/api";
import {
  loadHistory,
  loadPrefs,
  removeHistoryEntry,
  savePrefs,
  clearHistory,
} from "./lib/storage";
import type { HistoryEntry, VideoInfo } from "./lib/types";
import { STRINGS, type Lang, type Strings } from "./lib/i18n";
import { applyTheme, watchSystemTheme, type Theme } from "./lib/theme";

const URL_RE = /^https?:\/\//i;

const PLATFORM_DOMAINS: { id: string; name: string; suffixes: string[] }[] = [
  { id: "youtube", name: "YouTube", suffixes: ["youtube.com", "youtu.be", "youtube-nocookie.com"] },
  { id: "instagram", name: "Instagram", suffixes: ["instagram.com", "instagr.am"] },
  { id: "tiktok", name: "TikTok", suffixes: ["tiktok.com"] },
  { id: "facebook", name: "Facebook", suffixes: ["facebook.com", "fb.watch", "fb.com"] },
  { id: "twitter", name: "Twitter / X", suffixes: ["twitter.com", "x.com", "t.co"] },
  { id: "reddit", name: "Reddit", suffixes: ["reddit.com", "redd.it"] },
  { id: "vimeo", name: "Vimeo", suffixes: ["vimeo.com"] },
  { id: "twitch", name: "Twitch", suffixes: ["twitch.tv"] },
  { id: "soundcloud", name: "SoundCloud", suffixes: ["soundcloud.com"] },
  { id: "dailymotion", name: "Dailymotion", suffixes: ["dailymotion.com", "dai.ly"] },
];

function detectPlatform(url: string): { id: string; name: string } | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    for (const p of PLATFORM_DOMAINS) {
      if (p.suffixes.some((s) => host === s || host.endsWith("." + s))) return p;
    }
    return { id: "generic", name: "Other" };
  } catch {
    return null;
  }
}

export default function App() {
  const initialPrefs = useMemo(() => loadPrefs(), []);
  const [lang, setLang] = useState<Lang>(initialPrefs.lang);
  const [theme, setTheme] = useState<Theme>(initialPrefs.theme);
  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [selection, setSelection] = useState<Selection>({
    mode: "video",
    quality: "best",
    container: "mp4",
    formatId: null,
    embedSubs: false,
    subtitleLang: null,
  });

  const t = STRINGS[lang];
  const detected = useMemo(() => (URL_RE.test(url) ? detectPlatform(url) : null), [url]);

  // theme bookkeeping
  useEffect(() => {
    applyTheme(theme);
    return watchSystemTheme(theme, () => applyTheme(theme));
  }, [theme]);

  useEffect(() => {
    savePrefs({ lang, theme });
  }, [lang, theme]);

  const abortRef = useRef<AbortController | null>(null);

  const onFetchInfo = async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const data = await fetchInfo(url.trim(), ac.signal);
      setInfo(data);
      // pick a sensible default container based on extension hints
      const hasMp4 = data.formats.some((f) => f.ext === "mp4");
      const container = hasMp4 ? "mp4" : "mkv";
      setSelection({
        mode: "video",
        quality: "best",
        container,
        formatId: null,
        embedSubs: false,
        subtitleLang: null,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const apiErr = err as ApiError;
      setError(apiErr.detail || apiErr.message || "Failed to fetch info");
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = () => setHistory(loadHistory());
  const onClearHistory = () => {
    clearHistory();
    setHistory([]);
  };
  const onRemove = (id: string) => setHistory(removeHistoryEntry(id));
  const onPickFromHistory = (u: string) => {
    setUrl(u);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header lang={lang} theme={theme} onLangChange={setLang} onThemeChange={setTheme} />

      <main className="app-gradient flex-1">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
          <Hero t={t} />

          <UrlInput
            value={url}
            onChange={setUrl}
            onSubmit={onFetchInfo}
            loading={loading}
            detectedPlatformId={detected?.id ?? null}
            detectedPlatformName={detected?.name ?? null}
            t={t}
          />

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            >
              <strong className="font-semibold">{t.errorTitle}: </strong>
              <span className="break-words">{error}</span>
            </div>
          )}

          {loading && !info && <LoadingPreview t={t} />}

          {info && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]"
            >
              <div className="flex flex-col gap-4">
                <VideoCard info={info} t={t} />
                <FormatSelector
                  info={info}
                  t={t}
                  selection={selection}
                  onChange={setSelection}
                />
              </div>
              <div className="flex flex-col gap-4">
                <DownloadPanel
                  info={info}
                  selection={selection}
                  t={t}
                  onHistoryUpdate={refreshHistory}
                />
                <HistoryList
                  entries={history}
                  onClear={onClearHistory}
                  onRemove={onRemove}
                  onSelect={onPickFromHistory}
                  t={t}
                />
              </div>
            </motion.div>
          )}

          {!info && !loading && history.length > 0 && (
            <HistoryList
              entries={history}
              onClear={onClearHistory}
              onRemove={onRemove}
              onSelect={onPickFromHistory}
              t={t}
            />
          )}

          {!info && !loading && history.length === 0 && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              {t.pasteAnyVideoUrl}
            </p>
          )}

          <SupportedPlatforms t={t} />
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}

function Hero({ t }: { t: Strings }) {
  return (
    <section className="flex flex-col items-center gap-3 text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/70 dark:text-slate-300 dark:ring-slate-700">
        <Sparkles size={12} className="text-brand-500" />
        {t.heroBadge}
      </span>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
        <span className="bg-gradient-to-r from-brand-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">
          {t.heroTitle}
        </span>
      </h1>
      <p className="max-w-2xl text-balance text-base text-slate-600 dark:text-slate-300 sm:text-lg">
        {t.heroSubtitle}
      </p>
    </section>
  );
}

function LoadingPreview({ t }: { t: Strings }) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex gap-4">
        <div className="skeleton h-32 w-56 shrink-0" />
        <div className="flex flex-1 flex-col gap-2 py-1">
          <div className="skeleton h-5 w-2/3" />
          <div className="skeleton h-4 w-1/3" />
          <div className="mt-auto flex gap-2">
            <div className="skeleton h-6 w-16" />
            <div className="skeleton h-6 w-20" />
            <div className="skeleton h-6 w-24" />
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">{t.loadingFormats}</p>
    </div>
  );
}

function Footer({ t }: { t: Strings }) {
  return (
    <footer className="border-t border-slate-200 bg-white/40 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1.5 px-4 sm:px-6">
        <p className="inline-flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-emerald-500" />
          {t.privacyNote}
        </p>
        <p className="opacity-70">{t.poweredBy}</p>
      </div>
    </footer>
  );
}
