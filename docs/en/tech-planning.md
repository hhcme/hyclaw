# HyClaw — Technical Planning

## 1. Overall Architecture

```
┌──────────────────────────────────────────────────┐
│                 Electron Shell                     │
│  ┌─────────────────┐  ┌────────────────────────┐ │
│  │  Main Process    │  │  Renderer Process      │ │
│  │  - File system   │  │  - React UI            │ │
│  │  - Git ops       │  │  - Group chat          │ │
│  │  - Sidecar mgmt  │  │  - Doc/code editors    │ │
│  │  - IPC bridge    │  │  - Task panel          │ │
│  │  - Native menus  │  │                        │ │
│  └────────┬─────────┘  └────────────────────────┘ │
│           │                                        │
│  ┌────────▼─────────────────────────────────────┐ │
│  │              Sidecar Processes                │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │ │
│  │  │ AG2      │ │Playwright│ │ FFmpeg       │ │ │
│  │  │ Agent    │ │Browser   │ │ Video Proc   │ │ │
│  │  │ Engine   │ │Sandbox   │ │              │ │ │
│  │  └──────────┘ └──────────┘ └──────────────┘ │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## 2. Desktop Shell

### Framework: Electron + electron-vite

| Choice | Rationale |
|--------|-----------|
| **Electron** | Mature desktop solution, built-in Chromium (headed browser), native Node file system/Git |
| **electron-vite** | Vite-driven Electron build tool, fast HMR, lighter than electron-forge |
| **electron-builder** | Packaging & distribution |

### Multi-Window Strategy

| Window | Purpose |
|--------|---------|
| Main window | Group chat UI (core) |
| BrowserView | Headed browser embedded in right panel |
| Detached browser | Pop-out headed browser window |
| Diff float | Code comparison pop-up window |

### Main Process Responsibilities

- Git repo management (git CLI wrapper)
- File system operations (project directory watching, file I/O)
- Sidecar process lifecycle (AG2 Python, FFmpeg)
- Headless browser management (invisible BrowserWindow)
- System notifications, tray
- Auto-update

### Renderer Process Responsibilities

- React UI rendering
- Group chat message stream, message cards
- Agent management panel
- Task queue interface
- Document editor (TipTap)
- Code preview/diff (Monaco Editor)
- IPC communication with Main Process

## 3. Frontend Tech Stack

### Core

| Tech | Choice | Rationale |
|------|--------|-----------|
| Framework | React 19+ | Largest ecosystem, best Electron integration |
| Language | TypeScript 5.7 | Required |
| UI Components | Shadcn/ui + Tailwind CSS | Minimal aesthetic, customizable, code ownership |
| Icons | lucide-react | Linear icons, matching style |

### Layout

| Need | Solution |
|------|----------|
| Three-column layout | `react-resizable-panels` (draggable split panels) |
| Tabs | `@radix-ui/react-tabs` |
| Drawer/sidebar | Shadcn Sheet |
| Overlays | Shadcn Dialog / Popover |
| Context menu | `@radix-ui/react-context-menu` |

### Editors & Rendering

| Need | Solution |
|------|----------|
| Code viewing/diff | Monaco Editor (VS Code engine) |
| Document editing | TipTap (ProseMirror-based, block-editor) |
| Streaming Markdown | Vercel AI SDK + react-markdown + remark-gfm |
| Code highlighting | Shiki (VS Code engine, incremental streaming) |
| Static Markdown | react-markdown + rehype plugins |

### State Management

| Need | Solution |
|------|----------|
| Global state | Zustand (lightweight, Electron multi-window friendly) |
| Server state | TanStack Query (agent API cache) |
| Persistence | Dexie.js (IndexedDB wrapper for local config/messages) |
| Real-time | SSE / WebSocket (communication with Sidecar AG2) |

### Chat Streaming Stack

The core challenge of streaming rendering is **streaming Markdown parsing** — LLM output token by token means Markdown syntax is always incomplete (`**bold` without closing `**`, unclosed code blocks).

Four-layer pipeline, all MIT-licensed, 10k+ stars:

| Layer | Library | GitHub Stars | Solves |
|-------|---------|-------------|--------|
| SSE + message state | **Vercel AI SDK** (`@ai-sdk/react`) | 10k+ | `useChat` hook: SSE connection, message array streaming, loading/error/abort, auto-scroll, tool call parsing |
| Streaming Markdown | Custom + react-markdown | — | Incremental rendering of incomplete Markdown |
| Code highlighting | **Shiki** | 10k+ | VS Code engine, incremental streaming highlight |
| Virtual scrolling | **react-virtuoso** | 13k+ | Chat-optimized virtual list |

### Message Render Architecture

```
react-virtuoso (virtual list)
  └─ Message Card (custom Shadcn)
       ├─ Text → react-markdown (streaming) + Shiki (code highlight)
       ├─ Quote Reply → custom
       ├─ Diff → Monaco DiffEditor
       ├─ Task → custom
       ├─ Document → TipTap
       └─ Tool Call → custom
```

### Message Types

| Type | Renderer | Description |
|------|----------|-------------|
| Text | react-markdown + Shiki | Streaming Markdown, auto code highlight |
| Quote Reply | Shadcn custom | Quoted source message, nested display |
| Diff | Monaco DiffEditor | Code change comparison |
| Task | Shadcn custom | Status, progress, dependencies |
| Document | TipTap read-only | Block-based document |
| Tool Call | Shadcn custom | Collapsible agent tool invocation |

## 4. Agent Engine

### Framework: AG2 (AutoGen)

```
Fork AG2 → maintain upstream sync
Extension points (plugin mode, no core modification):
  - PMAgent: extends AssistantAgent with task distribution/code merge logic
  - GroupChat: extended with quote reply model
  - Memory: per-agent vector memory (LanceDB)
  - Tool: file ops route through PM agent proxy
