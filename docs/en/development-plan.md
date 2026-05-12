# HyClaw — Development Plan

## Guiding Principles

1. **Close the core loop first, then expand modules**: each phase produces a runnable, demoable artifact
2. **Mock first, engine later**: first 3 phases mock the backend (simulate agent responses), then integrate AG2 after validating interactions
3. **Upstream sync preferred**: for open-source dependencies, use plugin/wrapper patterns; don't modify core code

---

## P0 — Project Skeleton

**Goal**: Electron launches, React UI renders, three-column layout is draggable

**Done** ✅
- Electron + React + TypeScript scaffolding
- Tailwind CSS + Shadcn/ui style system
- Three-column layout (Sidebar / ChatArea / ToolPanel) with drag-to-resize
- Zustand state skeleton (Project / Agent / Conversation / Message / Task)
- Message bubble rendering (user/agent/system roles)
- Input field + mock send (non-streaming)
- Right tool panel toggle (browser/tasks/editor/docs/video/automation)
- `.gitignore`, README

---

## P1 — Core Chat

**Goal**: Real streaming conversation, multi-agent message rendering

**Done** ✅
- Streaming rendering pipeline with `@ai-sdk/react`
- Anthropic API streaming via main process HTTP server (127.0.0.1:11451)
- Offline mock mode fallback
- Message card system (text/quote diff/task/document/tool call)
- Multi-agent message rendering with avatars, names, role colors
- Continuous conversation with quote reply
- Dark mode toggle (light/dark/system)
- Message persistence (Dexie.js IndexedDB)

---

## P2 — Agent System

**Goal**: Create/manage agents, agent pool + pull into conversations

**Done** ✅
- Agent pool panel
- Natural language → agent config generation
- Agent detail/edit/clone/delete
- Pull agent into / kick agent from conversations
- Conversation member management
- Agent memory isolation (per-conversation context, shared role config)

---

## P3 — Task System

**Goal**: Agents can receive and execute tasks, queues + priority + dependencies

**Done** ✅
- Per-agent task panel (in-progress/queued/blocked/completed columns)
- Task state machine (queued → in_progress → review → completed)
- Three priority levels: Normal / High / Urgent
- Agent single-thread constraint
- Cross-agent dependency with auto-wake
- Task creation form with agent assignment

---

## P4 — Workspace Isolation

**Goal**: Safe file modification, agent output → PM merge, conversation branch isolation

**Done** ✅
- Git service in main process (14 operations)
- Diff card component (added/modified/deleted views)
- Conflict resolution UI (ours/theirs/manual)
- Workspace status indicator in conversation header
- `/diff` command to simulate agent code output
- Memory isolation: non-PM agents only see their own messages

---

## P5 — Built-in Tools

**Goal**: Browser + document editor functional

**Done** ✅
- Browser panel (headless + headed modes)
- TipTap document editor (tables/code blocks/images)
- Multi-document management with edit/preview toggle
- Document card for in-chat document display
- Video panel with FFmpeg: trim, concat, transcode, subtitle, extract audio, screenshot

---

## P6 — Video Editing

**Goal**: Simple splicing, trimming, subtitles

**Done** ✅
- FFmpeg service: detect, getInfo, trim, concat, transcode, subtitle, extractAudio, screenshot
- Video panel with file selector + info display + operation forms
- Native file picker dialog integration
- Result display with output path, duration, file size

---

## P7 — Automation

**Goal**: Scheduled triggers + event-driven execution

**Done** ✅
- Scheduler service with cron-based timing
- Task CRUD with enable/disable
- Execute-once (runNow) button
- Execution logs with success/error/timing
- Persistence (JSON files in `~/hyclaw-data/`)
- Startup recovery: auto-load saved tasks and restart crons
- Automation panel with task list, log viewer, create modal

---

## P8 — Distribution & Polish

**Goal**: Package for distribution, UI polish

**Done** ✅
- electron-builder config (macOS/Windows/Linux)
- System tray with minimize-to-tray
- Global keyboard shortcut (Cmd/Ctrl+Shift+W)
- Auto-update via electron-updater + GitHub Releases
- Single-instance lock
- About dialog
- Build scripts (`build:mac` / `build:win` / `build:linux` / `build:all`)
- Project creation flow with native directory picker
- Welcome screen for empty state
- Project settings page with agent pool management
- Shadcn/ui full integration (Dialog, Input, Textarea, Select)
- Data persistence: Dexie IndexedDB for full state recovery on restart
- Right toolbar pinned to window edge
- Three-panel rounded corners with spacing

---

## Milestone Timeline

```
P0  2 weeks   Project skeleton     ██░░░░░░░░░░░░░░░░░░░░░░
P1  3 weeks   Core chat             ███░░░░░░░░░░░░░░░░░░░░░
P2  3 weeks   Agent system          ███░░░░░░░░░░░░░░░░░░░░░
P3  3 weeks   Task system           ███░░░░░░░░░░░░░░░░░░░░░
P4  3 weeks   Workspace isolation   ███░░░░░░░░░░░░░░░░░░░░░
P5  3 weeks   Built-in tools        ███░░░░░░░░░░░░░░░░░░░░░
P6  2 weeks   Video editing         ██░░░░░░░░░░░░░░░░░░░░░░
P7  3 weeks   Automation            ███░░░░░░░░░░░░░░░░░░░░░
P8  2 weeks   Distribution          ██░░░░░░░░░░░░░░░░░░░░░░
─────────────────────────────────────────────────
Total ~24 weeks (6 months)
```

## Key Decision Records

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Desktop framework | Electron | Built-in Chromium, Monaco native support |
| UI framework | Shadcn/ui + Tailwind | Minimal aesthetic, full control |
| Agent engine | AG2 (AutoGen) | Native GroupChat, independent memory |
| Streaming | Vercel AI SDK (@ai-sdk/react) | One hook for SSE/state/scroll |
| Code highlighting | Shiki | VS Code engine, streaming-friendly |
| State management | Zustand | Lightweight, multi-window compatible |
| Local storage | Dexie.js + SQLite | Tiered: config/messages/tasks |
| Model API | Anthropic-compatible | Claude/DeepSeek/Kimi/GLM/MiniMax |
| OpenCode integration | Git Submodule + core extraction | Isolated environment, no system dependency |
