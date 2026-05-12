import { cn } from '@/lib/utils'
import type { Task, Agent } from '@/types'
import { Play, Pause, Check, X, Clock, AlertTriangle, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/stores/app'

interface TaskCardProps {
  task: Task
  agent?: Agent
  compact?: boolean
}

export function TaskCard({ task, agent, compact }: TaskCardProps) {
  const { startTask, completeTask, pauseTask, cancelTask, agents } = useAppStore()
  const taskAgent = agent ?? agents.find((a) => a.id === task.agentId)

  const priorityLabel = {
    urgent: '🔴 紧急',
    high: '🟡 优先',
    normal: '🔵 普通'
  }[task.priority]

  const statusColors: Record<string, string> = {
    in_progress: 'border-blue-500/50 bg-blue-500/5',
    queued: 'border-border bg-background',
    blocked: 'border-yellow-500/50 bg-yellow-500/5',
    waiting: 'border-orange-500/50 bg-orange-500/5',
    paused: 'border-muted-foreground/30 bg-muted/30',
    review: 'border-purple-500/50 bg-purple-500/5',
    completed: 'border-emerald-500/30 bg-emerald-500/5',
    cancelled: 'border-muted-foreground/20 bg-muted/10'
  }

  const statusDots: Record<string, string> = {
    in_progress: 'bg-blue-500',
    queued: 'bg-muted-foreground/40',
    blocked: 'bg-yellow-500',
    waiting: 'bg-orange-500',
    paused: 'bg-muted-foreground',
    review: 'bg-purple-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-muted-foreground/30'
  }

  const actions: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; action: () => void }[]> = {
    queued: [
      { label: '开始', icon: Play, action: () => startTask(task.id) },
      { label: '取消', icon: X, action: () => cancelTask(task.id) }
    ],
    in_progress: [
      { label: '完成', icon: Check, action: () => completeTask(task.id) },
      { label: '暂停', icon: Pause, action: () => pauseTask(task.id) }
    ],
    paused: [
      { label: '继续', icon: Play, action: () => startTask(task.id) },
      { label: '取消', icon: X, action: () => cancelTask(task.id) }
    ],
    blocked: [],
    waiting: [],
    review: [
      { label: '通过', icon: Check, action: () => completeTask(task.id) }
    ],
    completed: [],
    cancelled: []
  }

  return (
    <div className={cn(
      'group rounded-lg border p-2.5 transition-all hover:border-blue-500/30',
      statusColors[task.status]
    )}>
      {/* Header: status + priority + agent */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={cn('h-2 w-2 rounded-full shrink-0', statusDots[task.status])} />
        <span className="text-xs font-medium text-muted-foreground">
          #{task.id.split('-').pop()}
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          {priorityLabel}
        </span>
        <div className="flex-1" />
        {taskAgent && (
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-medium text-blue-600 dark:text-blue-400"
            title={taskAgent.name}
          >
            {taskAgent.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Title */}
      <div className="text-sm font-medium leading-snug mb-0.5">{task.title}</div>

      {/* Description (non-compact) */}
      {!compact && task.description && (
        <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {task.description}
        </div>
      )}

      {/* Dependencies */}
      {task.dependsOn && task.dependsOn.length > 0 && (
        <div className="mb-2 flex items-center gap-1">
          <Clock className="h-3 w-3 text-yellow-500" />
          <span className="text-[10px] text-yellow-600 dark:text-yellow-400">
            等待 #{task.dependsOn.map((d) => d.split('-').pop()).join(', #')}
          </span>
        </div>
      )}

      {/* Actions */}
      {actions[task.status]?.length > 0 && !compact && (
        <div className="flex gap-1 pt-1 border-t border-border/50">
          {actions[task.status].map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
