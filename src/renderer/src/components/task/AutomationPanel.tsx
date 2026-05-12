import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  Clock, Plus, Play, Pause, Trash2, RefreshCw, History,
  CheckCircle, XCircle, Loader2, ChevronRight, AlertCircle
} from 'lucide-react'
import type { ScheduledTask, TaskLog } from '@/types'

export function AutomationPanel() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [logs, setLogs] = useState<TaskLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [viewLogs, setViewLogs] = useState<string | null>(null)

  // Create form state
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formCron, setFormCron] = useState('0 9 * * *')
  const [formAction, setFormAction] = useState('')

  const refresh = useCallback(async () => {
    if (!window.electronAPI?.scheduler) return
    try {
      const [taskList, logList] = await Promise.all([
        window.electronAPI.scheduler.list(),
        window.electronAPI.scheduler.getLogs()
      ])
      setTasks(taskList)
      setLogs(logList)
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Poll every 30s to update nextRun times
  useEffect(() => {
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh])

  const handleCreate = async () => {
    if (!formName.trim()) return
    try {
      await window.electronAPI?.scheduler?.create({
        name: formName.trim(),
        description: formDesc.trim(),
        cronExpression: formCron.trim(),
        action: formAction.trim() || formName.trim(),
        enabled: true
      })
      setFormName(''); setFormDesc(''); setFormCron('0 9 * * *'); setFormAction('')
      setShowCreate(false)
      refresh()
    } catch (e: any) {
      console.error(e)
    }
  }

  const toggleTask = async (task: ScheduledTask) => {
    await window.electronAPI?.scheduler?.update(task.id, { enabled: !task.enabled })
    refresh()
  }

  const deleteTask = async (id: string) => {
    await window.electronAPI?.scheduler?.delete(id)
    refresh()
  }

  const runOnce = async (id: string) => {
    await window.electronAPI?.scheduler?.runOnce(id)
    refresh()
  }

  const cronPresets = [
    { label: '每分钟', value: '* * * * *' },
    { label: '每5分钟', value: '*/5 * * * *' },
    { label: '每小时', value: '0 * * * *' },
    { label: '每天9:00', value: '0 9 * * *' },
    { label: '每天18:00', value: '0 18 * * *' },
    { label: '每周一9:00', value: '0 9 * * 1' }
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-medium">
          自动化 ({tasks.length})
        </span>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={refresh}>
          <RefreshCw className={cn('mr-1 h-3 w-3', loading && 'animate-spin')} />
          刷新
        </Button>
      </div>

      {/* Log viewer */}
      {viewLogs && (
        <div className="border-b border-border p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setViewLogs(null)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-3 w-3 rotate-90" />
              返回任务列表
            </button>
          </div>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {logs.filter((l) => l.taskId === viewLogs).slice(0, 20).map((log) => (
              <div
                key={log.id}
                className={cn(
                  'rounded-md border px-2 py-1.5 text-xs',
                  log.success
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-red-500/20 bg-red-500/5'
                )}
              >
                <div className="flex items-center gap-1.5">
                  {log.success ? (
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-muted-foreground">
                    {new Date(log.startedAt).toLocaleTimeString('zh-CN')}
                  </span>
                </div>
                <div className="mt-0.5 text-muted-foreground/70">{log.output}</div>
                {log.error && (
                  <div className="mt-0.5 text-red-500/70">{log.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              'rounded-lg border p-2.5 transition-colors',
              task.enabled
                ? 'border-border hover:border-blue-500/30'
                : 'border-border/50 bg-muted/20 opacity-60'
            )}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    task.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'
                  )} />
                  <span className="text-sm font-medium truncate">{task.name}</span>
                </div>
                {task.description && (
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {task.description}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground/60">
                  <span title={task.cronExpression}><Clock className="inline h-2.5 w-2.5 mr-0.5" />{task.cronExpression}</span>
                  {task.nextRun && (
                    <span>下次: {new Date(task.nextRun).toLocaleTimeString('zh-CN')}</span>
                  )}
                  {task.lastRun && (
                    <span>上次: {new Date(task.lastRun).toLocaleTimeString('zh-CN')}</span>
                  )}
                  <span>已执行: {task.runCount}次</span>
                </div>
                {task.lastError && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-red-500">
                    <AlertCircle className="h-2.5 w-2.5" />
                    {task.lastError}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => toggleTask(task)} title={task.enabled ? '暂停' : '启用'} className="p-1 rounded hover:bg-accent">
                  {task.enabled ? <Pause className="h-3.5 w-3.5 text-muted-foreground" /> : <Play className="h-3.5 w-3.5 text-emerald-500" />}
                </button>
                <button onClick={() => runOnce(task.id)} title="立即执行" className="p-1 rounded hover:bg-accent">
                  <Play className="h-3.5 w-3.5 text-blue-500" />
                </button>
                <button onClick={() => setViewLogs(task.id)} title="查看日志" className="p-1 rounded hover:bg-accent">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => deleteTask(task.id)} title="删除" className="p-1 rounded hover:bg-red-500/10">
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">暂无定时任务</p>
            <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              创建任务
            </Button>
          </div>
        )}
      </div>

      {/* Create button */}
      <div className="border-t border-border p-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="mr-2 h-3.5 w-3.5" />
          新建定时任务
        </Button>
      </div>

      {/* Create modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">创建定时任务</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="任务名称" autoFocus />
            <Input value={formAction} onChange={(e) => setFormAction(e.target.value)} placeholder="执行动作描述（如：抓取竞品页面数据）" />
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Cron 表达式</label>
              <Input value={formCron} onChange={(e) => setFormCron(e.target.value)} placeholder="0 9 * * *" className="font-mono" />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {cronPresets.map((p) => (
                  <button key={p.value} onClick={() => setFormCron(p.value)} className={cn('rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent transition-colors', formCron === p.value && 'bg-primary/10 border-primary/30 text-primary')}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>取消</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={!formName.trim()}><Plus className="mr-1.5 h-4 w-4" />创建</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
