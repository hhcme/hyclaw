# Worker Solo - 技术规划文档

## 一、总体架构

```
┌──────────────────────────────────────────────────────┐
│                   Electron Shell                      │
│  ┌────────────────────┐  ┌─────────────────────────┐ │
│  │   Main Process      │  │   Renderer Process       │ │
│  │   - 文件系统管理     │  │   - React UI             │ │
│  │   - Git 操作        │  │   - 群聊界面             │ │
│  │   - 子进程管理       │  │   - 文档/代码编辑器       │ │
│  │   - IPC 桥接        │  │   - 任务面板              │ │
│  │   - 原生弹窗/菜单    │  │                          │ │
│  └─────────┬──────────┘  └──────────────────────────┘ │
│            │                                           │
│  ┌─────────▼──────────────────────────────────────┐   │
│  │              Sidecar 进程                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │   │
│  │  │ AG2      │ │ Playwright│ │ FFmpeg         │  │   │
│  │  │ Agent    │ │ Browser  │ │ Video Process  │  │   │
│  │  │ Engine   │ │ Sandbox  │ │                │  │   │
│  │  └──────────┘ └──────────┘ └────────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

## 二、桌面端

### 框架：Electron + electron-vite

| 选型 | 理由 |
|------|------|
| **Electron** | 成熟的桌面端方案，内置 Chromium（满足有头浏览器需求），Node 侧文件系统/Git 操作原生 |
| **electron-vite** | Vite 驱动的 Electron 构建工具，HMR 快，比 electron-forge 轻 |
| **electron-builder** | 打包分发 |

### 多窗口策略

| 窗口 | 用途 |
|------|------|
| 主窗口 | 群聊界面（核心） |
| BrowserView | 有头浏览器嵌入（右侧面板内） |
| 独立浏览器窗口 | 弹出式有头浏览器 |
| Diff 浮窗 | 代码对比弹出窗口 |

### Main Process 职责

- Git 仓库管理（isomorphic-git 或 exec git CLI）
- 文件系统操作（项目目录监控、文件读写）
- Sidecar 进程生命周期管理（AG2 Python 进程、FFmpeg）
- Playwright 无头浏览器管理（通过 Node API 或子进程）
- 系统通知、托盘
- 自动更新

### Renderer Process 职责

- React UI 渲染
- 群聊消息流、消息卡片
- Agent 管理面板
- 任务队列界面
- 文档编辑器（TipTap）
- 代码预览/diff（Monaco Editor）
- 与 Main Process IPC 通信

## 三、前端技术栈

### 核心

| 技术 | 选型 | 理由 |
|------|------|------|
| 框架 | **React 18+** | 生态最大，Electron 集成最成熟 |
| 语言 | **TypeScript** | 必选 |
| UI 组件 | **Shadcn/ui + Tailwind CSS** | 极简风格，可定制，代码自有 |
| 图标 | **lucide-react** | 线性图标，风格匹配 |

### 布局

| 需求 | 方案 |
|------|------|
| 三栏布局 | `react-resizable-panels`（可拖拽分割面板） |
| 标签页 | `@radix-ui/react-tabs` |
| 抽屉/侧拉 | Shadcn Sheet |
| 弹出层 | Shadcn Dialog / Popover |
| 右键菜单 | `@radix-ui/react-context-menu` |

### 编辑器 & 渲染

| 需求 | 方案 |
|------|------|
| 代码查看/diff | **Monaco Editor**（VS Code 同款） |
| 文档编辑 | **TipTap**（基于 ProseMirror，Block-based） |
| 流式 Markdown 渲染 | **streamdown**（流式感知） + **Shiki**（代码高亮），详见"聊天核心"章节 |
| 静态 Markdown 渲染 | **react-markdown** + **rehype** 插件 |

### 状态管理

| 需求 | 方案 |
|------|------|
| 全局状态 | **Zustand**（轻量，适合 Electron 多窗口） |
| 服务端状态 | **TanStack Query**（Agent API 调用缓存） |
| 持久化 | **Dexie.js**（IndexedDB 封装，项目/对话/Agent 配置本地存储） |
| 实时通信 | SSE / WebSocket（与 Sidecar AG2 进程通信） |

### 聊天核心：流式渲染栈

流式渲染的核心难点不是"打字机效果"，而是**流式 Markdown 解析**——LLM 逐 token 输出时，Markdown 语法总是处于不完整状态（`**bold` 无闭合、`​```js` 代码块未结束），普通 Markdown 渲染器会崩溃。

因此采用四层管线，全部 MIT 开源、万星级别：

