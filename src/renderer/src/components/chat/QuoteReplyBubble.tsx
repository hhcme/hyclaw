import { cn } from '@/lib/utils'
import type { Message, Agent } from '@/types'

interface QuoteReplyProps {
  message: Message
  agent?: Agent
  replyToId: string
  onScrollToMessage?: (messageId: string) => void
}

export function QuoteReplyBubble({
  message,
  agent,
  replyToId,
  onScrollToMessage
}: QuoteReplyProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium select-none',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
        )}
      >
        {isUser ? '我' : (agent?.name ?? 'A').charAt(0)}
      </div>

      <div className={cn('max-w-[80%] min-w-0', isUser && 'items-end')}>
        {!isUser && agent && (
          <div className="mb-1 ml-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            {agent.name}
            {agent.name === 'PM' && (
              <span className="ml-1.5 rounded bg-blue-500/10 px-1 py-0.5 text-[10px]">PM</span>
            )}
          </div>
        )}

        <div
          className={cn(
            'rounded-lg overflow-hidden',
            isUser ? 'bg-primary/90 text-primary-foreground' : 'bg-muted/80'
          )}
        >
          {/* Quoted message preview */}
          <button
            onClick={() => onScrollToMessage?.(replyToId)}
            className={cn(
              'w-full border-b px-3 py-1.5 text-left transition-colors',
              isUser
                ? 'border-primary-foreground/20 bg-primary-foreground/5 hover:bg-primary-foreground/10'
                : 'border-border bg-muted/50 hover:bg-muted'
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className={cn(
                'text-[10px] font-medium',
                isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'
              )}>
                回复
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="truncate text-xs text-muted-foreground">
                点击查看原始消息
              </span>
            </div>
          </button>

          {/* Main content */}
          <div className="px-3 py-2 text-sm leading-relaxed">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  )
}
