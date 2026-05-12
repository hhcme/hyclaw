# HyClaw

> **Hy**per **Claw** — Multi-Agent Collaborative Coding Workbench

Manage AI agents like a dev team. Unlike traditional 1-on-1 AI coding tools, HyClaw uses a **group chat model** where multiple agents collaborate in parallel, coordinated by a PM agent.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-42+-47848f.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org/)

[中文文档](docs/zh/README.md) | [English Docs](docs/en/README.md)

## Why HyClaw?

| | Traditional AI Tools | HyClaw |
|---|---|---|
| Chat Mode | 1:1 private chat | **Group chat**: you + N agents |
| Agent Roles | Fixed single role | **N custom roles** defined in natural language |
| Task Delegation | You do it manually | **PM agent auto-decomposes & delegates** |
| Parallel Work | ❌ Serial | ✅ **Multiple agents simultaneously** |
| File Conflicts | N/A (single agent) | **PM arbitrates & merges** |
| Output Types | Plain text | Code + docs + video + data cards |
| Automation | ❌ | ✅ **Built-in cron scheduler** |

## Core Concepts

```
Project/
├── Agent Pool (role definitions)
│   ├── PM (built-in)
│   ├── Alice (frontend, created by you)
│   └── Bob (backend, created by you)
│
├── Conversation "Login Module"
│   ├── 👤 You
│   ├── PM
│   ├── Alice → builds UI
│   └── Bob → builds API
│
└── Conversation "Data Scraping"
    ├── 👤 You
    ├── PM
    └── Bob ← same agent, different conversation, isolated memory
```

- **Agent = role config** (like a class): skills, personality, workflow
- **Agent in conversation = instance**: independent memory, own task queue
- **One agent can exist in multiple conversations** simultaneously

## Features

### Multi-Agent Chat
- Continuous messaging with quoted replies
- PM auto-decomposes requirements → delegates to agents
- Multiple agents work in parallel, non-blocking
- Message types: text, code diff, task card, document card, tool call

### Agent System
- Create agents with natural language: *"A senior Python backend engineer..."*
- Agent attributes: role, skills, workflow, personality, permissions
- Clone, edit, pause, delete
- Isolated memory per agent per conversation

### Task System
- Single-threaded: one task at a time, queue the rest
- Three priority levels: Normal / High / Urgent (interrupt)
- Cross-agent dependencies: B auto-wakes when A completes
- Kanban board: In Progress / Queued / Blocked / Paused / Done

### Workspace Isolation
- Conversation = Git branch (`conv/<id>`)
- Agent output → PM review → conversation branch → PM merge to main
- Side-by-side conflict resolution
- No agent writes directly to the workspace

### Built-in Tools
- **Browser**: headless (agent scraping) + headed (side panel)
- **Document Editor**: TipTap block-based, tables/code/images/formulas
- **Video Processing**: FFmpeg — trim, concat, transcode, subtitle, extract audio
- **Automation**: Cron scheduler with execution logs and persistence

### Model Support
- Unified **Anthropic-compatible API** format
- Supported providers: Anthropic / Kimi / GLM / DeepSeek / MiniMax
- Multi-provider switching, API key stored locally
- Offline mock mode when no key configured

## Architecture

```
┌──────────────────────────────────────────────────┐
│                 Electron Shell                     │
│  ┌─────────────────┐  ┌────────────────────────┐ │
│  │  Main Process    │  │  Renderer (React 19)   │ │
│  │  - API Server    │  │  - Shadcn/ui + Tailwind│ │
│  │  - Git Service   │  │  - Vercel AI SDK       │ │
│  │  - FFmpeg        │  │  - Zustand + Dexie     │ │
│  │  - Scheduler     │  │  - Monaco / TipTap     │ │
│  │  - Browser       │  │                        │ │
│  └────────┬─────────┘  └────────────────────────┘ │
│           │ IPC / HTTP                             │
│  ┌────────▼─────────────────────────────────────┐ │
│  │  Sidecar: AG2 Python (Agent Engine, planned)  │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Desktop | Electron 42+ | Built-in Chromium, native filesystem |
| Build | electron-vite 5 | Vite-based, HMR |
| UI | React 19 + Shadcn/ui + Tailwind | Minimal Claude Desktop aesthetic |
| Language | TypeScript 5.7 | Full-stack type safety |
| State | Zustand 5 | Lightweight, Electron multi-window friendly |
| Persistence | Dexie.js (IndexedDB) | Full state: projects/agents/conversations/messages/tasks |
| Streaming | Vercel AI SDK (@ai-sdk/react) + react-markdown | One hook for SSE |
| Code Highlighting | Shiki | VS Code engine |
| Editors | Monaco Editor + TipTap | Code diff + document editing |
| Video | FFmpeg CLI | System-level |
| Scheduling | croner | Lightweight cron |
| Packaging | electron-builder | macOS / Windows / Linux |
| Auto-update | electron-updater | GitHub Releases |
| Agent Engine | AG2 (planned) | Multi-agent group chat |
| Tool Reuse | OpenCode submodule (planned) | File ops & tool execution core |

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- FFmpeg (optional, for video processing)
- Git

```bash
git clone https://github.com/hhcme/hyclaw.git
cd hyclaw
npm install
npm run dev
```

### Configure API Key

Create `.env` in the project root (or use the in-app Settings dialog):

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

Without an API key, the app runs in offline mock mode.

### Package & Distribute

```bash
npm run build:mac    # macOS (dmg + zip)
npm run build:win    # Windows (nsis + zip)
npm run build:linux  # Linux (AppImage + deb)
npm run build:all    # All platforms
```

## Documentation

| Document | Language |
|----------|----------|
| [Product Design](docs/en/product-design.md) | [中文](docs/zh/product-design.md) |
| [Tech Planning](docs/en/tech-planning.md) | [中文](docs/zh/tech-planning.md) |
| [Development Plan](docs/en/development-plan.md) | [中文](docs/zh/development-plan.md) |

## Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Desktop framework | Electron | Built-in Chromium (headed browser), native Monaco support |
| UI framework | Shadcn/ui + Tailwind | Minimal aesthetic, full control, no vendor lock-in |
| Agent engine | AG2 (AutoGen) | Native GroupChat, independent memory, Python ecosystem |
| Streaming | Vercel AI SDK | One `useChat` hook for SSE, state, scrolling |
| State management | Zustand | Lightweight, Electron multi-window compatible |
| Model API | Anthropic format only | Claude / DeepSeek / Kimi / GLM / MiniMax all compatible |
| Tool reuse | OpenCode submodule | Extract tool execution core, isolated from system install |
| Persistence | Dexie.js (IndexedDB) | Browser-native, no extra DB install |

## License

MIT
