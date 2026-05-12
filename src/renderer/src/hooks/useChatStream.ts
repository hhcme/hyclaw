import { useState, useEffect } from 'react'
import type { Message } from '@/types'

interface UseChatStreamOptions {
  conversationId: string
  onFinish?: (message: Message) => void
}

export function useChatStream({ conversationId, onFinish }: UseChatStreamOptions) {
  const [apiPort, setApiPort] = useState<number>(11451)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    window.electronAPI?.getApiPort?.().then(setApiPort).catch(() => {
      setApiPort(11451)
    }).finally(() => {
      setIsReady(true)
    })
  }, [])

  const sendMessage = async (
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    onToken: (token: string) => void,
    onDone: (fullContent: string) => void
  ) => {
    const apiUrl = `http://127.0.0.1:${apiPort}/api/chat`

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const contentType = response.headers.get('Content-Type') || ''

      if (contentType.includes('text/event-stream')) {
        // AI SDK v3+ data stream protocol
        await readDataStream(response, onToken)
      } else {
        // Plain text fallback (mock mode)
        const text = await response.text()
        // Simulate streaming by sending character by character
        let accumulated = ''
        for (const char of text) {
          accumulated += char
          onToken(char)
          await sleep(10)
        }
      }

      onDone('')
    } catch (err) {
      console.error('[ChatStream] Error:', err)
      onToken('\n\n> ⚠️ 请求失败，请检查 API Key 配置。在项目根目录创建 `.env` 文件并设置 `ANTHROPIC_API_KEY=your-key`')
      onDone('')
    }
  }

  return { sendMessage, isReady, apiPort }
}

async function readDataStream(
  response: Response,
  onToken: (token: string) => void
): Promise<void> {
  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return

        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'text-delta' && parsed.textDelta) {
            onToken(parsed.textDelta)
          }
        } catch {
          // Skip non-JSON data lines (binary chunks from data stream protocol)
          // These are part of the new AI SDK v5+ binary protocol
        }
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