| 层 | 库 | GitHub Stars | 解决什么 |
|---|-----|-------------|---------|
| SSE 连接 + 消息状态 | **Vercel AI SDK** (`ai`) | 10k+ | `useChat` Hook：SSE 连接管理、消息数组流式更新、loading/error/abort、自动滚动、tool call 解析 |
| 流式 Markdown 渲染 | **streamdown** | 1k+ | 边收 token 边渲染，优雅处理不完整 Markdown 语法 |
| 代码语法高亮 | **Shiki** | 10k+ | VS Code 同款引擎，支持流式增量高亮 |
| 虚拟滚动 | **react-virtuoso** | 13k+ | 聊天场景专用虚拟列表，万条消息不卡 |
| Markdown 最终渲染 | **react-markdown** | 14k+ | 非流式消息的完整 Markdown 渲染 |

### 消息渲染架构

```
react-virtuoso (虚拟列表)
  └─ 消息卡片（自研 Shadcn）
       ├─ 文本消息 → streamdown (流式 Markdown) + Shiki (代码高亮)
       ├─ 引用回复卡片 → 自研
       ├─ Diff 卡片 → Monaco Editor Diff
       ├─ 任务卡片 → 自研
       ├─ 文档卡片 → TipTap
       └─ 工具调用卡片 → 自研
```

### 消息类型

| 类型 | 渲染方式 | 说明 |
|------|---------|------|
| 文本消息 | streamdown + Shiki | 流式 Markdown，代码自动高亮 |
| 引用回复卡片 | Shadcn 自定义 | 引用原始消息，嵌套展示 |
| Diff 卡片 | Monaco DiffEditor | 代码改动对比 |
| 任务卡片 | Shadcn 自定义 | 状态、进度、依赖关系 |
| 文档卡片 | TipTap 只读预览 | Block-based 文档 |
| 工具调用卡片 | Shadcn 自定义 | Agent 工具调用的折叠展示 |

## 四、Agent 引擎

### 框架：AG2 (AutoGen)

```
Fork AG2 → 保持 upstream 同步
扩展点（不修改核心，用 plugin 模式）：
  - PMAgent：继承 AssistantAgent，增加任务分发/代码合并逻辑
  - GroupChat：扩展为带引用回复的群聊模型
  - Memory：每 Agent 独立向量记忆（LanceDB）
  - Tool：统一文件操作走 PM 代理的工具注册
```

### Sidecar 通信

```
Electron Main Process
    │
    ├── spawn: AG2 Python 进程（HTTP Server / WebSocket）
    │     └── 每个对话一个独立的 Agent 运行时
    │
    ├── spawn: Playwright Server
    │     └── 无头浏览器实例池
    │
    └── spawn: FFmpeg（按需启动，用完即关）
```

### 记忆方案

| 层级 | 存储 | 内容 |
|------|------|------|
| Agent 角色定义 | Dexie（本地） | 系统提示词、技能、性格 |
| 对话上下文 | 对话窗口内消息历史 | 完整对话记录 |
| 长期记忆 | LanceDB（嵌入式向量库） | 项目架构、重要决策摘要 |
| 代码索引 | 项目文件树 + 正则索引 | 函数/类定义位置 |

## 五、功能模块技术选型

### 浏览器

| 模式 | 实现 |
|------|------|
| 无头（Agent 用） | Playwright 作为 Sidecar，Node API 控制 |
| 有头（用户用） | Electron BrowserView 嵌入右侧面板 |

### 文件工作区（Git 层）

| 操作 | 实现 |
|------|------|
| Git 操作 | **isomorphic-git**（纯 JS，不依赖系统 git）或直接 exec `git` CLI |
| Diff 生成 | isomorphic-git diff / 或 Monaco 内置 diff |
| 文件监听 | **chokidar**（Main Process 监听文件变化） |
| 分支管理 | 每个对话自动创建分支 `conv/<conversation-id>` |

### 视频编辑

| 操作 | 实现 |
|------|------|
| 核心引擎 | **FFmpeg**（作为 Sidecar 二进制分发） |
| 调用方式 | Node `child_process.exec` 拼 FFmpeg 命令 |
| 预览 | Electron `<video>` 标签播放输出文件 |

### 自动化 & 定时任务

| 需求 | 方案 |
|------|------|
| 消息队列 | **BullMQ** + Redis（或轻量替代 **better-queue**） |
| 定时触发 | **node-cron** 或 **croner** |
| 工作流引擎 | **n8n**（可选深度集成，嵌入 n8n 作为可视化工作流编辑器） |
| 持久化 | SQLite（任务历史） |

