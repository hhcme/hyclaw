# HyClaw

> **Hy**per **Claw** — 多 Agent 协作的编程工作台

以项目管理视角组织 AI Agent，以**群聊模式**驱动多个 Agent 协作开发。不同于传统 AI 编程工具的一对一私聊，HyClaw 让你像管理团队一样管理 AI。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-42+-47848f.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org/)

## 为什么是 HyClaw？

| | 传统 AI 编程工具 | HyClaw |
|---|---|---|
| 对话模式 | 1v1 私聊 | **群聊**：用户 + N 个 Agent |
| Agent 角色 | 固定一个 | **自定义 N 个**，自然语言描述生成 |
| 任务分发 | 你自己说 | **PM Agent 自动分解分发** |
| 并行工作 | ❌ 串行 | ✅ **多 Agent 同时干活** |
| 文件冲突 | 无（一个人） | **PM 仲裁合并** |
| 产出形态 | 纯文本 | 代码 + 文档 + 视频 + 数据卡片 |
| 自动化 | ❌ | ✅ **内置 cron 定时任务** |

## 核心理念

```
Project "项目名"
├── Agent 池 (角色定义)
│   ├── PM (系统自带)
│   ├── 前端老王 (你创建的)
│   └── 后端老李 (你创建的)
│
├── 对话 1 "登录模块"
│   ├── 👤 我
│   ├── PM
│   ├── 前端老王 → 写 UI
│   └── 后端老李 → 写 API
│
└── 对话 2 "数据抓取"
    ├── 👤 我
    ├── PM
    └── 后端老李 ← 同一个人，不同对话，独立记忆
```

- **Agent = 角色配置**（类似 class）：定义技能、性格、工作流
- **Agent in 对话 = 实例**（instance）：独立记忆、独立任务队列
- **同一 Agent 可同时存在于多个对话**，犹如同一个群成员在多个群

## 功能概览

### Agent 系统
- 自然语言一句话创建 Agent（"我要一个资深的 Python 后端..."）
- Agent 属性：角色、技能栈、工作流、性格、权限边界
- 克隆、编辑、调教、暂停、删除
- 每个 Agent 独立记忆，跨对话互不干扰

### 群聊协作
- 用户连续发消息，PM 逐条引用回复
- PM 自动分解需求 → 分发给对应 Agent
- 多 Agent 并行工作，互不阻塞
- 消息类型：文本、代码 Diff、任务卡片、文档卡片、工具调用

### 任务系统
- Agent 单线程，一次专注一个任务，新任务排队
- 三级优先级：普通（队尾）→ 优先（队首）→ 立即（暂停当前）
- 跨 Agent 任务依赖：A 完成 → B 自动唤醒
- 任务看板：进行中 / 队列 / 阻塞 / 暂停 / 已完成

### 工作区隔离
- 对话 = Git 分支（`conv/<id>`）
- Agent 产出 → PM 审核 → 对话分支 → PM 合并到 main
- 冲突时并排对比，用户裁决
- 所有 Agent 不直接写主工作区，防止文件争抢

### 内置工具
- **浏览器**：无头（Agent 后台抓取）+ 有头（右侧面板共览）
- **文档编辑器**：TipTap Block-based，支持代码块/表格/图片/公式
- **视频处理**：FFmpeg 拼接/裁剪/转码/字幕/提取音频
- **自动化**：Cron 定时任务 + 执行日志 + 持久化

### 模型支持
- 接口统一为 **Anthropic API 兼容格式**
- 支持服务商：Anthropic / Kimi / GLM / DeepSeek / MiniMax
- 多服务商切换，Key 本地加密存储
- 未配置时自动降级为离线模拟模式

## 技术架构

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
│  ┌────────▼──────────────────────────────────────┐│
│  │  Sidecar: AG2 Python (Agent Engine, 待引入)    ││
│  └───────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

## 技术栈

| 类别 | 选型 | 说明 |
|------|------|------|
| 桌面框架 | Electron 42+ | 内置 Chromium，原生文件系统 |
| 构建工具 | electron-vite 5 | Vite 驱动，HMR 极速 |
| UI 框架 | React 19 + Shadcn/ui + Tailwind | Claude Desktop 极简风格 |
| 语言 | TypeScript 5.7 | 全栈类型安全 |
| 状态管理 | Zustand 5 | 轻量，Electron 多窗口友好 |
| 持久化 | Dexie.js (IndexedDB) | 项目/Agent/对话/消息/任务全量持久化 |
| 流式渲染 | Vercel AI SDK (@ai-sdk/react) + react-markdown | 一个 Hook 搞定 SSE |
| 代码高亮 | Shiki | VS Code 同款引擎 |
| 编辑器 | Monaco Editor + TipTap | 代码对比 + 文档编辑 |
| 视频 | FFmpeg CLI | 系统级调用 |
| 调度 | croner | 轻量 cron 库 |
| 打包 | electron-builder | macOS/Windows/Linux |
| 自动更新 | electron-updater | GitHub Releases |
| Agent 引擎 | AG2 (AutoGen, 待引入) | 多 Agent 群聊引擎 |
| 工具复用 | OpenCode (submodule, 待引入) | 文件操作/工具执行核心 |

