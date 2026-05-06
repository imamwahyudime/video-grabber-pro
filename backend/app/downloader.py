"""Wrapper around yt-dlp for fetching info and downloading videos."""

from __future__ import annotations

import logging
import re
import shutil
import tempfile
import threading
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yt_dlp

from .platforms import detect_platform
from .schemas import FormatInfo, SubtitleTrack, VideoInfo

logger = logging.getLogger(__name__)

# Quality presets translate to yt-dlp format selectors. yt-dlp will pick the
# best matching pre-merged format if available, or merge separate streams via
# ffmpeg. The "/best" fallback ensures something is always returned even on
# platforms that don't offer adaptive streams (TikTok, IG, etc.).
QUALITY_PRESETS: dict[str, str] = {
    "best": "bv*+ba/b",
    "2160p": "bv*[height<=2160]+ba/b[height<=2160]/bv*+ba/b",
    "1440p": "bv*[height<=1440]+ba/b[height<=1440]/bv*+ba/b",
    "1080p": "bv*[height<=1080]+ba/b[height<=1080]/bv*+ba/b",
    "720p": "bv*[height<=720]+ba/b[height<=720]/bv*+ba/b",
    "480p": "bv*[height<=480]+ba/b[height<=480]/bv*+ba/b",
    "360p": "bv*[height<=360]+ba/b[height<=360]/bv*+ba/b",
    "audio-mp3": "ba/b",
    "audio-m4a": "ba[ext=m4a]/ba/b",
    "audio-opus": "ba[ext=webm]/ba/b",
}

AUDIO_PRESETS = {"audio-mp3", "audio-m4a", "audio-opus"}

VALID_CONTAINERS = {"mp4", "mkv", "webm", "mp3", "m4a", "opus"}

_SAFE_FILENAME_RE = re.compile(r"[^A-Za-z0-9._\- ()\[\]]+")


def safe_filename(name: str, max_len: int = 80) -> str:
    cleaned = _SAFE_FILENAME_RE.sub("_", name).strip(" ._-")
    if not cleaned:
        cleaned = "video"
    return cleaned[:max_len]


def _base_opts() -> dict[str, Any]:
    return {
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "skip_download": True,
        "extract_flat": False,
        "noplaylist": True,
        "socket_timeout": 30,
        "retries": 3,
        "fragment_retries": 3,
    }


def _format_to_schema(f: dict[str, Any]) -> FormatInfo:
    vcodec = f.get("vcodec") or "none"
    acodec = f.get("acodec") or "none"
    has_video = vcodec != "none"
    has_audio = acodec != "none"
    width = f.get("width")
    height = f.get("height")
    resolution = f.get("resolution")
    if not resolution and width and height:
        resolution = f"{width}x{height}"
    elif not resolution and height:
        resolution = f"{height}p"
    quality_label: str | None = None
    if has_video and height:
        quality_label = f"{height}p"
    elif has_audio and not has_video:
        abr = f.get("abr")
        if abr:
            quality_label = f"{int(abr)}kbps"
        else:
            quality_label = "audio"
    return FormatInfo(
        format_id=str(f.get("format_id") or ""),
        ext=str(f.get("ext") or ""),
        quality=quality_label,
        resolution=resolution,
        fps=f.get("fps"),
        filesize=f.get("filesize"),
        filesize_approx=f.get("filesize_approx"),
        vcodec=vcodec if has_video else None,
        acodec=acodec if has_audio else None,
        abr=f.get("abr"),
        vbr=f.get("vbr"),
        tbr=f.get("tbr"),
        note=f.get("format_note"),
        has_video=has_video,
        has_audio=has_audio,
    )


def _subs_to_schema(subs: dict[str, list[dict[str, Any]]] | None) -> list[SubtitleTrack]:
    out: list[SubtitleTrack] = []
    if not subs:
        return out
    for lang, tracks in subs.items():
        ext = None
        name = None
        if tracks:
            ext = tracks[0].get("ext")
            name = tracks[0].get("name")
        out.append(SubtitleTrack(lang=lang, name=name, ext=ext))
    return out


def fetch_info(url: str) -> VideoInfo:
    """Fetch metadata + available formats for a URL.

    Raises yt_dlp.utils.DownloadError on extraction failures.
    """
    opts = _base_opts()
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
    if info is None:
        raise RuntimeError("No info returned for URL")

    is_playlist = info.get("_type") == "playlist" or "entries" in info
    if is_playlist and info.get("entries"):
        # Use the first entry as the representative item; surface playlist size.
        first = next((e for e in info["entries"] if e), None)
        if first is None:
            raise RuntimeError("Empty playlist")
        playlist_count = info.get("playlist_count") or sum(1 for _ in info["entries"])
        info_for_meta = first
    else:
        info_for_meta = info
        playlist_count = None

    platform = detect_platform(info.get("webpage_url") or url)

    formats_raw = info_for_meta.get("formats") or []
    # Filter out fragmented manifests / DASH-only entries that aren't useful to users.
    cleaned_formats: list[FormatInfo] = []
    for f in formats_raw:
        if f.get("format_id") in (None, ""):
            continue
        if f.get("protocol") in ("mhtml",):
            continue
        cleaned_formats.append(_format_to_schema(f))

    return VideoInfo(
        id=str(info_for_meta.get("id") or ""),
        title=str(info_for_meta.get("title") or "Untitled"),
        description=info_for_meta.get("description"),
        thumbnail=info_for_meta.get("thumbnail"),
        duration=info_for_meta.get("duration"),
        duration_string=info_for_meta.get("duration_string"),
        uploader=info_for_meta.get("uploader"),
        uploader_url=info_for_meta.get("uploader_url"),
        channel=info_for_meta.get("channel"),
        channel_url=info_for_meta.get("channel_url"),
        upload_date=info_for_meta.get("upload_date"),
        view_count=info_for_meta.get("view_count"),
        like_count=info_for_meta.get("like_count"),
        webpage_url=str(info_for_meta.get("webpage_url") or url),
        extractor=str(info_for_meta.get("extractor") or "generic"),
        platform_id=platform.id,
        platform_name=platform.name,
        is_playlist=bool(is_playlist),
        playlist_count=playlist_count,
        formats=cleaned_formats,
        subtitles=_subs_to_schema(info_for_meta.get("subtitles")),
        automatic_captions=_subs_to_schema(info_for_meta.get("automatic_captions")),
    )


