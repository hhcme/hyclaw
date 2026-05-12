import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { ProjectCreateDialog } from '@/components/layout/ProjectCreateDialog'
import { Bot, FolderKanban, MessageSquare } from 'lucide-react'
import { useState } from 'react'

export function WelcomeScreen() {
  const { projects } = useAppStore()
  const [createOpen, setCreateOpen] = useState(false)

  if (projects.length > 0) return null

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-muted/30">
      <ProjectCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      <div className="flex flex-col items-center text-center max-w-md px-8">
        {/* Logo */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-background border border-border/50 shadow-sm">
          <Bot className="h-10 w-10 text-blue-500" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Worker Solo</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm">
          多 Agent 协作的编程工作台。以群聊模式驱动多个 AI Agent 协作完成开发任务。
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8 w-full">
          <div className="flex flex-col items-center gap-2 rounded-xl bg-background border border-border/50 p-4">
            <FolderKanban className="h-6 w-6 text-blue-500" />
            <span className="text-xs font-medium">项目管理</span>
            <span className="text-[10px] text-muted-foreground text-center">一个项目一个工作区</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl bg-background border border-border/50 p-4">
            <Bot className="h-6 w-6 text-emerald-500" />
            <span className="text-xs font-medium">Agent 团队</span>
            <span className="text-[10px] text-muted-foreground text-center">自然语言创建角色</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl bg-background border border-border/50 p-4">
            <MessageSquare className="h-6 w-6 text-purple-500" />
            <span className="text-xs font-medium">群聊协作</span>
            <span className="text-[10px] text-muted-foreground text-center">多 Agent 并行工作</span>
          </div>
        </div>

        <Button size="lg" onClick={() => setCreateOpen(true)} className="px-8">
          <FolderKanban className="mr-2 h-5 w-5" />
          新建项目
        </Button>
      </div>
    </div>
  )
}