## 快速开始

### 环境要求
- Node.js 18+
- npm 9+
- FFmpeg（可选，用于视频处理）
- Git

### 安装运行

```bash
# 克隆仓库
git clone https://github.com/hhcme/hyclaw.git
cd hyclaw

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

### 配置 API Key

在项目根目录创建 `.env` 文件（或通过应用内的设置弹窗配置）：

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

不配置 API Key 时，应用使用离线模拟模式。

### 打包分发

```bash
npm run build:mac    # macOS (dmg + zip)
npm run build:win    # Windows (nsis + zip)
npm run build:linux  # Linux (AppImage + deb)
npm run build:all    # 全平台
```

## 项目结构

```
hyclaw/
├── src/
│   ├── main/                      # Electron 主进程
│   │   ├── index.ts               # 窗口/托盘/快捷键/自动更新
│   │   ├── api-server.ts          # Anthropic 流式 API 代理
│   │   ├── git-service.ts         # Git 分支隔离
│   │   ├── settings.ts            # 多服务商模型配置
│   │   ├── browser-service.ts     # 无头浏览器
│   │   ├── ffmpeg-service.ts      # 视频处理
│   │   ├── scheduler-service.ts   # Cron 定时任务
│   │   └── ipc-*.ts               # IPC 通道注册
│   ├── preload/                   # 上下文桥接
│   └── renderer/                  # React 渲染进程
│       ├── index.html
│       └── src/
│           ├── App.tsx            # 主布局
│           ├── components/
│           │   ├── ui/            # Shadcn 组件 (Button/Dialog/Input/Select/Textarea)
│           │   ├── chat/          # MessageBubble / QuoteReplyBubble
│           │   ├── agent/         # AgentPanel / AgentCreateDialog / AgentDetailPanel
│           │   ├── task/          # TaskPanel / TaskCard / TaskCreateForm / AutomationPanel
│           │   ├── diff/          # DiffCard / ConflictView
│           │   ├── editor/        # DocumentEditor / DocumentPanel / VideoPanel
│           │   ├── browser/       # BrowserPanel
│           │   └── layout/        # Sidebar / ChatArea / ToolPanel / WelcomeScreen
│           ├── stores/            # Zustand (app + theme)
│           ├── hooks/             # useChatStream / useGitStatus
│           ├── lib/               # db.ts (Dexie) / utils.ts
│           └── types/             # TypeScript 类型定义
├── docs/                          # 设计文档
├── resources/                     # 应用图标
├── electron-builder.yml           # 打包配置
├── electron.vite.config.ts        # 构建配置
└── tailwind.config.ts             # Tailwind 主题
```

## 设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 桌面框架 | Electron | 内置 Chromium（有头浏览器），Monaco 原生支持 |
| UI 框架 | Shadcn/ui + Tailwind | 极简风格可控，AI 编程社区主流，不跟组件库打架 |
| Agent 引擎 | AG2 (AutoGen) | 原生 GroupChat，独立记忆，Python 生态 |
| 流式渲染 | Vercel AI SDK | 一个 useChat Hook 搞定 SSE + 状态 + 滚动 |
| 状态管理 | Zustand | 轻量，Electron 多窗口友好 |
| 模型接口 | 纯 Anthropic API 格式 | Claude/DeepSeek/Kimi/GLM/MiniMax 全部兼容 |
| 工程复用 | OpenCode submodule | 提取工具执行核心，不依赖系统安装，隔离环境 |
| 持久化 | Dexie.js (IndexedDB) | 浏览器原生，无需安装额外数据库 |

## 文档

| 文档 | 内容 |
|------|------|
| [产品设计](docs/product-design.md) | 核心概念、交互模型、功能规划 |
| [技术规划](docs/tech-planning.md) | 架构设计、技术选型、设计决策 |
| [开发计划](docs/development-plan.md) | P0-P8 阶段路线图 |

## License

MIT
