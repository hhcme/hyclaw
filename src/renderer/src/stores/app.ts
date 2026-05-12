import { create } from 'zustand'
import type { Project, Agent, Conversation, Message, Task } from '@/types'
import { hydrateFromDB, saveProject, saveAgent, saveConversation, saveMessage, saveTask, saveActiveProject, saveActiveConversation } from '@/lib/db'

interface AppState {
  projects: Project[]
  agents: Agent[]
  conversations: Conversation[]
  messages: Record<string, Message[]>
  tasks: Record<string, Task[]>
  activeProjectId: string | null
  activeConversationId: string | null
  sidebarCollapsed: boolean
  rightPanel: 'browser' | 'tasks' | 'agents' | 'editor' | 'video' | 'automation' | null
  showProjectSettings: boolean

  setActiveProject: (id: string) => void
  setActiveConversation: (id: string) => void
  toggleSidebar: () => void
  setRightPanel: (panel: AppState['rightPanel']) => void
  setShowProjectSettings: (show: boolean) => void
  addMessage: (conversationId: string, message: Message) => void
  addTask: (conversationId: string, task: Task) => void
  updateTaskStatus: (taskId: string, status: Task['status']) => void
  startTask: (taskId: string) => void
  completeTask: (taskId: string) => void
  pauseTask: (taskId: string) => void
  cancelTask: (taskId: string) => void
  addAgent: (agent: Agent) => void
  updateAgent: (id: string, data: Partial<Agent>) => void
  deleteAgent: (id: string) => void
  cloneAgent: (id: string) => void
  addAgentToConversation: (conversationId: string, agentId: string) => void
  removeAgentFromConversation: (conversationId: string, agentId: string) => void
  createProject: (name: string, workspacePath: string) => void
  createConversation: (name: string, agentIds: string[]) => void
  hydrate: () => Promise<void>
}

function pmAgent(projectId: string): Agent {
  return {
    id: `pm-${projectId}`, projectId, name: 'PM', role: '产品经理 / 主 Agent',
    systemPrompt: '你是项目的产品经理，负责协调所有 Agent 完成用户需求。',
    skills: ['任务分解', '代码合并', '冲突仲裁'], personality: '沉稳',
    workflow: '先分析 → 分解 → 分发 → 审核 → 合并', createdAt: new Date().toISOString()
  }
}

