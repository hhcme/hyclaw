import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { MessageSquare, Users, FolderKanban, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { SettingsDialog } from '@/components/layout/SettingsDialog'
import { AgentCreateDialog } from '@/components/agent/AgentCreateDialog'
import { Settings } from 'lucide-react'
import { useState } from 'react'
import type { Conversation, Agent } from '@/types'

export function Sidebar() {
  const {
    projects,
    agents,
    conversations,
    activeProjectId,
    activeConversationId,
    sidebarCollapsed,
    setActiveConversation,
    toggleSidebar,
    createConversation,
    setRightPanel,
    setShowProjectSettings
  } = useAppStore()

  const [agentCreateOpen, setAgentCreateOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const activeProject = projects.find((p) => p.id === activeProjectId)
  const projectAgents = agents.filter((a) => a.projectId === activeProjectId)
  const projectConversations = conversations.filter((c) => c.projectId === activeProjectId)

  const handleNewConversation = () => {
    const count = projectConversations.length + 1
    createConversation(`新对话 ${count}`, projectAgents.map((a) => a.id))
  }

  if (sidebarCollapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center bg-muted/30 py-3">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="no-drag">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="mt-4 flex flex-col gap-1">
          {projectConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium',
                conv.id === activeConversationId
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent'
              )}
              title={conv.name}
            >
              {conv.name.charAt(0)}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-64 flex-col bg-muted/30">
      <AgentCreateDialog open={agentCreateOpen} onOpenChange={setAgentCreateOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Header */}
      <div className="drag-region flex h-12 items-center justify-between border-b border-border pl-20 pr-3">
        <button
          onClick={() => setShowProjectSettings(true)}
          className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left no-drag"
        >
          {activeProject?.name ?? 'Worker Solo'}
        </button>
        <div className="flex items-center gap-1 no-drag">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted-foreground">
            <MessageSquare className="mr-1 inline h-3 w-3" />
            对话
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNewConversation}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        {projectConversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            agents={projectAgents}
            isActive={conv.id === activeConversationId}
            onClick={() => setActiveConversation(conv.id)}
          />
        ))}
        {projectConversations.length === 0 && (
          <div className="px-2 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-2">暂无对话</p>
            <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={handleNewConversation}>
              <Plus className="mr-1 h-3 w-3" /> 新建对话
            </Button>
          </div>
        )}

        {/* Agent Pool */}
        <div className="mb-2 mt-4 flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted-foreground">
            <Users className="mr-1 inline h-3 w-3" />
            Agent 池
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAgentCreateOpen(true)}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        {projectAgents.map((agent) => (
          <AgentItem key={agent.id} agent={agent} onClick={() => setRightPanel('agents')} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end border-t border-border p-2 gap-0.5">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSettingsOpen(true)} title="模型设置">
          <Settings className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>
    </div>
  )
}

function ConversationItem({
  conversation,
  agents,
  isActive,
  onClick
}: {
  conversation: Conversation
  agents: Agent[]
  isActive: boolean
  onClick: () => void
}) {
  const convAgents = agents.filter((a) => conversation.agentIds.includes(a.id))
  return (
    <button
      onClick={onClick}
      className={cn(
        'no-drag mb-1 w-full rounded-md px-2 py-1.5 text-left transition-colors',
        isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
      )}
    >
      <div className="text-sm font-medium">{conversation.name}</div>
      <div className="mt-0.5 flex items-center gap-1">
        {convAgents.map((a) => (
          <span
            key={a.id}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary"
            title={a.name}
          >
            {a.name.charAt(0)}
          </span>
        ))}
      </div>
    </button>
  )
}

function AgentItem({ agent, onClick }: { agent: Agent; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="no-drag mb-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 text-left"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-500">
        {agent.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{agent.name}</div>
        <div className="truncate text-xs text-muted-foreground">{agent.role}</div>
      </div>
    </button>
  )
}