@dataclass
class DownloadResult:
    file_path: Path
    filename: str
    mime_type: str
    title: str


def _resolve_format(
    format_id: str | None,
    quality: str | None,
    container: str | None,
) -> tuple[str, str | None, bool, str | None]:
    """Return (format_selector, merge_format, audio_only, audio_codec)."""
    audio_only = False
    audio_codec: str | None = None

    if quality and quality in AUDIO_PRESETS:
        audio_only = True
        if quality == "audio-mp3":
            audio_codec = "mp3"
        elif quality == "audio-m4a":
            audio_codec = "m4a"
        elif quality == "audio-opus":
            audio_codec = "opus"

    if container in {"mp3", "m4a", "opus"}:
        audio_only = True
        audio_codec = container

    if format_id:
        selector = format_id
    elif quality and quality in QUALITY_PRESETS:
        selector = QUALITY_PRESETS[quality]
    else:
        selector = QUALITY_PRESETS["best"]

    merge_format: str | None = None
    if not audio_only:
        if container in {"mp4", "mkv", "webm"}:
            merge_format = container
        else:
            merge_format = "mp4"

    return selector, merge_format, audio_only, audio_codec


_MIME_BY_EXT = {
    "mp4": "video/mp4",
    "mkv": "video/x-matroska",
    "webm": "video/webm",
    "mov": "video/quicktime",
    "mp3": "audio/mpeg",
    "m4a": "audio/mp4",
    "opus": "audio/ogg",
    "ogg": "audio/ogg",
    "wav": "audio/wav",
}


def _wrap_in_temp_dir() -> Path:
    return Path(tempfile.mkdtemp(prefix="vgp_"))


def download_to_file(
    url: str,
    *,
    format_id: str | None = None,
    quality: str | None = None,
    container: str | None = None,
    embed_subs: bool = False,
    subtitle_lang: str | None = None,
) -> DownloadResult:
    """Download video/audio to a temp file and return its path. Caller must delete dir."""
    if container and container not in VALID_CONTAINERS:
        raise ValueError(f"Unsupported container: {container}")

    selector, merge_format, audio_only, audio_codec = _resolve_format(format_id, quality, container)

    workdir = _wrap_in_temp_dir()
    outtmpl = str(workdir / "%(title).180B [%(id)s].%(ext)s")

    opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "outtmpl": outtmpl,
        "format": selector,
        "noplaylist": True,
        "socket_timeout": 60,
        "retries": 3,
        "fragment_retries": 3,
        "concurrent_fragment_downloads": 4,
        "restrictfilenames": False,
        "windowsfilenames": True,
    }

    postprocessors: list[dict[str, Any]] = []
    if audio_only:
        opts["format"] = selector if selector else "ba/b"
        codec = audio_codec or "mp3"
        postprocessors.append(
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": codec,
                "preferredquality": "192" if codec == "mp3" else "0",
            }
        )
    else:
        if merge_format:
            opts["merge_output_format"] = merge_format

    if embed_subs and not audio_only:
        # Request subs to be downloaded and embedded.
        opts["writesubtitles"] = True
        opts["subtitleslangs"] = [subtitle_lang] if subtitle_lang else ["en"]
        opts["writeautomaticsub"] = True
        postprocessors.append({"key": "FFmpegEmbedSubtitle"})

    if postprocessors:
        opts["postprocessors"] = postprocessors

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
    except Exception:
        shutil.rmtree(workdir, ignore_errors=True)
        raise

    if info is None:
        shutil.rmtree(workdir, ignore_errors=True)
        raise RuntimeError("Download failed: no info")

    # After post-processing, locate the final file.
    files = sorted(p for p in workdir.iterdir() if p.is_file())
    if not files:
        shutil.rmtree(workdir, ignore_errors=True)
        raise RuntimeError("Download produced no files")

    # Prefer the largest non-fragment file as the final output.
    final = max(files, key=lambda p: p.stat().st_size)
    ext = final.suffix.lstrip(".").lower()
    mime = _MIME_BY_EXT.get(ext, "application/octet-stream")
    title = str(info.get("title") or final.stem)
    filename = f"{safe_filename(title)}.{ext}"

    return DownloadResult(file_path=final, filename=filename, mime_type=mime, title=title)


def iter_file_chunks(path: Path, chunk_size: int = 1024 * 256) -> Iterator[bytes]:
    with path.open("rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                return
            yield chunk


def cleanup_dir(path: Path) -> None:
    parent = path.parent if path.is_file() else path
    threading.Thread(target=lambda: shutil.rmtree(parent, ignore_errors=True), daemon=True).start()
