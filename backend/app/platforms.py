"""Platform detection from URLs."""

from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urlparse


@dataclass(frozen=True)
class Platform:
    id: str
    name: str
    icon: str  # emoji fallback; frontend renders proper icon

    def matches(self, host: str) -> bool:
        return any(host == d or host.endswith("." + d) for d in self.domains)

    @property
    def domains(self) -> tuple[str, ...]:
        return _PLATFORM_DOMAINS[self.id]


_PLATFORM_DOMAINS: dict[str, tuple[str, ...]] = {
    "youtube": ("youtube.com", "youtu.be", "youtube-nocookie.com", "m.youtube.com"),
    "instagram": ("instagram.com", "instagr.am"),
    "tiktok": ("tiktok.com", "vm.tiktok.com", "vt.tiktok.com"),
    "facebook": ("facebook.com", "fb.watch", "fb.com", "m.facebook.com"),
    "twitter": ("twitter.com", "x.com", "t.co"),
    "reddit": ("reddit.com", "redd.it", "v.redd.it"),
    "vimeo": ("vimeo.com",),
    "twitch": ("twitch.tv", "clips.twitch.tv"),
    "soundcloud": ("soundcloud.com",),
    "dailymotion": ("dailymotion.com", "dai.ly"),
}

_PLATFORMS = [
    Platform("youtube", "YouTube", "▶"),
    Platform("instagram", "Instagram", "📸"),
    Platform("tiktok", "TikTok", "🎵"),
    Platform("facebook", "Facebook", "📘"),
    Platform("twitter", "Twitter / X", "𝕏"),
    Platform("reddit", "Reddit", "🤖"),
    Platform("vimeo", "Vimeo", "🎬"),
    Platform("twitch", "Twitch", "🎮"),
    Platform("soundcloud", "SoundCloud", "🎧"),
    Platform("dailymotion", "Dailymotion", "🎞"),
]

_GENERIC = Platform("generic", "Other", "🔗")


def detect_platform(url: str) -> Platform:
    try:
        host = urlparse(url).hostname or ""
    except ValueError:
        return _GENERIC
    host = host.lower().lstrip(".")
    if host.startswith("www."):
        host = host[4:]
    for p in _PLATFORMS:
        if p.matches(host):
            return p
    return _GENERIC


def is_youtube_short(url: str) -> bool:
    return bool(re.search(r"youtube\.com/shorts/", url))


def supported_platforms() -> list[dict[str, str]]:
    return [{"id": p.id, "name": p.name, "icon": p.icon} for p in _PLATFORMS]
