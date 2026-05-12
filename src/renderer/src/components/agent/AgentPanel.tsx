import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Pencil, Trash2, Copy, Bot, Code, Palette, Database, Wrench, Brain } from 'lucide-react'
import type { Agent } from '@/types'
import { useState } from 'react'
import { AgentCreateDialog } from './AgentCreateDialog'
import { AgentDetailPanel } from './AgentDetailPanel'

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  '前端': Code,
  '后端': Database,
  '设计': Palette,
  '测试': Wrench,
  '运维': Wrench,
  '数据': Brain,
  '产品': Bot
}

function getAgentIcon(agent: Agent) {
  for (const [key, Icon] of Object.entries(roleIcons)) {
    if (agent.role.includes(key)) return Icon
  }
  return Bot
}

interface AgentPanelProps {
  conversationId?: string
}

export function AgentPanel({ conversationId }: AgentPanelProps) {
  const { agents, activeProjectId, conversations, addAgentToConversation, removeAgentFromConversation, deleteAgent } = useAppStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [detailAgentId, setDetailAgentId] = useState<string | null>(null)

  const projectAgents = agents.filter((a) => a.projectId === activeProjectId)
  const conversation = conversations.find((c) => c.id === conversationId)
  const conversationAgentIds = conversation?.agentIds ?? []

  if (detailAgentId) {
    const agent = projectAgents.find((a) => a.id === detailAgentId)
    if (!agent) return null
    return (
      <AgentDetailPanel
        agent={agent}
        onBack={() => setDetailAgentId(null)}
        onDelete={(id) => { deleteAgent(id); setDetailAgentId(null) }}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <AgentCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-sm font-medium">
          Agent 池 ({projectAgents.length})
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCreateOpen(true)}>
          <span className="text-lg leading-none">+</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {projectAgents.map((agent) => {
          const Icon = getAgentIcon(agent)
          const inConversation = conversationAgentIds.includes(agent.id)
          const isPM = agent.name === 'PM'

          return (
            <div
              key={agent.id}
              className={cn(
                'group rounded-md border border-transparent hover:border-border hover:bg-accent/30 transition-all',
                inConversation && 'border-blue-500/20 bg-blue-500/5'
              )}
            >
              <div className="flex items-center gap-3 p-2.5">
                <button
                  onClick={() => setDetailAgentId(agent.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400"
                >
                  <Icon className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => setDetailAgentId(agent.id)}
                    className="block text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{agent.name}</span>
                      {isPM && (
                        <span className="shrink-0 rounded bg-blue-500/10 px-1 py-0.5 text-[10px] font-medium text-blue-500">
                          PM
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{agent.role}</div>
                  </button>

                  {agent.skills.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {agent.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {skill}
                        </span>
                      ))}
                      {agent.skills.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{agent.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {conversationId && !isPM && (
                  <button
                    onClick={() => {
                      if (inConversation) {
                        removeAgentFromConversation(conversationId, agent.id)
                      } else {
                        addAgentToConversation(conversationId, agent.id)
                      }
                    }}
                    className={cn(
                      'shrink-0 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                      inConversation
                        ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {inConversation ? '已在群' : '拉入群'}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {projectAgents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bot className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">还没有自定义 Agent</p>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              创建第一个 Agent
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