export const useAppStore = create<AppState>((set) => ({
  projects: [],
  agents: [],
  conversations: [],
  messages: {},
  tasks: {},
  activeProjectId: null,
  activeConversationId: null,
  sidebarCollapsed: false,
  rightPanel: null,
  showProjectSettings: false,

  hydrate: async () => {
    const data = await hydrateFromDB()
    set(data)
  },

  setActiveProject: (id) => { set({ activeProjectId: id }); saveActiveProject(id) },
  setActiveConversation: (id) => { set({ activeConversationId: id }); saveActiveConversation(id) },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setRightPanel: (panel) => set({ rightPanel: panel }),
  setShowProjectSettings: (show) => set({ showProjectSettings: show }),

  addMessage: (cid, msg) =>
    set((s) => { saveMessage(msg); return { messages: { ...s.messages, [cid]: [...(s.messages[cid] || []), msg] } } }),

  addTask: (cid, task) =>
    set((s) => { saveTask(task); return { tasks: { ...s.tasks, [cid]: [...(s.tasks[cid] || []), task] } } }),

  updateTaskStatus: (taskId, status) =>
    set((s) => {
      const updated: Record<string, Task[]> = {}
      let ccid = ''
      for (const [cid, tasks] of Object.entries(s.tasks)) {
        updated[cid] = tasks.map((t) => {
          if (t.id === taskId) {
            if (status === 'completed') ccid = cid
            const ut = { ...t, status }; saveTask(ut); return ut
          }
          return t
        })
      }
      if (status === 'completed' && ccid) {
        updated[ccid] = updated[ccid].map((t) => {
          if (t.status === 'blocked' && t.dependsOn?.includes(taskId)) {
            const ok = (t.dependsOn || []).every((d) => updated[ccid].find((x) => x.id === d)?.status === 'completed')
            const ut = ok ? { ...t, status: 'queued' as const } : t; if (ok) saveTask(ut); return ut
          }
          return t
        })
      }
      return { tasks: updated }
    }),

  startTask: (taskId) =>
    set((s) => {
      const updated: Record<string, Task[]> = {}; let aid = ''
      for (const [cid, ts] of Object.entries(s.tasks)) {
        const tgt = ts.find((t) => t.id === taskId); if (tgt) aid = tgt.agentId
        updated[cid] = ts.map((t) => {
          if (t.id === taskId && t.status === 'queued') { const ut = { ...t, status: 'in_progress' as const }; saveTask(ut); return ut }
          if (t.id !== taskId && t.agentId === aid && t.status === 'in_progress') { const ut = { ...t, status: 'paused' as const }; saveTask(ut); return ut }
          return t
        })
      }
      return { tasks: updated }
    }),

  completeTask: (taskId) =>
    set((s) => {
      const updated: Record<string, Task[]> = {}; let dcid = ''; let daid = ''
      for (const [cid, ts] of Object.entries(s.tasks)) {
        updated[cid] = ts.map((t) => {
          if (t.id === taskId) { dcid = cid; daid = t.agentId; const ut = { ...t, status: 'completed' as const }; saveTask(ut); return ut }
          return t
        })
      }
      if (!daid) return { tasks: updated }
      const ct = updated[dcid]
      if (ct) {
        if (!ct.some((t) => t.agentId === daid && t.status === 'in_progress')) {
          updated[dcid] = ct.map((t) => {
            if (t.agentId === daid && t.status === 'queued') {
              const ok = (t.dependsOn || []).every((d) => ct.find((x) => x.id === d)?.status === 'completed')
              const ut = ok ? { ...t, status: 'in_progress' as const } : t; if (ok) saveTask(ut); return ut
            }
            return t
          })
        }
        updated[dcid] = updated[dcid].map((t) => {
          if (t.status === 'blocked' && t.dependsOn?.includes(taskId)) {
            const ok = (t.dependsOn || []).every((d) => updated[dcid].find((x) => x.id === d)?.status === 'completed')
            const ut = ok ? { ...t, status: 'queued' as const } : t; if (ok) saveTask(ut); return ut
          }
          return t
        })
      }
      return { tasks: updated }
    }),

  pauseTask: (taskId) =>
    set((s) => {
      const updated: Record<string, Task[]> = {}
      for (const [cid, ts] of Object.entries(s.tasks))
        updated[cid] = ts.map((t) => t.id === taskId && t.status === 'in_progress' ? { ...t, status: 'paused' as const } : t)
      return { tasks: updated }
    }),

  cancelTask: (taskId) =>
    set((s) => {
      const updated: Record<string, Task[]> = {}
      for (const [cid, ts] of Object.entries(s.tasks))
        updated[cid] = ts.map((t) => t.id === taskId ? { ...t, status: 'cancelled' as const } : t)
      return { tasks: updated }
    }),

  addAgent: (agent) => { saveAgent(agent); set((s) => ({ agents: [...s.agents, agent] })) },

  updateAgent: (id, data) =>
    set((s) => ({ agents: s.agents.map((a) => a.id === id ? { ...a, ...data } : a) })),

  deleteAgent: (id) =>
    set((s) => ({
      agents: s.agents.filter((a) => a.id !== id),
      conversations: s.conversations.map((c) => ({ ...c, agentIds: c.agentIds.filter((aid) => aid !== id) }))
    })),

  cloneAgent: (id) =>
    set((s) => {
      const src = s.agents.find((a) => a.id === id); if (!src) return s
      const clone = { ...src, id: `agent-${Date.now()}`, name: `${src.name} (副本)`, createdAt: new Date().toISOString() }
      saveAgent(clone); return { agents: [...s.agents, clone] }
    }),

  addAgentToConversation: (cid, aid) =>
    set((s) => {
      const conv = s.conversations.find((c) => c.id === cid); if (!conv || conv.agentIds.includes(aid)) return s
      const a = s.agents.find((x) => x.id === aid)
      return {
        conversations: s.conversations.map((c) => c.id === cid ? { ...c, agentIds: [...c.agentIds, aid] } : c),
        messages: { ...s.messages, [cid]: [...(s.messages[cid] || []), systemMsg(cid, `${a?.name ?? aid} 加入了对话`)] }
      }
    }),

  removeAgentFromConversation: (cid, aid) =>
    set((s) => {
      const a = s.agents.find((x) => x.id === aid)
      return {
        conversations: s.conversations.map((c) => c.id === cid ? { ...c, agentIds: c.agentIds.filter((id) => id !== aid) } : c),
        messages: { ...s.messages, [cid]: [...(s.messages[cid] || []), systemMsg(cid, `${a?.name ?? aid} 离开了对话`)] }
      }
    }),

  createProject: (name, path) =>
    set((s) => {
      const id = `project-${Date.now()}`, p = { id, name, workspacePath: path, createdAt: new Date().toISOString() }
      const pm = pmAgent(id)
      saveProject(p); saveAgent(pm); saveActiveProject(id)
      return { projects: [...s.projects, p], agents: [...s.agents, pm], activeProjectId: id }
    }),

  createConversation: (name, agentIds) =>
    set((s) => {
      if (!s.activeProjectId) return s
      const id = `conv-${Date.now()}`, pma = s.agents.find((a) => a.projectId === s.activeProjectId && a.name === 'PM')
      const allIds = pma ? [...new Set([pma.id, ...agentIds])] : agentIds
      const names = s.agents.filter((a) => allIds.includes(a.id)).map((a) => a.name).join('、')
      const conv = { id, projectId: s.activeProjectId, name, agentIds: allIds, createdAt: new Date().toISOString(), status: 'active' as const }
      const msg = systemMsg(id, `对话「${name}」已创建。${names} 已加入。`)
      saveConversation(conv); saveMessage(msg); saveActiveConversation(id)
      return { conversations: [...s.conversations, conv], messages: { ...s.messages, [id]: [msg] }, activeConversationId: id }
    })
}))

function systemMsg(cid: string, content: string): Message {
  return { id: `msg-${Date.now()}`, conversationId: cid, agentId: 'system', role: 'system', content, messageType: 'text', createdAt: new Date().toISOString() }
}
