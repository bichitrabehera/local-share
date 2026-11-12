# LocalDrop — Database Schema

## Engine

SQLite via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) (synchronous, Node.js native binding).

Database path: configurable via `LOCALDROP_DATABASE_PATH` (default `/app/data/localdrop.db` in Docker).

## Guiding Rule

**Do not store file contents in SQLite.** Only metadata. Files live on the local filesystem under the storage directory.

## Tables

### `files`

| Field | Type | Null | Notes |
|-------|------|------|-------|
| `id` | TEXT | PRIMARY KEY | Unique file id (nanoid) |
| `original_name` | TEXT | NOT NULL | Original client filename (preserved for display) |
| `stored_name` | TEXT | NOT NULL | Unique safe filename on disk (prevents collisions) |
| `mime_type` | TEXT | | Detected MIME type |
| `size` | INTEGER | NOT NULL | File size in bytes |
| `created_at` | DATETIME | NOT NULL | Upload timestamp |
| `expires_at` | DATETIME | NULL | Optional automatic expiration |

### `transfers`

| Field | Type | Null | Notes |
|-------|------|------|-------|
| `id` | TEXT | PRIMARY KEY | Unique transfer id (nanoid) |
| `file_id` | TEXT | NULL | References `files.id` |
| `filename` | TEXT | NOT NULL | Filename at time of transfer |
| `size` | INTEGER | NOT NULL | Transfer size in bytes |
| `direction` | TEXT | NOT NULL | `upload` or `download` |
| `status` | TEXT | NOT NULL | `uploading`, `downloading`, `completed`, `failed`, `cancelled` |
| `created_at` | DATETIME | NOT NULL | Transfer start time |
| `completed_at` | DATETIME | NULL | Transfer end time |
| `error_message` | TEXT | NULL | Error details on failure |

## Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_direction ON transfers(direction);
CREATE INDEX IF NOT EXISTS idx_transfers_file_id ON transfers(file_id);
```

## Initialization / Migrations

A versioned initialization script runs on startup. It creates the tables and indexes above if they do not exist. Future schema changes are applied via numbered migration scripts executed in order.

## Persistence Across Restarts

Both the SQLite database and the `uploads/` directory are stored on a Docker named volume, so files and metadata survive `docker compose down` / `up` cycles.
