# LocalDrop — Project Overview

## Product

**LocalDrop** is a lightweight, self-hosted, cross-platform file-sharing application that enables users to transfer files between devices connected to the same local network.

- **Tagline:** Your files. Your network. No cloud.
- **Core concept:** A user runs LocalDrop on a laptop/desktop. Other devices on the same Wi-Fi access the web UI via a local network URL or QR code. Files are transferred through the LocalDrop server and remain on the local network — no cloud storage, no accounts, no third-party platforms.

## Product Principles

| Principle | Description |
|-----------|-------------|
| Local-first | All data stays on the local network; nothing leaves the LAN. |
| Privacy-focused | No accounts, no tracking, no cloud dependency. |
| Minimal and intuitive | No unnecessary features; focused UI. |
| Lightweight | Small dependency footprint, runs on modest hardware. |
| Cross-platform | Web UI works on any device with a browser (Android Chrome, iOS Safari, desktop). |
| No mandatory authentication | Optional pairing token/PIN only. |
| Reliable file transfers | Streaming, progress, cancellation, resume-friendly error handling. |
| Simple Docker deployment | `docker compose up -d`, then access `http://localhost:3000`. |

## Non-Goals (explicitly out of scope for MVP)

- User accounts / authentication system
- Cloud storage or public sharing links
- Native Android/iOS apps
- WebRTC or peer-to-peer protocols
- AI features, distributed storage, clustering
- Social features, subscriptions, analytics

## Acceptance Criteria (MVP complete when)

1. App starts via `docker compose up -d`.
2. Dashboard opens at `localhost:3000`.
3. LAN URL correctly displayed.
4. QR code points to the LAN URL.
5. A phone can access the app via the QR code.
6. A phone can upload files to the server.
7. The laptop can download files from the server.
8. A laptop can upload files to the server.
9. Files can be deleted.
10. Transfer progress is displayed.
11. Transfer metadata persists across Docker restarts.
12. Uploaded files persist across Docker restarts.
13. Large files handled without loading entirely into memory (streams).
14. Security protections implemented (validation, path traversal, pairing, rate limits).
15. Works on Windows Docker Desktop and Linux Docker Engine.
16. Documentation explains setup, usage, configuration, and troubleshooting.
