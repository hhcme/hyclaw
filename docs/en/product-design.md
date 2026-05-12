# HyClaw — Product Design

## 1. Product Positioning

A multi-agent collaborative coding workbench. Unlike traditional 1-on-1 AI programming tools, HyClaw uses a **group chat model** where multiple agents collaborate, each with independent memory and single-threaded task execution. All outputs are merged by the PM agent to prevent file conflicts.

## 2. Core Concepts

### Three-Layer Architecture

```
Project
├── Agent Pool (role definitions, project-level)
│   ├── PM (built-in, auto-created)
│   ├── Custom Agent A
│   ├── Custom Agent B
│   └── ...
│
├── Conversation 1
│   ├── 👤 User
│   ├── PM (instance)
│   ├── Agent A (instance)
│   └── Agent B (instance)
│
├── Conversation 2
│   ├── 👤 User
│   ├── PM (instance)
│   └── Agent A (instance) ← same role, different conversation, isolated instance
│
└── Conversation 3 ...
```

- **Agent = Role config** (like a class): defines skills, personality, workflow at project level
- **Agent in conversation = Instance**: the role's incarnation in a specific conversation, with independent memory and task queue
- **Same agent can exist in multiple conversations simultaneously**, isolated from each other

### PM Agent

- Built-in, auto-created when a project is created
- Responsibilities: understand user needs → decompose into tasks → delegate to agents → review output → merge code → handle conflicts
- All file writes go through PM to prevent multi-agent file contention

## 3. Group Chat Interaction Model

### Continuous Conversation

User can send multiple messages without waiting. PM replies in order with quoted references:

```
User 10:00 → "@PM Analyze the project structure"
User 10:01 → "Also update the README"
User 10:01 → "Switch logging to pino"

PM 10:00 → [quoting "Analyze project"] Structure: src/ contains...
PM 10:01 → [quoting "Update README"] ✅ Updated
PM 10:01 → [quoting "Switch to pino"] ✅ Replaced 12 files
PM 10:02 → [Summary card] All 3 tasks complete: preview...
```

### Task Distribution & Parallelism

One user message can trigger PM to distribute to multiple agents simultaneously:

```
User: @PM Build the login page + write a scraper

PM → @Alice (frontend) handle the login page
PM → @Bob (scraper) scrape the homepage
Alice → [coding...]
Bob → [scraping...] encounters issue → asks user
PM → coordinates, merges, reports
```

### Quote Reply Mechanism

All replies include quoted references, forming a traceable task chain:
- User message → PM reply (quoted)
- Agent inquiry → PM reply (quoted)
- Task complete → Summary card

## 4. Agent Management

### Creating an Agent

Users describe the desired agent in natural language. The system auto-generates the configuration:

```
User: I want a senior Python backend engineer proficient in FastAPI and SQLAlchemy.
      Code style: type hints + pydantic, comments in Chinese, variables in English.
      Workflow: propose approach → confirm → code → self-test. Calm personality.

PM: ✅ Agent "Bob" created and added to agent pool
```

### Agent Properties (defined by prompt)

| Property | Description |
|----------|-------------|
| Role | Who it is, what it's good at |
| Skills | Concrete tech stack |
| Workflow | How it approaches tasks |
| Personality | Communication style |
| Permissions | What it can and cannot do |
| Memory preference | What to remember vs. discard |

### Agent Operations

- **Clone**: Copy role config, modify skills
- **Fine-tune**: Adjust behavior through natural language conversation
- **Pause/Resume**: Temporarily disable
- **Delete**: Remove from project

## 5. Task System

### Single-Thread Model

Each agent instance focuses on one task at a time. New tasks are queued:

```
Bob's Task Panel:
┌─────────────────────────────────┐
│ 🔄 In Progress                   │
│  #7 Implement auth endpoint     │
│                                  │
│ ⏳ Queued                        │
│  #8 Refactor DB models          │
│  #9 Add caching layer           │
│                                  │
│ ⏸ Blocked                       │
│  #10 Cache layer ← waiting #7   │
│                                  │
│ ✅ Completed                     │
│  #6 Fix login bug               │
└─────────────────────────────────┘
```

### Priority Levels

| Level | Behavior |
|-------|----------|
| 🔵 Normal | Append to queue tail |
| 🟡 High | Insert after current in-progress task |
| 🔴 Urgent | Pause current task, resume after |

### Task States

```
Queued → In Progress → Review → Completed
           │              │
           ├── Paused      ├── Rejected → back to Queued
           ├── Waiting (for user input)
           └── Blocked (waiting for another agent)
```

### Cross-Agent Dependencies

```
PM: @Bob #7 Auth endpoint
PM: @Alice #8 Login page ← depends on #7

Alice: #8 detected dependency #7 (Auth), waiting...
        Auto-start when Bob completes

── #7 completed ──
Alice: Dependency satisfied, starting #8
```

## 6. File Workspace Isolation

### Core Model: Conversation = Git Branch

```
Project Repo
├── main                      ← source of truth
├── conv/login                ← independent branch for "Login" conversation
└── conv/crawler              ← independent branch for "Scraper" conversation

Merge flow:
  Agent output → PM review → conversation branch → PM merge → main
```

### Conflict Prevention

- No agent writes directly to the main workspace
- PM merges sequentially; conflicts generate a diff comparison for user resolution
- Underlying git tracking

### Three Merge Strategies

