# LocalDrop — Architecture

## Technology Stack

### Frontend
- Next.js 16 App Router
- TypeScript (strict mode)
- Tailwind CSS v4
- shadcn/ui
- Lucide React
- React Dropzone (drag-and-drop uploads)

### Backend
- Next.js API routes (Node.js runtime — not Edge)
- Node.js `fs` streams for file handling
- Server-Sent Events or polling for transfer status

### Data Storage
- Local filesystem for uploaded files
- SQLite via `better-sqlite3` for transfer metadata
- Docker named volume for persistent storage

### Utilities
- `qrcode` — QR code generation
- `nanoid` — unique IDs
- `zod` — API validation
- MIME type detection

### Deployment
- Docker (multi-stage Dockerfile)
- Docker Compose
- Next.js standalone output
- Non-root user, health check, graceful shutdown

## Runtime Constraint

**Do not use the Edge runtime for file-processing routes.** Upload/download/delete/bulk-download routes must run on the Node.js runtime so `fs` streams and `better-sqlite3` (native module) work correctly.

## High-Level Data Flow

```
Client (LAN URL or QR code)
      |
      | HTTP upload (multipart stream)
      v
Next.js API Route (/api/upload)  [Node.js runtime]
      | validate -> stream to disk -> save metadata (SQLite)
      v
Storage directory (uploads/)
SQLite database (localdrop.db)
```

```
Client requests file
      v
GET /api/files/:id/download  [Node.js runtime]
      | validate id -> resolve safe path -> stream file
      v
Client browser download
```

## Application Pages

| Route | Purpose |
|-------|---------|
| `/` | Main dashboard: network panel, upload area, recent transfers |
| `/files` | File manager: list, search, sort, filter, download, delete, bulk ZIP |
| `/share` | Mobile-first simplified upload/download interface |
| `/history` | Transfer history: search, filter, sort, clear |

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/health` | Server health & status |
| GET | `/api/network` | LAN IP, advertised URL, port, connection status |
| GET | `/api/pairing` | Pairing token / status |
| POST | `/api/upload` | Streamed file upload with validation |
| GET | `/api/files` | Paginated, searchable, sortable file list |
| GET | `/api/files/:id/download` | Streamed file download |
| DELETE | `/api/files/:id` | Delete file + metadata |
| POST | `/api/files/bulk-download` | ZIP archive of selected files |
| GET | `/api/transfers` | Transfer history list |
| GET | `/api/transfers/:id` | Transfer details |
| POST | `/api/transfers/:id/cancel` | Cancel active transfer |

## Database (SQLite)

Tables: `files` and `transfers`. File contents are **never** stored in SQLite — only metadata. See `knowledge/04-database-schema.md`.

## Server-Mediated Transfer Architecture

LocalDrop uses a central server as the storage and transfer endpoint (HTTP uploads/downloads). No WebRTC/P2P.

### Upload Flow
1. Client opens LocalDrop via LAN URL.
2. Client selects file(s).
3. Client streams file(s) to `/api/upload`.
4. Server validates (size, MIME, pairing, quota).
5. Server streams file into persistent storage under a unique storage filename.
6. Server records transfer metadata in SQLite.
7. Client receives transfer result.
8. Dashboard updates transfer status.

### Download Flow
1. Client requests `/api/files/:id/download`.
2. Server validates file access.
3. Server streams the file to the client.
4. Browser downloads the file.

### Transfer Requirements
- Support large files (streaming, never load full file into memory).
- Multiple concurrent transfers.
- Upload progress + cancellation.
- Handle interrupted connections and storage errors.
- Prevent filename collisions (unique storage names).
- Preserve original filenames in metadata.

## Directory Structure (runtime)

```
/app/data/
  uploads/        <- stored files (unique names)
  localdrop.db    <- SQLite database
```

## Reusable UI Components

`AppHeader`, `Navigation`, `NetworkStatus`, `QRCodePanel`, `UploadDropzone`, `FileList`, `FileCard`, `TransferItem`, `TransferProgress`, `EmptyState`, `ErrorState`, `ConfirmationDialog`, `Toast notifications`, `SettingsDialog`.
