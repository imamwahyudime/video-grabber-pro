# --------- Stage 1: build frontend (React + Vite) ---------
FROM node:22-alpine AS frontend
WORKDIR /fe
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY frontend/package.json frontend/pnpm-lock.yaml* frontend/pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install
COPY frontend/ ./
# Empty VITE_API_URL → frontend uses same-origin, since backend serves static
ENV VITE_API_URL=""
RUN pnpm build

# --------- Stage 2: backend runtime (Python + ffmpeg) ---------
FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000

# ffmpeg for stream merging + audio extraction
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/pyproject.toml /app/
RUN pip install --upgrade pip && pip install -e .

COPY backend/app /app/app
COPY --from=frontend /fe/dist /app/static

RUN useradd --uid 1000 --create-home --shell /bin/sh app && chown -R app:app /app
USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsSL "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