### 本地数据存储

| 存储 | 用途 | 方案 |
|------|------|------|
| IndexedDB | 项目配置、Agent 定义、对话列表 | Dexie.js |
| SQLite | 任务历史、自动化日志 | better-sqlite3 |
| 文件系统 | 项目代码 | 直接读写 |
| LanceDB | Agent 向量记忆 | 嵌入式向量库 |

## 六、项目目录结构（规划）

```
worker-solo/
├── electron/              # Electron Main Process
│   ├── main.ts
│   ├── preload.ts
│   ├── ipc/               # IPC 通道定义
│   ├── git/               # Git 操作封装
│   ├── sidecar/           # Sidecar 进程管理
│   └── services/          # 文件系统、通知等服务
│
├── src/                   # React Renderer
│   ├── App.tsx
│   ├── layouts/           # 主布局（三栏）
│   ├── components/
│   │   ├── ui/            # Shadcn 组件
│   │   ├── chat/          # 聊天消息、消息卡片
│   │   ├── agent/         # Agent 管理面板
│   │   ├── task/          # 任务面板
│   │   ├── editor/        # TipTap 编辑器
│   │   ├── browser/       # 嵌入式浏览器
│   │   ├── diff/          # Monaco Diff 视图
│   │   └── project/       # 项目管理
│   ├── stores/            # Zustand 状态
│   ├── hooks/             # 自定义 Hooks
│   ├── lib/               # 工具函数
│   └── types/             # TypeScript 类型
│
├── agent-engine/          # AG2 Fork (Python)
│   ├── pm_agent.py
│   ├── tool_merger.py
│   └── memory/
│
├── resources/             # 静态资源
│   └── ffmpeg/            # FFmpeg 二进制
│
├── electron-builder.yml   # 打包配置
├── package.json
└── tailwind.config.ts
```

## 七、上游同步策略

| 开源项目 | 集成方式 | 同步策略 |
|----------|----------|----------|
| AG2 | Fork + Sidecar | `upstream/main` rebase，不改核心，在 plugin 层扩展 |
| Shadcn/ui | 直接依赖 | cli update 命令，不改组件核心逻辑 |
| TipTap | npm 依赖 | 版本跟随，扩展用自定义 extension |
| Monaco Editor | npm 依赖 | 版本跟随 |
| Playwright | npm 依赖 | 版本跟随 |
| FFmpeg | 二进制分发 | 跟随官方 release，替换二进制 |
| n8n | 可选嵌入 | Fork，自定义节点用 community node 规范 |

## 八、关键设计决策

### 为什么 Electron 而不是 Tauri

1. Electron 内置 Chromium = 天然的有头浏览器
2. Monaco Editor 在 Web 环境原生支持（Tauri 需要额外处理）
3. AG2 Sidecar 是 Python 进程，Tauri Rust 侧没有优势
4. Electron 生态成熟，插件和工具链丰富

### 为什么 Shadcn/ui 而不是 Ant Design

1. Claude Desktop 极简风用 Tailwind 直接写出来，不跟组件库打架
2. 聊天类应用高度定制，通用组件库反而限制多
3. Shadcn 代码在项目里，随时改源码
4. AI 编程工具社区主流选型，生态活跃

### 为什么 Zustand 而不是 Redux

1. 极轻，API 简单
2. Electron 多窗口场景更友好
3. 不需要 Redux 中间件生态（没有复杂的异步流）

### OpenCode 隔离嵌入方案

采用 **Git Submodule** 方式将 OpenCode 源码嵌入项目，不依赖系统全局安装：

```
worker-solo/
├── vendor/
│   └── opencode/          ← git submodule，Fork 自 anomalyco/opencode
└── src/
    └── main/
        └── agent/         ← 提取 OpenCode 核心模块：工具执行 / 文件操作 / Git
```

- 不装全局 `opencode`，不碰系统 PATH
- 只 import OpenCode 的核心逻辑模块（工具执行、对话管理），不跑 CLI
- 所有文件操作在项目 workspace 内，不越界
- 更新：`git submodule update --remote`，保持跟上游同步
- 引入时机：P4 阶段（工作区隔离），P0-P3 阶段先用 Mock

### 为什么用 Anthropic API 兼容

1. Claude (Anthropic) 是目前公认最强的编程模型
2. DeepSeek / OpenAI / Groq 等主流模型都已适配 Anthropic Messages API 格式
3. `@ai-sdk/anthropic` + `@ai-sdk/openai` 双 Provider 覆盖所有模型
4. 用户可自由切换模型，不锁定厂商
