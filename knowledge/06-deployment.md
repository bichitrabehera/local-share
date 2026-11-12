# LocalDrop — Docker Deployment

## Prerequisites
- Docker Engine (Linux) or Docker Desktop (Windows)
- Docker Compose

## Quick Start

```bash
docker compose up -d
```

Then open:
- Host machine: `http://localhost:1516`
- Other LAN devices: `http://<host-ip>:1516` (shown on dashboard + QR code)

When running in Docker, set `LOCALDROP_ADVERTISED_HOST` to the host machine's
LAN IPv4 address. The container's automatically detected address is internal
to Docker and cannot be reached by a phone.

## Dockerfile

Multi-stage build:
1. **Base** — Node.js LTS image.
2. **Deps** — install production dependencies only.
3. **Build** — Next.js build producing standalone output.
4. **Runner** — copy standalone output, run as non-root user.

Key properties:
- Node.js LTS base image.
- Production dependencies only.
- Non-root user.
- Next.js standalone output.
- Persistent file storage + SQLite via volume.
- HEALTHCHECK.
- Graceful shutdown (SIGTERM handling).

## docker-compose.yml

- Exposes port `1516`.
- Mounts a persistent named volume at `/app/data`.
- Sets required environment variables.
- `restart: unless-stopped`.
- Includes health check.
- Compatible with Windows Docker Desktop and Linux Docker Engine.

## Environment

Copy `.env.example` to `.env` and adjust:

```
LOCALDROP_PORT=1516
LOCALDROP_HOST=0.0.0.0
LOCALDROP_ADVERTISED_HOST=192.168.1.10   # set to your LAN IP if auto-detect fails
LOCALDROP_STORAGE_DIR=/app/data/uploads
LOCALDROP_DATABASE_PATH=/app/data/localdrop.db
LOCALDROP_MAX_FILE_SIZE=1073741824
LOCALDROP_FILE_EXPIRY_HOURS=24
LOCALDROP_PAIRING_REQUIRED=true
```

## Windows Firewall

On Windows Docker Desktop, inbound access to port 1516 from other LAN devices may be blocked by Windows Firewall. Allow inbound TCP port 1516:

1. Open **Windows Defender Firewall with Advanced Security**.
2. **Inbound Rules** → **New Rule** → **Port** → TCP `1516`.
3. Allow the connection, apply to Domain/Private/Public profiles as appropriate.
4. Name it "LocalDrop".

> Note: Binding inside the container to `0.0.0.0` exposes to all container interfaces; the Windows host firewall still governs LAN access from other physical devices.

## Persistence

The `localdrop_data` named volume maps to `/app/data` inside the container, preserving:
- Uploaded files (`/app/data/uploads/`)
- SQLite database (`/app/data/localdrop.db`)

Data survives `docker compose down` and `docker compose up`.
