import { useState } from 'react'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskCreateForm({ open, onOpenChange }: Props) {
  const { activeConversationId, agents, activeProjectId, addTask } = useAppStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('normal')
  const [assignedAgentId, setAssignedAgentId] = useState('')

  const projectAgents = agents.filter((a) => a.projectId === activeProjectId)

  const handleSubmit = () => {
    if (!title.trim() || !activeConversationId) return
    addTask(activeConversationId, {
      id: `task-${Date.now()}`,
      conversationId: activeConversationId,
      agentId: assignedAgentId || projectAgents[0]?.id || '',
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'queued',
      dependsOn: [],
      createdAt: new Date().toISOString()
    })
    setTitle(''); setDescription(''); setPriority('normal'); setAssignedAgentId('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">创建任务</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
            placeholder="任务标题"
            autoFocus
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="描述（可选）"
            rows={2}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">优先级</label>
              <div className="flex gap-1">
                {(['normal', 'high', 'urgent'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cn(
                      'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                      priority === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {{ normal: '普通', high: '优先', urgent: '紧急' }[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">分配给</label>
            <Select value={assignedAgentId} onValueChange={setAssignedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="自动分配" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">自动分配</SelectItem>
                {projectAgents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} ({a.role})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>取消</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!title.trim()}>创建</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
