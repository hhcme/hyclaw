# Worker Solo

多 Agent 协作的编程工作台。以项目管理的视角组织 AI Agent，以群聊模式驱动多 Agent 协作开发。

## 文档

| 文档 | 内容 |
|------|------|
| [产品设计](docs/product-design.md) | 核心概念、交互模型、功能规划 |
| [技术规划](docs/tech-planning.md) | 架构设计、技术选型、目录结构 |
| [开发计划](docs/development-plan.md) | 分阶段开发路线图 |

## 技术栈

- **桌面端**: Electron + React 19 + TypeScript
- **构建**: electron-vite (Vite 驱动)
- **UI**: Shadcn/ui + Tailwind CSS + lucide-react
- **流式渲染**: Vercel AI SDK (@ai-sdk/react) + streamdown + Shiki
- **状态管理**: Zustand
- **Agent 引擎**: AG2 (AutoGen) Python Sidecar
- **模型**: Anthropic API 兼容 (Claude / DeepSeek / etc.)

## 快速开始

```bash
npm install
npm run dev
```

## 项目结构

```
worker-solo/
├── src/
│   ├── main/          # Electron 主进程
│   ├── preload/       # 预加载脚本
│   └── renderer/      # React 渲染进程
│       ├── index.html
│       └── src/
│           ├── components/
│           │   ├── ui/        # Shadcn 组件
│           │   ├── chat/      # 聊天消息
│           │   ├── agent/     # Agent 管理
│           │   ├── layout/    # 布局组件
│           │   └── ...
│           ├── stores/        # Zustand
│           ├── hooks/
│           ├── lib/
│           └── types/
├── agent-engine/       # AG2 Python Sidecar (待引入)
├── vendor/             # OpenCode submodule (待引入)
└── docs/               # 项目文档
```
