import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { TaskCard } from '@/components/task/TaskCard'
import { TaskCreateForm } from '@/components/task/TaskCreateForm'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import type { Task, Agent } from '@/types'

interface ColumnDef {
  key: string
  label: string
  icon: string
  color: string
  filter: (t: Task) => boolean
}

const columns: ColumnDef[] = [
  { key: 'in_progress', label: '进行中', icon: '🔄', color: 'text-blue-500', filter: (t) => t.status === 'in_progress' },
  { key: 'queued', label: '队列中', icon: '⏳', color: 'text-muted-foreground', filter: (t) => t.status === 'queued' },
  { key: 'blocked', label: '阻塞/等待', icon: '⏸', color: 'text-yellow-500', filter: (t) => t.status === 'blocked' || t.status === 'waiting' },
  { key: 'paused', label: '已暂停', icon: '⏯', color: 'text-muted-foreground/60', filter: (t) => t.status === 'paused' || t.status === 'review' },
  { key: 'completed', label: '已完成', icon: '✅', color: 'text-emerald-500', filter: (t) => t.status === 'completed' || t.status === 'cancelled' }
]

export function TaskPanel() {
  const { tasks, agents, activeConversationId } = useAppStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const allTasks = activeConversationId ? (tasks[activeConversationId] ?? []) : []

  const toggleCollapse = (key: string) => {
    setCollapsed((c) => ({ ...c, [key]: !c[key] }))
  }

  return (
    <div className="flex h-full flex-col">
      <TaskCreateForm
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-medium">
          任务板 ({allTasks.filter((t) => t.status !== 'cancelled').length})
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCreateOpen(true)}
          title="创建任务"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {columns.map((col) => {
          const colTasks = allTasks.filter(col.filter)
          const isCollapsed = collapsed[col.key]

          return (
            <div key={col.key}>
              {/* Column header */}
              <button
                onClick={() => toggleCollapse(col.key)}
                className="flex w-full items-center gap-1.5 px-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                <span className={col.color}>{col.icon}</span>
                <span>{col.label}</span>
                <span className="text-muted-foreground/40">({colTasks.length})</span>
              </button>

              {/* Tasks */}
              {!isCollapsed && (
                <div className="space-y-1.5">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      compact={col.key === 'completed'}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="py-2 text-center text-[11px] text-muted-foreground/40">
                      暂无
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {allTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-2xl mb-2">📋</span>
            <p className="text-sm text-muted-foreground mb-2">暂无任务</p>
            <p className="text-xs text-muted-foreground/60 mb-3">
              PM 会根据需求自动创建任务
            </p>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-3 w-3" />
              手动创建
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
