# Simple-Tasks

A minimal CalDAV task client for Windows/Mac/Linux built with Tauri + React.

Fills the gap for self-hosted Nextcloud users who want a native desktop task app.

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your credentials
3. Install dependencies: `npm install`
4. Install Rust: https://rustup.rs
5. Run in dev mode: `npm run tauri dev`

## Build

```bash
npm run tauri build
```

Produces a standalone `.exe` in `src-tauri/target/release/bundle/`

## Stack

- [Tauri](https://tauri.app) — native desktop shell
- [React + TypeScript](https://react.dev) — UI
- [tsdav](https://tsdav.vercel.app) — CalDAV client
- Nextcloud CalDAV backend
