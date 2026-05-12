import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { useChatStream } from '@/hooks/useChatStream'
import { Send, Loader2, AlertCircle, GitBranch, FileCode } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message, Agent } from '@/types'
import { useGitStatus } from '@/hooks/useGitStatus'
import { DiffCard } from '@/components/diff/DiffCard'

export function ChatArea() {
  const {
    messages,
    agents,
    conversations,
    projects,
    activeProjectId,
    activeConversationId,
    addMessage
  } = useAppStore()

  const conversation = conversations.find((c) => c.id === activeConversationId)
  const conversationAgents = agents.filter((a) => conversation?.agentIds.includes(a.id))

  // Git workspace status
  const workspacePath = activeProjectId
    ? projects.find((p) => p.id === activeProjectId)?.workspacePath
    : undefined
  const { status: gitStatus } = useGitStatus(workspacePath)

  const conversationMessages = activeConversationId
    ? (messages[activeConversationId] ?? [])
    : []

  // Get messages filtered for a specific agent (memory isolation)
  const getAgentContext = useCallback(
    (agentId: string) => {
      const allMsgs = conversationMessages
      if (agentId === pmAgentId) return allMsgs
      return allMsgs.filter(
        (m) =>
          m.agentId === agentId ||
          m.agentId === 'user' ||
          m.role === 'system'
      )
    },
    [conversationMessages]
  )

  const [input, setInput] = useState('')
  const [hasApiKey, setHasApiKey] = useState(true) // assume OK until checked
  const [apiPort, setApiPort] = useState(11451)

  // Check API server status
  useEffect(() => {
    window.electronAPI?.getApiPort?.().then((port) => {
      setApiPort(port)
      fetch(`http://127.0.0.1:${port}/api/health`)
        .then((r) => r.json())
        .then((data) => setHasApiKey(data.hasKey))
        .catch(() => setHasApiKey(true))
    }).catch(() => {})
  }, [])

  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingAgentId, setStreamingAgentId] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const streamingContentRef = useRef('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { sendMessage, isReady } = useChatStream({
    conversationId: activeConversationId ?? ''
  })

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversationMessages, streamingContent])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const getAgent = useCallback(
    (agentId: string): Agent | undefined => agents.find((a) => a.id === agentId),
    [agents]
  )

  const handleSend = async () => {
    if (!input.trim() || !activeConversationId || isStreaming) return

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: activeConversationId,
      agentId: 'user',
      role: 'user',
      content: input.trim(),
      messageType: 'text',
      createdAt: new Date().toISOString()
    }
    addMessage(activeConversationId, userMsg)
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')
    setStreamingAgentId(pmAgentId ?? 'system')
    streamingContentRef.current = ''

    // Handle /diff command - simulate agent code output
    if (input.startsWith('/diff')) {
      setTimeout(() => {
        const diffMsg: Message = {
          id: `msg-${Date.now()}`,
          conversationId: activeConversationId,
          agentId: 'frontend-agent',
          role: 'agent',
          content: '实现了登录页面组件',
          messageType: 'diff',
          metadata: {
            diffs: [
              {
                file: 'src/components/LoginForm.tsx',
                oldContent: '',
                newContent: `import { useState } from 'react'\n\nexport function LoginForm() {\n  const [email, setEmail] = useState('')\n  const [password, setPassword] = useState('')\n\n  const handleSubmit = (e: React.FormEvent) => {\n    e.preventDefault()\n    console.log({ email, password })\n  }\n\n  return (\n    <form onSubmit={handleSubmit} className="space-y-4">\n      <input\n        type="email"\n        value={email}\n        onChange={e => setEmail(e.target.value)}\n        placeholder="邮箱"\n        className="w-full rounded border px-3 py-2"\n      />\n      <input\n        type="password"\n        value={password}\n        onChange={e => setPassword(e.target.value)}\n        placeholder="密码"\n        className="w-full rounded border px-3 py-2"\n      />\n      <button type="submit" className="w-full rounded bg-blue-500 px-4 py-2 text-white">\n        登录\n      </button>\n    </form>\n  )\n}`,
                changeType: 'added' as const
              }
            ]
          },
          createdAt: new Date().toISOString()
        }
        addMessage(activeConversationId, diffMsg)

        // PM review message
        const reviewMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          conversationId: activeConversationId,
          agentId: pmAgentId ?? 'system',
          role: 'agent',
          content: '前端老王提交了 `LoginForm.tsx` 组件，请审核。',
          messageType: 'text',
          createdAt: new Date().toISOString()
        }
        setTimeout(() => addMessage(activeConversationId, reviewMsg), 300)

        setStreamingContent('')
        setStreamingAgentId(null)
        setIsStreaming(false)
      }, 800)
      return
    }

    // Build message history with memory isolation
    const respondingAgentId = pmAgentId ?? ''
    const agentContext = getAgentContext(respondingAgentId)
    const allMessages = [...agentContext, userMsg]
    const llmMessages = allMessages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: (m.role === 'agent' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content
      }))

    await sendMessage(
      llmMessages,
      // onToken - append to streaming content
      (token) => {
        streamingContentRef.current += token
        setStreamingContent((prev) => prev + token)
      },
      // onDone - create the final message
      (fullContent) => {
        const finalContent = fullContent || streamingContentRef.current
        if (finalContent.trim()) {
          const agentMsg: Message = {
            id: `msg-${Date.now()}`,
            conversationId: activeConversationId,
            agentId: pmAgentId ?? 'system',
            role: 'agent',
            content: finalContent,
            messageType: 'text',
            createdAt: new Date().toISOString()
          }
          addMessage(activeConversationId, agentMsg)
        }
        setStreamingContent('')
        setStreamingAgentId(null)
        setIsStreaming(false)
        // Refocus input after response
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const pmAgent = agents.find((a) => a.projectId === activeProjectId && a.name === 'PM')
  const pmAgentId = pmAgent?.id

  // No conversation selected
  if (!activeConversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center p-8">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <span className="text-2xl font-bold text-muted-foreground">WS</span>
        </div>
        <h2 className="mb-2 text-lg font-semibold">{conversation?.name ?? 'Worker Solo'}</h2>
        <p className="max-w-sm text-sm text-muted-foreground mb-4">
          选择一个对话或在左侧创建新对话，开始与 Agent 团队协作。
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="drag-region flex h-12 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {conversation?.name ?? '群聊'}
          </span>
          <span className="text-xs text-muted-foreground/50">
            · {conversationMessages.filter((m) => m.role !== 'system').length} 条消息
          </span>
          {/* Git workspace status */}
          {gitStatus && (
            <div className="flex items-center gap-1 ml-1" title={`分支: ${gitStatus.branch}`}>
              <GitBranch className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-[10px] text-muted-foreground/50">{gitStatus.branch}</span>
              {!gitStatus.clean && (
                <span className="flex items-center gap-0.5 text-[10px] text-yellow-500">
                  <FileCode className="h-2.5 w-2.5" />
                  {gitStatus.files.length}
                </span>
              )}
              {gitStatus.clean && (
                <span className="text-[10px] text-emerald-500/60">✓</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 no-drag">
          {conversationAgents.map((a) => (
            <div
              key={a.id}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-medium text-blue-600 dark:text-blue-400"
              title={a.name}
            >
              {a.name.charAt(0)}
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {conversationMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <span className="text-2xl font-bold text-muted-foreground">WS</span>
              </div>
              <h2 className="mb-2 text-lg font-semibold">Worker Solo</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                多 Agent 协作工作台。输入你的需求，PM Agent 将协调团队完成。
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['分析项目结构', '创建一个 React 组件', '帮我设计数据库', '/diff 演示代码提交'].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => setInput(hint)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent transition-colors"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {conversationMessages.map((msg) => {
            const agent = msg.role === 'agent' ? getAgent(msg.agentId) : undefined
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                agent={agent}
              />
            )
          })}

          {/* Streaming message */}
          {isStreaming && streamingAgentId && (
            <MessageBubble
              message={{
                id: 'streaming',
                conversationId: activeConversationId ?? '',
                agentId: streamingAgentId,
                role: 'agent',
                content: '',
                messageType: 'text',
                createdAt: new Date().toISOString()
              }}
              agent={pmAgent}
              isStreaming
              streamingContent={streamingContent}
            />
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，Enter 发送，Shift+Enter 换行"
            rows={2}
            disabled={isStreaming}
            className="no-drag flex-1 resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            size="icon"
            className="no-drag shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!hasApiKey && (
          <div className="mx-auto mt-2 flex max-w-3xl items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400">
            <AlertCircle className="h-3 w-3" />
            未配置 API Key，使用离线模拟模式。创建 <code className="rounded bg-muted px-1">.env</code> 并设置 <code className="rounded bg-muted px-1">ANTHROPIC_API_KEY</code>
          </div>
        )}
      </div>
    </div>
  )
}
