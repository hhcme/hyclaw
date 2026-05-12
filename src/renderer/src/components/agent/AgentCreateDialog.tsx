import { useState } from 'react'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Agent } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AgentCreateDialog({ open, onOpenChange }: Props) {
  const { activeProjectId, addAgent } = useAppStore()
  const [step, setStep] = useState<'describe' | 'preview' | 'generating'>('describe')
  const [description, setDescription] = useState('')
  const [generated, setGenerated] = useState<Partial<Agent> | null>(null)

  const handleGenerate = async () => {
    if (!description.trim()) return
    setStep('generating')
    await new Promise((r) => setTimeout(r, 800))
    const config = generateAgentConfig(description)
    setGenerated(config)
    setStep('preview')
  }

  const handleConfirm = () => {
    if (!generated || !activeProjectId) return
    addAgent({
      id: `agent-${Date.now()}`,
      projectId: activeProjectId,
      name: generated.name ?? '新 Agent',
      role: generated.role ?? '自定义 Agent',
      systemPrompt: generated.systemPrompt ?? '',
      skills: generated.skills ?? [],
      personality: generated.personality ?? '友好',
      workflow: generated.workflow ?? '理解需求 → 执行 → 汇报',
      createdAt: new Date().toISOString()
    })
    reset()
    onOpenChange(false)
  }

  const reset = () => {
    setDescription('')
    setGenerated(null)
    setStep('describe')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium',
              step === 'describe' && 'bg-primary text-primary-foreground',
              step === 'generating' && 'bg-yellow-500 text-white',
              step === 'preview' && 'bg-emerald-500 text-white'
            )}>
              {step === 'describe' ? '1' : step === 'generating' ? '...' : '2'}
            </span>
            <DialogTitle className="text-sm">
              {step === 'describe' ? '描述 Agent' : step === 'generating' ? '生成中...' : '确认配置'}
            </DialogTitle>
          </div>
          {step === 'describe' && (
            <DialogDescription>
              用自然语言描述你想要的角色，AI 会自动生成配置。
            </DialogDescription>
          )}
        </DialogHeader>

        {step === 'describe' && (
          <div className="space-y-3">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：一个资深的 Python 后端工程师，精通 FastAPI 和 SQLAlchemy..."
              rows={5}
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5">
              {['前端 React 专家', '后端 Go 工程师', '全栈开发者', '测试工程师', '数据分析师', 'DevOps 运维'].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setDescription(`我要一个${hint}`)}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>
            <Button onClick={handleGenerate} disabled={!description.trim()} className="w-full">
              <Sparkles className="mr-2 h-4 w-4" /> 生成 Agent
            </Button>
          </div>
        )}

        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-sm text-muted-foreground">正在分析描述，生成 Agent 配置...</p>
          </div>
        )}

        {step === 'preview' && generated && (
          <div className="space-y-4">
            <PreviewCard config={generated} />
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1">重新描述</Button>
              <Button onClick={handleConfirm} className="flex-1">
                <Check className="mr-2 h-4 w-4" /> 确认创建
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PreviewCard({ config }: { config: Partial<Agent> }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 font-bold text-sm">
          {config.name?.charAt(0)}
        </div>
        <div>
          <div className="text-sm font-medium">{config.name}</div>
          <div className="text-xs text-muted-foreground">{config.role}</div>
        </div>
      </div>
      <ConfigRow label="性格" value={config.personality} />
      <ConfigRow label="工作流" value={config.workflow} />
      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1">技能</div>
        <div className="flex flex-wrap gap-1">
          {config.skills?.map((s) => (
            <span key={s} className="rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600">{s}</span>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-medium text-muted-foreground mb-1">系统提示词</div>
        <div className="rounded bg-muted p-2 text-xs font-mono text-muted-foreground max-h-20 overflow-y-auto whitespace-pre-wrap">
          {config.systemPrompt}
        </div>
      </div>
    </div>
  )
}

function ConfigRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="font-medium text-muted-foreground shrink-0 w-10">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function generateAgentConfig(description: string): Partial<Agent> {
  const lower = description.toLowerCase()
  let role = '自定义 Agent'
  let skills: string[] = ['编程']
  let name = '新 Agent'
  let personality = '友好'
  let workflow = '理解需求 → 执行 → 汇报'

  if (lower.includes('前端') || lower.includes('react') || lower.includes('vue') || lower.includes('ui')) {
    role = '前端工程师'; name = '前端' + pickName()
    skills = ['React', 'TypeScript', 'Tailwind CSS', 'Vue']; personality = '注重细节'
    workflow = '理解需求 → 设计方案 → 写代码 → 自测'
  } else if (lower.includes('后端') || lower.includes('api') || lower.includes('服务')) {
    if (lower.includes('python') || lower.includes('fastapi')) { role = 'Python 后端工程师'; skills = ['Python', 'FastAPI', 'SQLAlchemy', 'PostgreSQL'] }
    else if (lower.includes('go')) { role = 'Go 后端工程师'; skills = ['Go', 'Gin', 'gRPC', 'PostgreSQL'] }
    else { role = '后端工程师'; skills = ['Node.js', 'Express', 'PostgreSQL', 'Redis'] }
    name = '后端' + pickName(); personality = '沉稳'
    workflow = '理解需求 → 出方案 → 确认 → 写代码 → 自测'
  } else if (lower.includes('全栈')) { role = '全栈工程师'; skills = ['React', 'Node.js', 'TypeScript', 'PostgreSQL']; name = '全栈' + pickName(); personality = '全面' }
  else if (lower.includes('测试') || lower.includes('qa')) { role = '测试工程师'; skills = ['pytest', 'Jest', 'Playwright']; name = '测试' + pickName(); personality = '严谨' }
  else if (lower.includes('数据') || lower.includes('爬虫')) { role = '数据分析师'; skills = ['Python', 'Pandas', 'SQL']; name = '数据' + pickName(); personality = '细心' }
  else if (lower.includes('运维') || lower.includes('devops')) { role = 'DevOps 工程师'; skills = ['Docker', 'Kubernetes', 'CI/CD']; name = '运维' + pickName(); personality = '可靠' }

  return { name, role, systemPrompt: `你是${role}，${description}`, skills, personality, workflow }
}

const names = ['老王', '老李', '小张', '大刘', '老陈', '小周', '阿强', '老赵', '小吴', '老孙']
function pickName(): string { return names[Math.floor(Math.random() * names.length)] }
