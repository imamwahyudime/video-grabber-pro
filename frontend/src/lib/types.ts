export interface FormatInfo {
  format_id: string;
  ext: string;
  quality: string | null;
  resolution: string | null;
  fps: number | null;
  filesize: number | null;
  filesize_approx: number | null;
  vcodec: string | null;
  acodec: string | null;
  abr: number | null;
  vbr: number | null;
  tbr: number | null;
  note: string | null;
  has_video: boolean;
  has_audio: boolean;
}

export interface SubtitleTrack {
  lang: string;
  name: string | null;
  ext: string | null;
}

export interface VideoInfo {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  duration: number | null;
  duration_string: string | null;
  uploader: string | null;
  uploader_url: string | null;
  channel: string | null;
  channel_url: string | null;
  upload_date: string | null;
  view_count: number | null;
  like_count: number | null;
  webpage_url: string;
  extractor: string;
  platform_id: string;
  platform_name: string;
  is_playlist: boolean;
  playlist_count: number | null;
  formats: FormatInfo[];
  subtitles: SubtitleTrack[];
  automatic_captions: SubtitleTrack[];
}

export type QualityPreset =
  | "best"
  | "2160p"
  | "1440p"
  | "1080p"
  | "720p"
  | "480p"
  | "360p"
  | "audio-mp3"
  | "audio-m4a"
  | "audio-opus";

export type Container = "mp4" | "mkv" | "webm" | "mp3" | "m4a" | "opus";

export interface DownloadRequest {
  url: string;
  format_id?: string;
  quality?: QualityPreset;
  container?: Container;
  embed_subs?: boolean;
  subtitle_lang?: string;
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  thumbnail: string | null;
  platform_id: string;
  platform_name: string;
  quality: string | null;
  container: string | null;
  filename: string;
  size_bytes: number | null;
  downloaded_at: number; // epoch ms
}
