"""FastAPI app for Video Grabber Pro."""

from __future__ import annotations

import logging
import os
import shutil
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import quote

import httpx
import yt_dlp
from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError

from . import __version__
from .downloader import (
    cleanup_dir,
    download_to_file,
    fetch_info,
    iter_file_chunks,
    safe_filename,
)
from .platforms import detect_platform, supported_platforms
from .schemas import DownloadRequest, ErrorResponse, InfoRequest, VideoInfo

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("video_grabber_pro")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("video-grabber-pro backend starting v%s", __version__)
    if not shutil.which("ffmpeg"):
        logger.warning("ffmpeg not found on PATH; merging and audio extraction will fail")
    yield
    logger.info("video-grabber-pro backend shutting down")


app = FastAPI(
    title="Video Grabber Pro",
    description="Download videos from YouTube, Instagram, TikTok, Facebook and 1000+ sites.",
    version=__version__,
    lifespan=lifespan,
)

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "*",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length", "Content-Type"],
)


def _err(status: int, error: str, detail: str | None = None) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content=ErrorResponse(error=error, detail=detail).model_dump(),
    )


@app.get("/api/health")
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "version": __version__,
        "ffmpeg": bool(shutil.which("ffmpeg")),
        "yt_dlp": yt_dlp.version.__version__,
    }


@app.get("/api/platforms")
async def platforms() -> dict[str, object]:
    return {"platforms": supported_platforms()}


@app.post("/api/info", response_model=VideoInfo, responses={400: {"model": ErrorResponse}})
async def info(payload: InfoRequest) -> VideoInfo | JSONResponse:
    url = payload.url.strip()
    if not url:
        return _err(400, "missing_url", "URL is required")
    if not (url.startswith("http://") or url.startswith("https://")):
        return _err(400, "invalid_url", "URL must start with http:// or https://")
    try:
        return fetch_info(url)
    except yt_dlp.utils.DownloadError as e:  # type: ignore[attr-defined]
        logger.warning("info extraction failed: %s", e)
        return _err(400, "extraction_failed", str(e))
    except Exception as e:
        logger.exception("info unexpected error")
        return _err(500, "internal_error", str(e))


@app.post("/api/download")
async def download(payload: DownloadRequest, background: BackgroundTasks):
    url = payload.url.strip()
    if not url:
        return _err(400, "missing_url", "URL is required")
    try:
        result = download_to_file(
            url,
            format_id=payload.format_id,
            quality=payload.quality,
            container=payload.container,
            embed_subs=payload.embed_subs,
            subtitle_lang=payload.subtitle_lang,
        )
    except yt_dlp.utils.DownloadError as e:  # type: ignore[attr-defined]
        logger.warning("download failed: %s", e)
        return _err(400, "download_failed", str(e))
    except ValueError as e:
        return _err(400, "invalid_format", str(e))
    except Exception as e:
        logger.exception("download unexpected error")
        return _err(500, "internal_error", str(e))

    background.add_task(cleanup_dir, result.file_path)

    headers = {
        # RFC 5987 filename* covers non-ASCII titles (Indonesian, etc.)
        "Content-Disposition": (
            f'attachment; filename="{safe_filename(result.title)}.'
            f'{result.file_path.suffix.lstrip(".")}"; '
            f"filename*=UTF-8''{quote(result.filename)}"
        ),
        "Content-Length": str(result.file_path.stat().st_size),
        "X-Title": quote(result.title),
        "X-Filename": quote(result.filename),
    }
    return StreamingResponse(
        iter_file_chunks(result.file_path),
        media_type=result.mime_type,
        headers=headers,
    )


@app.get("/api/thumbnail")
async def thumbnail(url: str = Query(..., description="Image URL to proxy")):
    """Proxy a thumbnail image — useful for hosts that block hotlinking from
    the browser, and to give the user a one-click 'download thumbnail' action.
    """
    if not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="invalid url")
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 VideoGrabberPro/1.0"})
            resp.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"thumbnail fetch failed: {e}") from e
    content_type = resp.headers.get("content-type", "image/jpeg")
    ext = "jpg"
    if "png" in content_type:
        ext = "png"
    elif "webp" in content_type:
        ext = "webp"
    elif "gif" in content_type:
        ext = "gif"
    headers = {
        "Content-Disposition": f'attachment; filename="thumbnail.{ext}"',
        "Cache-Control": "public, max-age=3600",
    }
    return StreamingResponse(iter([resp.content]), media_type=content_type, headers=headers)


@app.get("/api/detect")
async def detect(url: str = Query(...)) -> dict[str, str]:
    p = detect_platform(url)
    return {"id": p.id, "name": p.name, "icon": p.icon}


# Pydantic-validation error → 400 JSON instead of FastAPI default
@app.exception_handler(ValidationError)
async def _validation_handler(_, exc: ValidationError):
    return _err(400, "validation_error", exc.json())


# ---------------------------------------------------------------------------
# Static frontend (mounted last so /api/* keeps priority).
# In production we copy the Vite build into backend/static/ so the same
# FastAPI process serves both the API and the SPA — single deployable, no CORS.
# ---------------------------------------------------------------------------
STATIC_DIR = Path(__file__).parent.parent / "static"


if STATIC_DIR.is_dir():
    # Mounting StaticFiles with html=True at "/" automatically serves
    # index.html for "/" and any non-matching path — perfect SPA fallback.
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
else:
    logger.info("static dir not found at %s — serving API only", STATIC_DIR)

    @app.get("/", include_in_schema=False)
    async def _root_no_static() -> JSONResponse:
        return JSONResponse(
            {
                "service": "video-grabber-pro",
                "version": __version__,
                "docs": "/docs",
                "note": "frontend not bundled in this build",
            }
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
