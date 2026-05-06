import { Globe, Film, type LucideIcon } from "lucide-react";
import {
  YoutubeIcon,
  InstagramIcon,
  TiktokIcon,
  FacebookIcon,
  TwitterXIcon,
  TwitchIcon,
  RedditIcon,
  VimeoIcon,
  SoundCloudIcon,
  DailymotionIcon,
} from "./BrandIcons";
import type { ComponentType, SVGProps } from "react";

type IconComp = ComponentType<SVGProps<SVGSVGElement> & { size?: number }> | LucideIcon;

const ICON: Record<string, IconComp> = {
  youtube: YoutubeIcon,
  instagram: InstagramIcon,
  tiktok: TiktokIcon,
  facebook: FacebookIcon,
  twitter: TwitterXIcon,
  twitch: TwitchIcon,
  reddit: RedditIcon,
  vimeo: VimeoIcon,
  soundcloud: SoundCloudIcon,
  dailymotion: DailymotionIcon,
  generic: Globe,
};

const COLOR: Record<string, string> = {
  youtube: "text-red-600 bg-red-50 dark:bg-red-950/40",
  instagram: "text-pink-600 bg-pink-50 dark:bg-pink-950/40",
  facebook: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
  twitter: "text-slate-900 bg-slate-50 dark:text-white dark:bg-slate-800",
  twitch: "text-purple-600 bg-purple-50 dark:bg-purple-950/40",
  tiktok: "text-slate-900 bg-slate-50 dark:text-white dark:bg-slate-800",
  reddit: "text-orange-600 bg-orange-50 dark:bg-orange-950/40",
  vimeo: "text-cyan-700 bg-cyan-50 dark:bg-cyan-950/40",
  soundcloud: "text-orange-500 bg-orange-50 dark:bg-orange-950/40",
  dailymotion: "text-sky-600 bg-sky-50 dark:bg-sky-950/40",
  generic: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300",
};

void Film; // keep import slot for tree-shaking visibility (unused now)

export function PlatformIcon({ id, size = 18 }: { id: string; size?: number }) {
  const Icon = ICON[id] ?? ICON.generic;
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${COLOR[id] ?? COLOR.generic}`}
    >
      <Icon width={size} height={size} aria-hidden />
    </span>
  );
}
