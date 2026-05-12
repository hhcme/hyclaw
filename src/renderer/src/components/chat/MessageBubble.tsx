import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message, Agent } from '@/types'
import { Loader2 } from 'lucide-react'
import { DiffCard } from '@/components/diff/DiffCard'

interface MessageBubbleProps {
  message: Message
  agent?: Agent
  isStreaming?: boolean
  streamingContent?: string
}

export function MessageBubble({
  message,
  agent,
  isStreaming,
  streamingContent
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const content = streamingContent ?? message.content

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {content}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-3 group', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium select-none',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
        )}
        title={isUser ? '我' : agent?.name ?? 'Agent'}
      >
        {isUser ? '我' : (agent?.name ?? 'A').charAt(0)}
      </div>

      {/* Content */}
      <div className={cn('max-w-[80%] min-w-0', isUser && 'items-end')}>
        {/* Agent name label */}
        {!isUser && agent && (
          <div className="mb-1 ml-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            {agent.name}
            {agent.name === 'PM' && (
              <span className="ml-1.5 rounded bg-blue-500/10 px-1 py-0.5 text-[10px]">PM</span>
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/80'
          )}
        >
          {isStreaming && !content ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : message.messageType === 'diff' && (message.metadata as any)?.diffs ? (
            <DiffCard diffs={(message.metadata as any).diffs} compact />
          ) : (
            <MarkdownContent content={content} />
          )}
        </div>
      </div>
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const isBlock = (props as any).node?.type === 'element' && (props as any).node?.tagName === 'code'

            if (match && isBlock) {
              return (
                <CodeBlock language={match[1]} code={String(children).replace(/\n$/, '')} />
              )
            }

            return (
              <code className={cn('rounded bg-muted px-1 py-0.5 text-xs font-mono', className)} {...props}>
                {children}
              </code>
            )
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-blue-400 pl-3 italic text-muted-foreground">
                {children}
              </blockquote>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  return (
    <div className="my-2 overflow-hidden rounded-md border border-border">
      <div className="flex items-center justify-between bg-muted px-3 py-1.5">
        <span className="text-xs text-muted-foreground">{language}</span>
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          复制
        </button>
      </div>
      <pre className="overflow-x-auto bg-muted/50 p-3">
        <code className="text-xs font-mono">{code}</code>
      </pre>
    </div>
  )
}
