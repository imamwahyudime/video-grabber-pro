# Video Grabber Pro – Backend

FastAPI + yt-dlp service that powers Video Grabber Pro.

## Endpoints

| Method | Path             | Purpose                                                     |
|-------:|------------------|-------------------------------------------------------------|
| GET    | `/api/health`    | Service / ffmpeg / yt-dlp health                            |
| GET    | `/api/platforms` | List of officially-recognised platforms (UI hint)           |
| GET    | `/api/detect`    | Detect platform from a URL (`?url=...`)                     |
| POST   | `/api/info`      | Get metadata + available formats for a video URL            |
| POST   | `/api/download`  | Stream the final downloaded file back to the client         |
| GET    | `/api/thumbnail` | Proxy + force-download a thumbnail image                    |

`POST /api/info` body:

```json
{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
```

`POST /api/download` body:

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "quality": "1080p",
  "container": "mp4",
  "embed_subs": false
}
```

`quality` presets: `best`, `2160p`, `1440p`, `1080p`, `720p`, `480p`, `360p`,
`audio-mp3`, `audio-m4a`, `audio-opus`. Or pass an explicit `format_id` from
`/api/info` to bypass presets.

## Local development

```bash
uv sync           # or: pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Requires `ffmpeg` on `PATH` for high-quality video merging and audio extraction.

## Deploy

The repo's `Dockerfile` (root) installs ffmpeg + yt-dlp and runs uvicorn.
