import { useState } from 'react'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pencil, Trash2, Copy, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Agent } from '@/types'

interface Props {
  agent: Agent
  onBack: () => void
  onDelete: (id: string) => void
}

export function AgentDetailPanel({ agent, onBack, onDelete }: Props) {
  const { updateAgent, cloneAgent, activeProjectId } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: agent.name,
    role: agent.role,
    systemPrompt: agent.systemPrompt,
    skills: [...agent.skills],
    personality: agent.personality,
    workflow: agent.workflow
  })
  const [newSkill, setNewSkill] = useState('')

  const handleSave = () => {
    updateAgent(agent.id, editData)
    setEditing(false)
  }

  const handleClone = () => {
    if (!activeProjectId) return
    cloneAgent(agent.id)
  }

  const handleDelete = () => {
    if (agent.name === 'PM') return // PM cannot be deleted
    onDelete(agent.id)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {editing ? '编辑 Agent' : 'Agent 详情'}
        </span>
        <div className="flex-1" />
        {!editing && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Avatar & Name */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 font-bold text-lg">
            {editData.name.charAt(0)}
          </div>
          <div>
            {editing ? (
              <input
                value={editData.name}
                onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
                className="text-sm font-medium bg-transparent border-b border-border focus:outline-none focus:border-primary pb-0.5"
              />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">{agent.name}</span>
                {agent.name === 'PM' && (
                  <span className="rounded bg-blue-500/10 px-1 py-0.5 text-[10px] font-medium text-blue-500">PM</span>
                )}
              </div>
            )}
            {editing ? (
              <input
                value={editData.role}
                onChange={(e) => setEditData((d) => ({ ...d, role: e.target.value }))}
                className="text-xs text-muted-foreground bg-transparent border-b border-border focus:outline-none focus:border-primary pb-0.5 mt-0.5 block w-full"
              />
            ) : (
              <div className="text-xs text-muted-foreground">{agent.role}</div>
            )}
          </div>
        </div>

        {/* Personality */}
        <FieldSection label="性格" editing={editing}>
          {editing ? (
            <input
              value={editData.personality}
              onChange={(e) => setEditData((d) => ({ ...d, personality: e.target.value }))}
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          ) : (
            <span className="text-xs">{agent.personality}</span>
          )}
        </FieldSection>

        {/* Workflow */}
        <FieldSection label="工作流" editing={editing}>
          {editing ? (
            <input
              value={editData.workflow}
              onChange={(e) => setEditData((d) => ({ ...d, workflow: e.target.value }))}
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          ) : (
            <span className="text-xs">{agent.workflow}</span>
          )}
        </FieldSection>

        {/* Skills */}
        <FieldSection label="技能">
          <div className="flex flex-wrap gap-1">
            {(editing ? editData.skills : agent.skills).map((skill, idx) => (
              <span key={skill} className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400">
                {skill}
                {editing && (
                  <button
                    onClick={() => setEditData((d) => ({
                      ...d,
                      skills: d.skills.filter((_, i) => i !== idx)
                    }))}
                    className="hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
            {editing && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (newSkill.trim()) {
                    setEditData((d) => ({ ...d, skills: [...d.skills, newSkill.trim()] }))
                    setNewSkill('')
                  }
                }}
              >
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="添加技能..."
                  className="w-20 rounded border border-dashed border-border bg-transparent px-1.5 py-0.5 text-xs focus:outline-none focus:border-primary"
                />
              </form>
            )}
          </div>
        </FieldSection>

        {/* System Prompt */}
        <FieldSection label="系统提示词">
          {editing ? (
            <textarea
              value={editData.systemPrompt}
              onChange={(e) => setEditData((d) => ({ ...d, systemPrompt: e.target.value }))}
              rows={5}
              className="w-full resize-none rounded border border-border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
            />
          ) : (
            <div className="rounded bg-muted p-2 text-xs font-mono text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap">
              {agent.systemPrompt}
            </div>
          )}
        </FieldSection>
      </div>

      {/* Actions */}
      <div className="border-t border-border p-3 space-y-2">
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(false)}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              取消
            </Button>
            <Button size="sm" className="flex-1" onClick={handleSave}>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              保存
            </Button>
          </div>
        ) : (
          <>
            <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleClone}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              克隆 Agent
            </Button>
            {agent.id !== 'pm-agent' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                删除 Agent
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function FieldSection({ label, editing, children }: {
  label: string
  editing?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  )
}
