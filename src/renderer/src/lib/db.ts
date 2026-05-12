import Dexie, { type Table } from 'dexie'
import type { Message, Task, Agent, Conversation, Project } from '@/types'

interface AppMeta {
  key: string
  value: any
}

class WorkerSoloDB extends Dexie {
  projects!: Table<Project, string>
  agents!: Table<Agent, string>
  conversations!: Table<Conversation, string>
  messages!: Table<Message, string>
  tasks!: Table<Task, string>
  meta!: Table<AppMeta, string>

  constructor() {
    super('worker-solo')

    this.version(2).stores({
      projects: 'id, name, createdAt',
      agents: 'id, projectId, name, createdAt',
      conversations: 'id, projectId, name, status, createdAt',
      messages: 'id, conversationId, agentId, role, messageType, createdAt',
      tasks: 'id, conversationId, agentId, status, priority, createdAt',
      meta: 'key'
    })
  }
}

export const db = new WorkerSoloDB()

// --- Full persistence ---

export async function hydrateFromDB(): Promise<{
  projects: Project[]
  agents: Agent[]
  conversations: Conversation[]
  messages: Record<string, Message[]>
  tasks: Record<string, Task[]>
  activeProjectId: string | null
  activeConversationId: string | null
}> {
  const [projects, agents, conversations, allMessages, allTasks] = await Promise.all([
    db.projects.toArray(),
    db.agents.toArray(),
    db.conversations.toArray(),
    db.messages.toArray(),
    db.tasks.toArray()
  ])

  // Group messages by conversation
  const messages: Record<string, Message[]> = {}
  for (const msg of allMessages) {
    if (!messages[msg.conversationId]) messages[msg.conversationId] = []
    messages[msg.conversationId].push(msg)
  }

  // Group tasks by conversation
  const tasks: Record<string, Task[]> = {}
  for (const t of allTasks) {
    if (!tasks[t.conversationId]) tasks[t.conversationId] = []
    tasks[t.conversationId].push(t)
  }

  // Restore active state
  const activeProjectId = (await db.meta.get('activeProjectId'))?.value ?? null
  const activeConversationId = (await db.meta.get('activeConversationId'))?.value ?? null

  return {
    projects: projects.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    agents,
    conversations: conversations.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    messages,
    tasks,
    activeProjectId: projects.find((p) => p.id === activeProjectId) ? activeProjectId : projects[0]?.id ?? null,
    activeConversationId: conversations.find((c) => c.id === activeConversationId) ? activeConversationId : null
  }
}

// --- Save helpers ---

export async function saveProject(project: Project): Promise<void> {
  await db.projects.put(project)
}

export async function removeProject(id: string): Promise<void> {
  await db.projects.delete(id)
  await db.agents.where('projectId').equals(id).delete()
  await db.conversations.where('projectId').equals(id).delete()
}

export async function saveAgent(agent: Agent): Promise<void> {
  await db.agents.put(agent)
}

export async function removeAgent(id: string): Promise<void> {
  await db.agents.delete(id)
}

export async function saveConversation(conv: Conversation): Promise<void> {
  await db.conversations.put(conv)
}

export async function removeConversation(id: string): Promise<void> {
  await db.conversations.delete(id)
  await db.messages.where('conversationId').equals(id).delete()
  await db.tasks.where('conversationId').equals(id).delete()
}

export async function saveMessage(message: Message): Promise<void> {
  await db.messages.put(message)
}

export async function saveTask(task: Task): Promise<void> {
  await db.tasks.put(task)
}

export async function saveActiveProject(id: string | null): Promise<void> {
  await db.meta.put({ key: 'activeProjectId', value: id })
}

export async function saveActiveConversation(id: string | null): Promise<void> {
  await db.meta.put({ key: 'activeConversationId', value: id })
}
