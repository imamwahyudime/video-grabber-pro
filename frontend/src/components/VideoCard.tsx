import { motion } from "framer-motion";
import { Eye, Clock, Calendar, ExternalLink, Image as ImageIcon, Copy, Check, Layers, Radio, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { PlatformIcon } from "./PlatformIcon";
import type { VideoInfo } from "../lib/types";
import { formatDuration, formatNumber, formatUploadDate } from "../lib/format";
import { thumbnailDownloadUrl } from "../lib/api";
import type { Strings } from "../lib/i18n";

interface VideoCardProps {
  info: VideoInfo;
  t: Strings;
}

export function VideoCard({ info, t }: VideoCardProps) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(info.webpage_url);
      setCopied(true);
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="card overflow-hidden"
    >
      <div className="flex flex-col md:flex-row">
        <div
          className={
            "relative shrink-0 bg-slate-100 dark:bg-slate-800 " +
            (info.is_short
              ? "md:w-[180px] aspect-[9/16] mx-auto md:mx-0"
              : "md:w-[44%] md:max-w-md aspect-video")
          }
        >
          {info.thumbnail ? (
            <img
              src={info.thumbnail}
              alt={info.title}
              className={"h-full w-full " + (info.is_short ? "object-cover" : "object-cover")}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-slate-400">
              <ImageIcon size={36} />
            </div>
          )}
          {info.duration_string && (
            <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-0.5 text-xs font-medium text-white">
              {info.duration_string}
            </span>
          )}
          {info.is_playlist && info.playlist_count && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-xs font-medium text-white">
              <Layers size={12} /> {info.playlist_count}
            </span>
          )}
          {info.is_short && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-red-600/90 px-2 py-0.5 text-xs font-semibold text-white shadow">
              <Smartphone size={12} /> {t.shortsLabel}
            </span>
          )}
          {info.is_live && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white shadow">
              <Radio size={12} /> {t.liveLabel}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start gap-3">
            <PlatformIcon id={info.platform_id} />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold leading-snug line-clamp-2 break-words" title={info.title}>
                {info.title}
              </h2>
              {(info.channel || info.uploader) && (
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {info.channel || info.uploader}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs">
            {info.duration != null && (
              <span className="chip">
                <Clock size={12} /> {formatDuration(info.duration)}
              </span>
            )}
            {info.view_count != null && (
              <span className="chip">
                <Eye size={12} /> {formatNumber(info.view_count)}
              </span>
            )}
            {info.upload_date && (
              <span className="chip">
                <Calendar size={12} /> {formatUploadDate(info.upload_date)}
              </span>
            )}
            <span className="chip capitalize">{info.platform_name}</span>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <button type="button" className="btn-secondary" onClick={onCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t.copied : t.copyUrl}
            </button>
            {info.thumbnail && (
              <a
                href={thumbnailDownloadUrl(info.thumbnail)}
                className="btn-secondary"
                target="_blank"
                rel="noreferrer"
              >
                <ImageIcon size={14} />
                {t.downloadThumbnail}
              </a>
            )}
            <a
              href={info.webpage_url}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              <ExternalLink size={14} />
              {info.platform_name}
            </a>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
