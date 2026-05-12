import { useState } from 'react'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AgentCreateDialog } from '@/components/agent/AgentCreateDialog'
import { AgentDetailPanel } from '@/components/agent/AgentDetailPanel'
import { ArrowLeft, FolderKanban, Settings, Users, Bot, Code, Database, Palette, Wrench, Brain, Plus, Pencil, Trash2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Agent } from '@/types'

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  '前端': Code, '后端': Database, '设计': Palette, '测试': Wrench,
  '运维': Wrench, '数据': Brain, '产品': Bot
}

function getAgentIcon(agent: Agent) {
  for (const [key, Icon] of Object.entries(roleIcons)) {
    if (agent.role.includes(key)) return Icon
  }
  return Bot
}

export function ProjectSettingsPage() {
  const {
    projects, agents, activeProjectId,
    setShowProjectSettings, updateAgent, deleteAgent, cloneAgent
  } = useAppStore()
  const [agentCreateOpen, setAgentCreateOpen] = useState(false)
  const [detailAgentId, setDetailAgentId] = useState<string | null>(null)

  const project = projects.find((p) => p.id === activeProjectId)
  const projectAgents = agents.filter((a) => a.projectId === activeProjectId)

  if (detailAgentId) {
    const agent = projectAgents.find((a) => a.id === detailAgentId)
    if (!agent) return null
    return (
      <div className="flex h-full flex-col">
        <AgentDetailPanel
          agent={agent}
          onBack={() => setDetailAgentId(null)}
          onDelete={(id) => { deleteAgent(id); setDetailAgentId(null) }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <AgentCreateDialog open={agentCreateOpen} onOpenChange={setAgentCreateOpen} />

      {/* Header */}
      <div className="drag-region flex h-12 items-center gap-3 border-b border-border px-4">
        <Button variant="ghost" size="icon" className="h-8 w-8 no-drag" onClick={() => setShowProjectSettings(false)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Settings className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">项目设置</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl p-6 space-y-8">
          {/* Project Info */}
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              项目信息
            </h3>
            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">项目名称</label>
                <Input
                  defaultValue={project?.name}
                  className="text-sm"
                  placeholder="项目名称"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">工作目录</label>
                <div className="relative">
                  <FolderKanban className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    defaultValue={project?.workspacePath}
                    className="pl-8 text-xs font-mono"
                    placeholder="项目目录路径"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Agent Pool */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-muted-foreground" />
                Agent 成员 ({projectAgents.length})
              </h3>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setAgentCreateOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                添加 Agent
              </Button>
            </div>

            {projectAgents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                <Bot className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground mb-3">还没有自定义 Agent</p>
                <Button variant="outline" size="sm" onClick={() => setAgentCreateOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  创建第一个 Agent
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {projectAgents.map((agent) => {
                  const Icon = getAgentIcon(agent)
                  const isPM = agent.name === 'PM'

                  return (
                    <div key={agent.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-border/80 transition-colors">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Icon className="h-5 w-5" />
                      </div>

                      <button
                        onClick={() => !isPM && setDetailAgentId(agent.id)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{agent.name}</span>
                          {isPM && (
                            <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-500">
                              PM · 系统
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{agent.role}</div>
                        {agent.skills.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {agent.skills.slice(0, 5).map((s) => (
                              <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{s}</span>
                            ))}
                          </div>
                        )}
                      </button>

                      {!isPM && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailAgentId(agent.id)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => cloneAgent(agent.id)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500" onClick={() => deleteAgent(agent.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
