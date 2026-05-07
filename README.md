# Video Grabber Pro

A beautiful, fast video downloader for the modern web. Paste a link from
**YouTube, YouTube Shorts, Instagram, Facebook, TikTok, Twitter / X, Reddit,
Vimeo, Twitch, SoundCloud, Dailymotion** and 1000+ other sites — choose your
quality (up to 4K), grab audio-only as MP3/M4A/Opus, embed subtitles, or
download the thumbnail. No sign-up, no ads.

> 🇮🇩  Aplikasi web modern untuk mengunduh video dari YouTube, Instagram,
> TikTok, Facebook, dan ratusan platform lainnya. Pilih kualitas, ambil audio
> saja, sematkan subtitle — semua dalam satu klik. UI bilingual ID / EN.

## Highlights

- 🎯 **One-paste-and-go** flow — paste URL, see preview, click Download.
- 📺 **Up to 4K** quality presets (Best / 2160p / 1440p / 1080p / 720p / 480p / 360p) plus per-format selector for power users.
- 🎵 **Audio-only** modes: MP3 (192 kbps), M4A, Opus.
- 📝 **Embed subtitles** in any available language (manual or auto).
- 🖼 **Thumbnail download** in one click (proxied to bypass hotlinking).
- 🌗 **Light / Dark / System** theme.
- 🌐 **Bilingual** UI: Bahasa Indonesia + English.
- 🧭 **Auto platform detection** with branded icons.
- 📜 **Local download history** (kept only in your browser, never on the server).
- ⚡ **Streaming progress bar** powered by `fetch` + `ReadableStream`.
- 🔐 **Stateless server** — videos are processed in a temp dir and streamed straight to your browser, then wiped.

## Tech stack

| Layer    | Tech                                                                  |
|----------|-----------------------------------------------------------------------|
| Frontend | React 19 + TypeScript + Vite + TailwindCSS + framer-motion + lucide-react |
| Backend  | Python 3.12 + FastAPI + yt-dlp + ffmpeg                               |
| Deploy   | Fly.io (backend Docker) · Static hosting / devinapps.com (frontend)   |

## Quick start (local)

```bash
# 1. Backend
cd backend
uv sync                        # or: python -m venv .venv && pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000

# 2. Frontend (in another terminal)
cd frontend
pnpm install
echo 'VITE_API_URL=http://127.0.0.1:8000' > .env.local
pnpm dev
```

Open http://localhost:5173.

> **Note:** ffmpeg must be on `PATH` for high-quality video merging and audio
> extraction. The Dockerfile installs it; on Ubuntu/Debian: `sudo apt install ffmpeg`.

## Deploy

### Backend → Fly.io

```bash
cd backend
fly launch --copy-config --no-deploy   # generates fly.toml
fly deploy
```

The provided `Dockerfile` installs ffmpeg, runs uvicorn, and exposes a
`/api/health` healthcheck.

### Frontend → any static host

```bash
cd frontend
echo 'VITE_API_URL=https://YOUR-BACKEND.fly.dev' > .env.production
pnpm build
# upload `dist/` to your static host of choice (Vercel, Netlify, devinapps.com, S3 + CloudFront, etc.)
```

## API

See [`backend/README.md`](backend/README.md) for endpoint details.

## Legal

This tool is for personal use of content you have the right to download
(your own uploads, public-domain works, content you own a license to, etc.).
**You** are responsible for obeying the terms of service of each platform.

## License

[MIT](./LICENSE)