```

### Sidecar Communication

```
Electron Main Process
    │
    ├── spawn: AG2 Python process (HTTP Server / WebSocket)
    │     └── One agent runtime per conversation
    │
    ├── spawn: Playwright Server
    │     └── Headless browser instance pool
    │
    └── spawn: FFmpeg (on-demand, exits when done)
```

### Memory Architecture

| Layer | Storage | Content |
|-------|---------|---------|
| Agent role definition | Dexie (local) | System prompt, skills, personality |
| Conversation context | Message history in window | Full conversation log |
| Long-term memory | LanceDB (vector DB) | Project architecture, key decision summaries |
| Code index | Project file tree + regex | Function/class definitions |

## 5. Module Technical Choices

### Browser

| Mode | Implementation |
|------|----------------|
| Headless (agent) | Electron invisible BrowserWindow, `capturePage()` |
| Headed (user) | Electron BrowserView embedded in right panel |

### File Workspace (Git Layer)

| Operation | Implementation |
|-----------|----------------|
| Git ops | `simple-git` or direct `git` CLI exec |
| Diff generation | git diff or Monaco built-in diff |
| File watching | chokidar (Main Process) |
| Branch management | Auto branch `conv/<conversation-id>` per conversation |

### Video Editing

| Operation | Implementation |
|-----------|----------------|
| Core engine | FFmpeg (sidecar binary distributed) |
| Invocation | Node `child_process.exec` with FFmpeg CLI |
| Preview | Electron `<video>` tag playing output file |

### Automation & Scheduling

| Need | Solution |
|------|----------|
| Message queue | BullMQ + Redis (or lighter: better-queue) |
| Cron trigger | croner |
| Workflow engine | n8n (optional deep integration) |
| Persistence | SQLite (task history) |

### Local Data Storage

| Storage | Use | Solution |
|---------|-----|----------|
| IndexedDB | Project config, agents, conversations | Dexie.js |
| SQLite | Task history, automation logs | better-sqlite3 |
| Filesystem | Project code | Direct I/O |
| LanceDB | Agent vector memory | Embedded vector DB |

## 6. Project Structure

```
hyclaw/
├── electron/              # Electron Main Process
│   ├── main.ts
│   ├── preload.ts
│   ├── ipc/               # IPC channel definitions
│   ├── git/               # Git operation wrappers
│   ├── sidecar/           # Sidecar process management
│   └── services/          # Filesystem, notifications etc.
│
├── src/                   # React Renderer
│   ├── App.tsx
│   ├── layouts/           # Main layout (three columns)
│   ├── components/
│   │   ├── ui/            # Shadcn components
│   │   ├── chat/          # Messages, message cards
│   │   ├── agent/         # Agent management panel
│   │   ├── task/          # Task panel
│   │   ├── editor/        # TipTap editor
│   │   ├── browser/       # Embedded browser
│   │   ├── diff/          # Monaco Diff view
│   │   └── project/       # Project management
│   ├── stores/            # Zustand state
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   └── types/             # TypeScript types
│
├── agent-engine/          # AG2 Fork (Python)
│   ├── pm_agent.py
│   ├── tool_merger.py
│   └── memory/
│
├── resources/             # Static assets
│   └── ffmpeg/            # FFmpeg binary
│
├── electron-builder.yml   # Packaging config
├── package.json
└── tailwind.config.ts
```

## 7. Upstream Sync Strategy

| Open Source | Integration | Sync Strategy |
|-------------|-------------|---------------|
| AG2 | Fork + Sidecar | `upstream/main` rebase, don't modify core, extend via plugin layer |
| Shadcn/ui | Direct dependency | `cli update` command, don't modify component core |
| TipTap | npm dependency | Version following, extend via custom extensions |
| Monaco Editor | npm dependency | Version following |
| Playwright | npm dependency | Version following |
| FFmpeg | Binary distribution | Follow official releases, swap binary |
| n8n | Optional embedded | Fork, custom nodes via community node spec |

## 8. Key Design Decisions

### Why Electron over Tauri

1. Electron's built-in Chromium = free headed browser
2. Monaco Editor has native web support (Tauri needs extra handling)
3. AG2 sidecar is Python — Tauri's Rust side has no advantage
4. Electron ecosystem maturity, plugins, and tooling

### Why Shadcn/ui over Ant Design

1. Claude Desktop minimal aesthetic achievable directly with Tailwind
2. Chat applications are highly custom; generic component libraries constrain more than they help
3. Shadcn code lives in your project, editable at any time
4. Mainstream choice in the AI coding community

### Why Zustand over Redux

1. Extremely lightweight, simple API
2. More friendly for Electron multi-window scenarios
3. No need for Redux middleware ecosystem (no complex async flows)

### OpenCode Isolation via Git Submodule

```
hyclaw/
├── vendor/
│   └── opencode/          ← git submodule, forked from anomalyco/opencode
└── src/
    └── main/
        └── agent/         ← extract OpenCode core: tool execution / file ops / git
```

- No global `opencode` install, no system PATH pollution
- Only import OpenCode's core logic modules, not the CLI
- All file operations scoped to project workspace
- Updates: `git submodule update --remote` to stay in sync
- Introduced at P4 stage (workspace isolation)

### Why Anthropic API Only

1. Claude (Anthropic) is widely recognized as the strongest coding model
2. DeepSeek / OpenAI / Groq etc. all support Anthropic Messages API format
3. `@ai-sdk/anthropic` + `@ai-sdk/openai` dual provider covers all models
4. User can freely switch models without vendor lock-in
