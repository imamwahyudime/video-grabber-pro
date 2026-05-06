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
import type { Strings } from "../lib/i18n";

type IconComp = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const PLATFORMS: { name: string; Icon: IconComp; gradient: string }[] = [
  { name: "YouTube", Icon: YoutubeIcon, gradient: "from-red-500 to-red-700" },
  { name: "Instagram", Icon: InstagramIcon, gradient: "from-pink-500 via-fuchsia-500 to-amber-500" },
  { name: "TikTok", Icon: TiktokIcon, gradient: "from-slate-900 to-slate-700" },
  { name: "Facebook", Icon: FacebookIcon, gradient: "from-blue-500 to-blue-700" },
  { name: "Twitter / X", Icon: TwitterXIcon, gradient: "from-slate-800 to-slate-950" },
  { name: "Twitch", Icon: TwitchIcon, gradient: "from-purple-500 to-purple-700" },
  { name: "Vimeo", Icon: VimeoIcon, gradient: "from-cyan-500 to-cyan-700" },
  { name: "Reddit", Icon: RedditIcon, gradient: "from-orange-500 to-red-600" },
  { name: "SoundCloud", Icon: SoundCloudIcon, gradient: "from-orange-500 to-amber-600" },
  { name: "Dailymotion", Icon: DailymotionIcon, gradient: "from-sky-500 to-sky-700" },
];

export function SupportedPlatforms({ t }: { t: Strings }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {t.supportedPlatforms}
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {PLATFORMS.map(({ name, Icon, gradient }) => (
          <div key={name} className="card flex items-center gap-2.5 p-2.5">
            <span className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br text-white ${gradient}`}>
              <Icon width={14} height={14} />
            </span>
            <span className="text-sm font-medium">{name}</span>
          </div>
        ))}
        <div className="card flex items-center gap-2.5 p-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white">
            <span className="text-xs font-bold">1k+</span>
          </span>
          <span className="text-sm font-medium">+ more</span>
        </div>
      </div>
    </section>
  );
}
