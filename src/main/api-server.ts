import http from 'node:http'
import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { getActiveProvider } from './settings'

const PORT = 11451

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
}

const SYSTEM_PROMPT = `你是 Worker Solo 的 PM Agent（产品经理），负责协调项目中的 Agent 团队完成用户需求。

你的职责：
1. 理解用户需求，将其分解为可执行的任务
2. 将任务分发给合适的 Agent（当对话中有其他 Agent 时）
3. 审核 Agent 的产出，合并代码变更
4. 处理文件冲突
5. 定期向用户汇报进度

你的性格：沉稳、简洁、专业。先分析问题，再给出方案。
回复格式：使用 Markdown，代码使用语言标记的代码块（如 \`\`\`typescript）。`

function createServer(): http.Server {
  return http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    if (req.method === 'GET' && req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'ok',
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        hasKey: !!process.env.ANTHROPIC_API_KEY
      }))
      return
    }

    if (req.method === 'POST' && req.url === '/api/chat') {
      try {
        const body = await readBody(req)
        const { messages } = JSON.parse(body) as ChatRequest
        const active = getActiveProvider()

        if (!active || !active.apiKey) {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.write(getMockResponse(messages))
          res.end()
          return
        }

        const model = createAnthropic({
          apiKey: active.apiKey,
          baseURL: active.baseURL
        })(active.model)

        const result = streamText({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages
          ]
        })

        // Stream as SSE with simple text-delta format
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        })

        for await (const chunk of result.textStream) {
          res.write(`data: ${JSON.stringify({ type: 'text-delta', textDelta: chunk })}\n\n`)
        }

        res.write(`data: [DONE]\n\n`)
        res.end()
      } catch (err) {
        console.error('[API] Chat error:', err)
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.write(getMockResponseLast())
        res.end()
      }
      return
    }

    res.writeHead(404)
    res.end('Not found')
  })
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function getMockResponse(messages: ChatRequest['messages']): string {
  const lastMsg = messages[messages.length - 1]
  if (!lastMsg) return '你好！我是 PM Agent，有什么可以帮你的？'

  const content = lastMsg.content.toLowerCase()

  if (content.includes('代码') || content.includes('写') || content.includes('实现')) {
    return `好的，我来分析这个需求。

## 需求分析
这是一个代码实现任务，我将按以下步骤处理：

1. **理解需求**：明确需要实现的功能和边界
2. **设计方案**：选择合适的技术方案
3. **分解任务**：将大任务拆分为小任务

\`\`\`typescript
// 示例代码结构
interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  assignee: string
}
\`\`\`

> 💡 当前对话中只有我一个 PM Agent。如需其他 Agent 协助（如前端、后端、测试），你可以随时创建。

需要我开始详细设计吗？`
  }

  if (content.includes('项目') || content.includes('结构') || content.includes('架构')) {
    return `我来分析一下项目结构。

当前项目使用 **Electron + React + TypeScript** 技术栈，主要目录：

- \`src/main/\` - Electron 主进程
- \`src/renderer/\` - React 渲染进程
- \`src/preload/\` - 预加载脚本

建议按照功能模块继续组织代码，保持关注点分离。`
  }

  return `收到你的消息。作为 PM Agent，我来分析：

## 理解
你提到了关于「${lastMsg.content.slice(0, 30)}${lastMsg.content.length > 30 ? '...' : ''}」的内容。

## 下一步
我可以帮你：
- 📋 分解为具体任务
- 🔍 分析技术方案
- 👥 协调 Agent 团队（如有需要）

请告诉我你希望我从哪个方向入手？`
}

function getMockResponseLast(): string {
  return '抱歉，请求处理过程中出现了问题。请检查 API Key 配置后重试。'
}

let server: http.Server | null = null

export function startApiServer(): number {
  if (server) return PORT
  server = createServer()
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[WorkerSolo] API server → http://127.0.0.1:${PORT}`)
  })
  return PORT
}

export function stopApiServer(): void {
  if (server) {
    server.close()
    server = null
  }
}

export function getApiPort(): number {
  return PORT
}