| Scenario | PM Behavior | User Experience |
|----------|-------------|-----------------|
| No conflict | Auto-merge, silent | Notification "Merged" |
| Simple conflict (same file, different regions) | Auto-merge, explain | Notification + one-click revert |
| Complex conflict (same file, same region) | Pause, @user to decide | Side-by-side comparison, pick A/B/manual |

### Workspace Status Indicator

Each conversation header shows status:
- 📁 Clean ✅ Synced
- 📁 N changes ○ No conflict
- 📁 N changes ⚠ Conflict detected

## 7. Built-in Tools

### Browser

| Mode | Description |
|------|-------------|
| Headless (for agents) | Agent fetches pages, sends screenshots/data to chat |
| Headed (for users) | Side panel browser, user and agent share the view |

### Document Editor

- Output rendered as interactive "document cards", not file paths
- Block-based editor (similar to Notion)
- Supports: code blocks, tables, images, flowcharts, formulas
- User and agent can co-edit; agent changes require user confirmation

### Video Editor

- Core capabilities: trim, concat, transcode, subtitle/watermark, resolution/framerate adjustment
- Preview cards with playback before confirming export

### Automation & Scheduled Tasks

```
Scheduled: daily at 9:00 scraper → fetch competitor data → reporter → summarize → publish
Event-triggered: git tag push → generate CHANGELOG → push to Lark group
```

## 8. Product Interaction Principles

| Principle | Description |
|-----------|-------------|
| Chat = Collaboration | Conversations are multi-agent collaboration spaces, not 1-on-1 Q&A |
| PM is the coordinator | User talks to PM, PM handles the rest |
| Agents are independent personalities | Create, fine-tune, pause, clone, delete |
| All output is a message | Code, docs, video are chat message cards |
| Quote = Traceability | Every message can be traced to the original request |
| Conflicts handled by PM | User sees PM's conflict handling, not raw git |

## 9. UI Layout

### Three-Column Layout

```
┌──────────┬────────────────────┬──┬──────────────┐
│ Sidebar  │    Main Content     │  │  ToolBar     │
│          │                    │  │              │
│ Projects │   Chat / Settings   │  │  Browser     │
│ Chats    │                    │  │  Tasks       │
│ Agents   │                    │  │  Docs        │
│          │                    │  │  Video       │
│ ⚙️ 🌓   │                    │  │  Automation  │
│          │                    │  │              │
└──────────┴────────────────────┴──┴──────────────┘
       Resizable              Fixed right edge
```

- **Left**: project/conversation navigation, collapsible
- **Center**: conversation or project settings
- **Right**: icon bar pinned to right edge, expands on click

### Empty States

| State | Display |
|-------|---------|
| No project | Welcome screen: Logo + feature cards + "New Project" button |
| Project, no conversations | Empty chat area with guide to create conversation |
| Project, no agents | Project settings prompt to create agents |

### Project Settings

Click project name in sidebar → main area switches to settings:
- Project info: name editing, workspace path
- Agent member list: full CRUD, PM is system agent (undeletable)
- ← Back button returns to chat

## 10. Model Settings

### Design Principles
- API format: unified Anthropic-compatible only
- User only sees: provider → model → API key
- Base URL auto-set by system based on provider

### Provider Presets

| Provider | Base URL (system preset) | Default Model |
|----------|--------------------------|---------------|
| Anthropic | api.anthropic.com/v1 | claude-sonnet-4-20250514 |
| Kimi | api.moonshot.cn/anthropic | kimi-k2.6 |
| GLM | open.bigmodel.cn/api/paas/v4 | GLM-5.1 |
| DeepSeek | api.deepseek.com/v1 | deepseek-v4-pro |
| MiniMax | api.minimaxi.com/v1 | MiniMax-M2.7 |

### Interaction
- Add multiple providers (displayed as a list)
- ○ radio to select active provider
- 🔑 edit only allows API key changes
- 🗑 delete provider, auto-switch to next

## 11. Data Persistence

### Technology
- **Dexie.js** (IndexedDB wrapper)
- Database name: `hyclaw`, version 2
- Five tables: projects / agents / conversations / messages / tasks
- One meta table: stores active project/conversation ID

### Startup Recovery
1. App launches → briefly shows welcome screen
2. `hydrateFromDB()` loads all data from IndexedDB
3. Restores last active project and conversation
4. All mutations sync-write to IndexedDB

### Main Process Data Paths
- Model settings: `~/hyclaw-data/settings.json`
- Scheduler tasks: `~/hyclaw-data/scheduler-tasks.json`
- Video output: `~/hyclaw-output/`

## 12. Comparison with AI Coding Tools

| | Claude Desktop | Cursor | **HyClaw** |
|---|---|---|---|
| Chat mode | 1:1 | 1:1 | Group chat |
| Agent roles | Fixed | Fixed | N custom roles |
| Task delegation | Manual | Manual | PM auto-delegates |
| Parallel work | ❌ | ❌ | ✅ Multi-agent parallel |
| File conflicts | N/A | N/A | PM arbitration |
| Output types | Text | Code diff | Code + docs + video + data cards |
| Cron/automation | ❌ | ❌ | ✅ Built-in |
| Document editor | ❌ | ❌ | ✅ TipTap block-based |
| Video processing | ❌ | ❌ | ✅ FFmpeg 7 ops |
| Open source | No | Partial | ✅ MIT |
