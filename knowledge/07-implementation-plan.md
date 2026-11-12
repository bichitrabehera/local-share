# LocalDrop — Implementation Plan

Development is incremental across 7 phases. Do not skip phases. Each phase is verified before proceeding.

## Phase 1 — Project Setup and UI
- Initialize Next.js (done via create-next-app).
- Configure TypeScript strict mode.
- Configure Tailwind CSS v4.
- Install shadcn/ui.
- Create dashboard (`/`), files (`/files`), share (`/share`), history (`/history`) pages.
- Create reusable components: AppHeader, Navigation, NetworkStatus, QRCodePanel, UploadDropzone, FileList, FileCard, TransferItem, TransferProgress, EmptyState, ErrorState, ConfirmationDialog, Toaster, SettingsDialog.
- Responsive design (desktop + mobile).
- Temporary mock data for UI work (replaced by real backend before Phase 2 completes).

## Phase 2 — File Upload
- Implement `POST /api/upload` (Node.js runtime).
- Streaming multipart upload via `busboy` / Node streams (never load full file into memory).
- Storage management: unique storage filenames, collision prevention.
- Upload progress tracking.
- Cancellation of active uploads.
- File validation: max size, MIME type, pairing authorization.
- Structured error responses.

## Phase 3 — File Management
- `GET /api/files` — pagination, search, sorting, file-type filtering.
- `GET /api/files/:id/download` — streamed download.
- `DELETE /api/files/:id` — delete file + metadata.
- Search, sort (newest/oldest/name/size), filter by type.
- Multi-select + bulk delete.
- `POST /api/files/bulk-download` — ZIP archive stream.

## Phase 4 — LAN Connectivity
- Detect host LAN IP (first non-internal IPv4).
- Generate QR code containing the actual LAN URL (not `localhost`).
- Display LAN URL + Copy URL button.
- Configurable advertised host for when auto-detection fails.
- Mobile upload (`/share`) and mobile download.
- Test on Android Chrome and iOS Safari.

## Phase 5 — Persistence and Security
- SQLite (`better-sqlite3`) initialization + migrations.
- Persist file metadata and transfer history.
- Pairing token generation, revocation, optional PIN, expiration.
- File expiration (`LOCALDROP_FILE_EXPIRY_HOURS`).
- Rate limiting on pairing and upload endpoints.
- Storage quotas / disk exhaustion prevention.
- Path traversal prevention.

## Phase 6 — Docker
- Multi-stage Dockerfile (Node.js LTS, standalone output, non-root, health check).
- `docker-compose.yml` with named volume, port 3000, env vars, restart policy, health check.
- `.dockerignore`, `.env.example`.
- Test on Windows Docker Desktop and Linux Docker Engine.

## Phase 7 — Testing and Polish
- Small file, large file, multi-file upload.
- Cross-device download (phone ↔ laptop).
- Delete files.
- Working QR code; access from Android, iOS, another laptop.
- Persist files + metadata after Docker restart.
- Reject oversized files and invalid pairing tokens.
- Prevent path traversal.
- Handle duplicate filenames, interrupted uploads, concurrent transfers, unavailable network interfaces.
- Meaningful error messages.
- Improve error handling; write final documentation (README).

## Verification Order

1. Build passes (`next build`) with no TypeScript errors.
2. App starts via `docker compose up -d`.
3. Each acceptance criterion from `knowledge/01-project-overview.md` is demonstrated.

## Definition of Done

- No placeholder APIs for required features.
- No `TODO` markers for core functionality.
- No fake upload progress; progress reflects real bytes transferred.
- No mock data once backend is implemented.
- All file-processing API routes use Node.js runtime (never Edge).
- Streams used for upload/download; no full-file-in-memory.
- Security requirements from `knowledge/05-security.md` implemented and reviewable.
