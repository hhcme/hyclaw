import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'
import { Globe, ListTodo, FileText, Users, Video as VideoIcon, Clock } from 'lucide-react'
import { AgentPanel } from '@/components/agent/AgentPanel'
import { TaskPanel } from '@/components/task/TaskPanel'
import { BrowserPanel } from '@/components/browser/BrowserPanel'
import { DocumentPanel } from '@/components/editor/DocumentPanel'
import { VideoPanel } from '@/components/editor/VideoPanel'
import { AutomationPanel } from '@/components/task/AutomationPanel'

const panels = [
  { id: 'browser' as const, icon: Globe, label: '浏览器' },
  { id: 'tasks' as const, icon: ListTodo, label: '任务' },
  { id: 'agents' as const, icon: Users, label: 'Agent' },
  { id: 'editor' as const, icon: FileText, label: '文档' },
  { id: 'video' as const, icon: VideoIcon, label: '视频' },
  { id: 'automation' as const, icon: Clock, label: '自动化' }
]

export function ToolPanel() {
  const { rightPanel, setRightPanel, activeConversationId } = useAppStore()

  return (
    <div className="flex h-full">
      {/* Icon bar - always visible, sticks to right edge */}
      <div className="flex h-full w-12 shrink-0 flex-col items-center border-l border-border bg-muted/30 py-2 order-last">
        {panels.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setRightPanel(rightPanel === id ? null : id)}
            className={cn(
              'no-drag mb-1 flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
              rightPanel === id
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Panel content - slides in */}
      {rightPanel && (
        <div className="h-full w-80 shrink-0 border-l border-border bg-background overflow-hidden">
          {rightPanel === 'browser' && <BrowserPanel />}
          {rightPanel === 'agents' && <AgentPanel conversationId={activeConversationId ?? undefined} />}
          {rightPanel === 'tasks' && <TaskPanel />}
          {rightPanel === 'editor' && <DocumentPanel />}
          {rightPanel === 'video' && <VideoPanel />}
          {rightPanel === 'automation' && <AutomationPanel />}
        </div>
      )}
    </div>
  )
}
