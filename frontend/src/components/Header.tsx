import { Languages, Moon, Sun, Monitor } from "lucide-react";
import type { Lang } from "../lib/i18n";
import type { Theme } from "../lib/theme";
import { cn } from "../lib/cn";

interface HeaderProps {
  lang: Lang;
  theme: Theme;
  onLangChange: (l: Lang) => void;
  onThemeChange: (t: Theme) => void;
}

export function Header({ lang, theme, onLangChange, onThemeChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 shadow-lg shadow-brand-500/30">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none">
              <path d="M12 4v12m0 0l-5-5m5 5l5-5M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-bold text-lg tracking-tight">
            Video Grabber <span className="text-brand-600 dark:text-brand-400">Pro</span>
          </span>
        </a>

        <div className="flex items-center gap-1">
          <Segmented
            ariaLabel="Language"
            value={lang}
            onChange={(v) => onLangChange(v as Lang)}
            options={[
              { value: "id", label: "ID" },
              { value: "en", label: "EN" },
            ]}
            icon={<Languages size={14} />}
          />
          <Segmented
            ariaLabel="Theme"
            value={theme}
            onChange={(v) => onThemeChange(v as Theme)}
            options={[
              { value: "light", icon: <Sun size={14} /> },
              { value: "dark", icon: <Moon size={14} /> },
              { value: "system", icon: <Monitor size={14} /> },
            ]}
          />
        </div>
      </div>
    </header>
  );
}

interface SegmentedProps {
  ariaLabel: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label?: string; icon?: React.ReactNode }[];
  icon?: React.ReactNode;
}

function Segmented({ ariaLabel, value, onChange, options, icon }: SegmentedProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-0.5 text-xs dark:border-slate-800 dark:bg-slate-900"
    >
      {icon && <span className="px-1.5 text-slate-500 dark:text-slate-400">{icon}</span>}
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex h-7 items-center justify-center gap-1 rounded-lg px-2 font-medium transition",
            value === opt.value
              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
          )}
        >
          {opt.icon}
          {opt.label && <span>{opt.label}</span>}
        </button>
      ))}
    </div>
  );
}
