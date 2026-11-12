# LocalDrop — Security Requirements

## File Validation
- Enforce a configurable maximum file size (`LOCALDROP_MAX_FILE_SIZE`).
- Validate file metadata (name, size, MIME type).
- Validate MIME types where practical.
- **Do not trust client-provided filenames** — they are stored as `original_name` for display only.
- Generate unique storage filenames (`stored_name`) to prevent collisions and overwrites.

## Path Traversal Prevention
- Never use user-provided paths directly.
- Resolve storage paths strictly inside the configured upload directory.
- Reject any attempt to access files outside the storage directory.

## Pairing
- Generate a random pairing token.
- Allow users to revoke the token.
- Support an optional PIN (`LOCALDROP_PAIRING_PIN`).
- Configurable pairing expiration period (`LOCALDROP_PAIRING_EXPIRATION_HOURS`).
- Pairing authorization required for file operations when `LOCALDROP_PAIRING_REQUIRED=true`.

## Network Security
- Bind to the appropriate network interface (`LOCALDROP_HOST`, default `0.0.0.0` inside container).
- Do not expose the application publicly by default — intended for LAN-only use.
- Provide clear LAN-only deployment guidance.
- Do not assume Docker networking alone provides security (bind to LAN, use firewall rules on Windows).

## Storage
- Restrict file access to the application's storage directory.
- Optional file expiration (`LOCALDROP_FILE_EXPIRY_HOURS`).
- Manual file deletion always available.
- Avoid serving uploaded files as executable content (serve as `application/octet-stream` with `Content-Disposition: attachment`).

## Abuse Prevention
- Limit concurrent uploads (`LOCALDROP_MAX_CONCURRENT_UPLOADS`).
- Enforce upload quotas / max file size.
- Rate limiting on pairing and upload endpoints.
- Prevent disk exhaustion (reject when storage low).
- Validate ZIP download selections (only existing file ids).

## Configuration (Environment Variables)

| Variable | Default | Description |
|----------|---------|-------------|
| `LOCALDROP_PORT` | `3000` | Server port |
| `LOCALDROP_HOST` | `0.0.0.0` | Bind host |
| `LOCALDROP_ADVERTISED_HOST` | *(auto-detect)* | LAN-accessible host for URL/QR code |
| `LOCALDROP_STORAGE_DIR` | `/app/data/uploads` | File storage directory |
| `LOCALDROP_DATABASE_PATH` | `/app/data/localdrop.db` | SQLite database path |
| `LOCALDROP_MAX_FILE_SIZE` | `1073741824` | Max upload size in bytes (1 GB) |
| `LOCALDROP_MAX_CONCURRENT_UPLOADS` | `3` | Max concurrent uploads |
| `LOCALDROP_FILE_EXPIRY_HOURS` | `24` | Auto-expiry hours (0 = disabled) |
| `LOCALDROP_PAIRING_REQUIRED` | `true` | Require pairing for file ops |
| `LOCALDROP_PAIRING_EXPIRATION_HOURS` | `24` | Pairing token expiry |
| `LOCALDROP_PAIRING_PIN` | *(empty)* | Optional pairing PIN |

Document all configuration variables in `.env.example` and `README.md`.
