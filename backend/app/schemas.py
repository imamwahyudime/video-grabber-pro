"""Pydantic schemas for API requests and responses."""

from __future__ import annotations

from pydantic import BaseModel, Field


class InfoRequest(BaseModel):
    url: str = Field(..., description="Video URL from any supported platform")


class FormatInfo(BaseModel):
    format_id: str
    ext: str
    quality: str | None = None
    resolution: str | None = None
    fps: float | None = None
    filesize: int | None = None
    filesize_approx: int | None = None
    vcodec: str | None = None
    acodec: str | None = None
    abr: float | None = None
    vbr: float | None = None
    tbr: float | None = None
    note: str | None = None
    has_video: bool = False
    has_audio: bool = False


class SubtitleTrack(BaseModel):
    lang: str
    name: str | None = None
    ext: str | None = None


class VideoInfo(BaseModel):
    id: str
    title: str
    description: str | None = None
    thumbnail: str | None = None
    duration: float | None = None
    duration_string: str | None = None
    uploader: str | None = None
    uploader_url: str | None = None
    channel: str | None = None
    channel_url: str | None = None
    upload_date: str | None = None
    view_count: int | None = None
    like_count: int | None = None
    webpage_url: str
    extractor: str
    platform_id: str
    platform_name: str
    is_playlist: bool = False
    playlist_count: int | None = None
    is_short: bool = False
    is_live: bool = False
    formats: list[FormatInfo] = []
    subtitles: list[SubtitleTrack] = []
    automatic_captions: list[SubtitleTrack] = []


class DownloadRequest(BaseModel):
    url: str
    format_id: str | None = Field(
        default=None, description="yt-dlp format id, e.g. '137+140' or a preset like 'best'"
    )
    quality: str | None = Field(
        default=None,
        description="Preset: best, 2160p, 1440p, 1080p, 720p, 480p, 360p, audio-mp3, audio-m4a",
    )
    container: str | None = Field(
        default=None, description="Output container: mp4, mkv, webm, mp3, m4a"
    )
    embed_subs: bool = False
    subtitle_lang: str | None = None


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
