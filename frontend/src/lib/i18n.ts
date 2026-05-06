export type Lang = "id" | "en";

export interface Strings {
  /* hero */
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  /* url input */
  urlPlaceholder: string;
  urlLabel: string;
  pasteFromClipboard: string;
  fetchInfo: string;
  fetching: string;
  invalidUrl: string;
  /* video card */
  duration: string;
  views: string;
  uploaded: string;
  channel: string;
  /* format selector */
  chooseFormat: string;
  videoQuality: string;
  audioOnly: string;
  container: string;
  embedSubtitles: string;
  pickSubLang: string;
  customFormats: string;
  download: string;
  downloading: string;
  cancel: string;
  /* downloads */
  downloadComplete: string;
  saveToDevice: string;
  errorTitle: string;
  /* extras */
  copyUrl: string;
  copied: string;
  downloadThumbnail: string;
  history: string;
  noHistory: string;
  clearHistory: string;
  removeEntry: string;
  /* sections */
  supportedPlatforms: string;
  poweredBy: string;
  privacyNote: string;
  /* presets */
  presetBest: string;
  presetMp3: string;
  presetM4a: string;
  presetOpus: string;
  qualityFallback: string;
  /* filters */
  showAllFormats: string;
  hideAllFormats: string;
  /* misc */
  notAvailable: string;
  bytes: string;
  estimated: string;
  language: string;
  theme: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  pasteAnyVideoUrl: string;
  detected: string;
  noFormatPickedYet: string;
  loadingFormats: string;
}

const id: Strings = {
  heroTitle: "Unduh video dari mana saja, dengan kualitas penuh",
  heroSubtitle:
    "YouTube, Shorts, Instagram, Facebook, TikTok, X, Reddit, dan 1000+ situs lainnya. Pilih kualitas, ambil audio saja, embed subtitle — semua dalam satu klik.",
  heroBadge: "Bebas iklan • Tanpa daftar • Open source",
  urlPlaceholder: "Tempelkan URL video di sini…",
  urlLabel: "URL Video",
  pasteFromClipboard: "Tempel",
  fetchInfo: "Ambil Info",
  fetching: "Mengambil…",
  invalidUrl: "URL tidak valid. Pastikan dimulai dengan http:// atau https://",
  duration: "Durasi",
  views: "Tontonan",
  uploaded: "Diunggah",
  channel: "Kanal",
  chooseFormat: "Pilih Format",
  videoQuality: "Video",
  audioOnly: "Audio saja",
  container: "Container",
  embedSubtitles: "Sematkan subtitle",
  pickSubLang: "Pilih bahasa subtitle",
  customFormats: "Format khusus (lanjutan)",
  download: "Unduh",
  downloading: "Mengunduh…",
  cancel: "Batal",
  downloadComplete: "Selesai diunduh!",
  saveToDevice: "Simpan ke perangkat",
  errorTitle: "Terjadi kesalahan",
  copyUrl: "Salin URL",
  copied: "Tersalin",
  downloadThumbnail: "Unduh thumbnail",
  history: "Riwayat",
  noHistory: "Belum ada riwayat unduhan.",
  clearHistory: "Hapus semua",
  removeEntry: "Hapus",
  supportedPlatforms: "Platform yang didukung",
  poweredBy: "Didukung oleh yt-dlp + ffmpeg",
  privacyNote:
    "Video diproses sementara di server lalu dialirkan langsung ke browser Anda — tidak ada riwayat yang disimpan di sisi server.",
  presetBest: "Kualitas terbaik",
  presetMp3: "MP3 (audio)",
  presetM4a: "M4A (audio)",
  presetOpus: "Opus (audio)",
  qualityFallback: "Akan otomatis turun ke kualitas terbaik yang tersedia",
  showAllFormats: "Tampilkan semua format",
  hideAllFormats: "Sembunyikan format",
  notAvailable: "Tidak tersedia",
  bytes: "byte",
  estimated: "perkiraan",
  language: "Bahasa",
  theme: "Tema",
  themeLight: "Terang",
  themeDark: "Gelap",
  themeSystem: "Sistem",
  pasteAnyVideoUrl: "Tempelkan URL video apapun di atas untuk mulai.",
  detected: "Terdeteksi",
  noFormatPickedYet: "Pilih format untuk mulai mengunduh",
  loadingFormats: "Memuat format yang tersedia…",
};

const en: Strings = {
  heroTitle: "Download videos from anywhere, in full quality",
  heroSubtitle:
    "YouTube, Shorts, Instagram, Facebook, TikTok, X, Reddit and 1000+ more sites. Pick a quality, grab audio only, embed subtitles — all in one click.",
  heroBadge: "Ad-free • No sign-up • Open source",
  urlPlaceholder: "Paste a video URL here…",
  urlLabel: "Video URL",
  pasteFromClipboard: "Paste",
  fetchInfo: "Fetch info",
  fetching: "Fetching…",
  invalidUrl: "Invalid URL. Make sure it starts with http:// or https://",
  duration: "Duration",
  views: "Views",
  uploaded: "Uploaded",
  channel: "Channel",
  chooseFormat: "Choose format",
  videoQuality: "Video",
  audioOnly: "Audio only",
  container: "Container",
  embedSubtitles: "Embed subtitles",
  pickSubLang: "Pick subtitle language",
  customFormats: "Custom formats (advanced)",
  download: "Download",
  downloading: "Downloading…",
  cancel: "Cancel",
  downloadComplete: "Download complete!",
  saveToDevice: "Save to device",
  errorTitle: "Something went wrong",
  copyUrl: "Copy URL",
  copied: "Copied",
  downloadThumbnail: "Download thumbnail",
  history: "History",
  noHistory: "No download history yet.",
  clearHistory: "Clear all",
  removeEntry: "Remove",
  supportedPlatforms: "Supported platforms",
  poweredBy: "Powered by yt-dlp + ffmpeg",
  privacyNote:
    "Videos are processed transiently on the server and streamed directly to your browser — no history is kept on the server.",
  presetBest: "Best quality",
  presetMp3: "MP3 (audio)",
  presetM4a: "M4A (audio)",
  presetOpus: "Opus (audio)",
  qualityFallback: "Falls back to best available if requested quality is missing",
  showAllFormats: "Show all formats",
  hideAllFormats: "Hide formats",
  notAvailable: "Not available",
  bytes: "bytes",
  estimated: "approx.",
  language: "Language",
  theme: "Theme",
  themeLight: "Light",
  themeDark: "Dark",
  themeSystem: "System",
  pasteAnyVideoUrl: "Paste any video URL above to start.",
  detected: "Detected",
  noFormatPickedYet: "Pick a format to begin downloading",
  loadingFormats: "Loading available formats…",
};

export const STRINGS: Record<Lang, Strings> = { id, en };
