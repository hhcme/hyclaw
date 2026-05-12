import { Cron } from 'croner'
import { EventEmitter } from 'node:events'

export interface ScheduledTask {
  id: string
  name: string
  description: string
  cronExpression: string
  action: string // description of what it does
  enabled: boolean
  createdAt: string
  lastRun?: string
  nextRun?: string
  runCount: number
  lastError?: string
}

export interface TaskLog {
  id: string
  taskId: string
  startedAt: string
  finishedAt?: string
  success: boolean
  output: string
  error?: string
}

class SchedulerService extends EventEmitter {
  private tasks = new Map<string, ScheduledTask>()
  private crons = new Map<string, Cron>()
  private logs: TaskLog[] = []
  private maxLogs = 200

  constructor() {
    super()
    this.loadFromDisk()
  }

  // --- Task CRUD ---

  createTask(task: Omit<ScheduledTask, 'id' | 'createdAt' | 'runCount' | 'lastRun' | 'nextRun'>): ScheduledTask {
    const id = `sched-${Date.now()}`
    const now = new Date().toISOString()
    const full: ScheduledTask = {
      ...task,
      id,
      createdAt: now,
      runCount: 0
    }
    this.tasks.set(id, full)

    if (task.enabled) {
      this.startCron(id, full)
    }

    this.emit('task-created', full)
    this.saveToDisk()
    return this.getTask(id)!
  }

  updateTask(id: string, updates: Partial<ScheduledTask>): ScheduledTask | null {
    const task = this.tasks.get(id)
    if (!task) return null

    const updated = { ...task, ...updates }
    this.tasks.set(id, updated)

    // Handle enable/disable
    if (updates.enabled !== undefined || updates.cronExpression !== undefined) {
      this.stopCron(id)
      if (updated.enabled) this.startCron(id, updated)
    }

    this.emit('task-updated', updated)
    this.saveToDisk()
    return this.getTask(id)!
  }

  deleteTask(id: string): boolean {
    this.stopCron(id)
    this.tasks.delete(id)
    this.saveToDisk()
    return true
  }

  getTask(id: string): ScheduledTask | null {
    const task = this.tasks.get(id)
    if (!task) return null
    const cron = this.crons.get(id)
    return {
      ...task,
      nextRun: cron?.nextRun()?.toISOString()
    }
  }

  listTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values()).map((task) => {
      const cron = this.crons.get(task.id)
      return {
        ...task,
        nextRun: cron?.nextRun()?.toISOString()
      }
    })
  }

  // --- Logs ---

  getLogs(taskId?: string): TaskLog[] {
    if (taskId) return this.logs.filter((l) => l.taskId === taskId)
    return [...this.logs].reverse()
  }

  // --- Cron management ---

  private startCron(id: string, task: ScheduledTask): void {
    try {
      const cron = new Cron(task.cronExpression, { timezone: 'Asia/Shanghai' }, async () => {
        await this.executeTask(id)
      })
      this.crons.set(id, cron)
    } catch (e) {
      this.emit('cron-error', { taskId: id, error: String(e) })
    }
  }

  private stopCron(id: string): void {
    const cron = this.crons.get(id)
    if (cron) {
      cron.stop()
      this.crons.delete(id)
    }
  }

  private async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId)
    if (!task) return

    const logId = `log-${Date.now()}`
    const log: TaskLog = {
      id: logId,
      taskId,
      startedAt: new Date().toISOString(),
      success: false,
      output: ''
    }

    this.emit('task-started', { taskId, logId })

    try {
      // Simulate task execution (in real app, this would trigger agent actions)
      const start = Date.now()
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000))
      const elapsed = Date.now() - start

      log.success = true
      log.output = `任务 "${task.name}" 执行成功 (${elapsed}ms)`
      log.finishedAt = new Date().toISOString()

      this.tasks.set(taskId, {
        ...task,
        lastRun: log.startedAt,
        runCount: task.runCount + 1
      })
    } catch (e: any) {
      log.success = false
      log.error = e.message
      log.output = `执行失败: ${e.message}`
      log.finishedAt = new Date().toISOString()

      this.tasks.set(taskId, {
        ...task,
        lastRun: log.startedAt,
        lastError: e.message
      })
    }

    this.logs.unshift(log)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    this.emit('task-finished', { taskId, logId, success: log.success })
    this.saveToDisk()
    this.saveLogsToDisk()
  }

  async runOnce(taskId: string): Promise<TaskLog> {
    await this.executeTask(taskId)
    return this.logs.find((l) => l.taskId === taskId) || {
      id: '',
      taskId,
      startedAt: '',
      success: false,
      output: '未找到日志'
    }
  }

  // --- Persistence ---

  private saveToDisk(): void {
    try {
      const data = JSON.stringify(Array.from(this.tasks.values()))
      const fs = require('node:fs')
      const path = require('node:path')
      const dir = path.join(process.env.HOME || '/tmp', 'worker-solo-data')
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, 'scheduler-tasks.json'), data)
    } catch {}
  }

  private loadFromDisk(): void {
    try {
      const fs = require('node:fs')
      const path = require('node:path')
      const file = path.join(process.env.HOME || '/tmp', 'worker-solo-data', 'scheduler-tasks.json')
      if (!fs.existsSync(file)) return
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'))
      for (const task of data as ScheduledTask[]) {
        this.tasks.set(task.id, task)
        if (task.enabled) {
          this.startCron(task.id, task)
        }
      }
    } catch {}
  }

  private saveLogsToDisk(): void {
    try {
      const fs = require('node:fs')
      const path = require('node:path')
      const dir = path.join(process.env.HOME || '/tmp', 'worker-solo-data')
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(
        path.join(dir, 'scheduler-logs.json'),
        JSON.stringify(this.logs.slice(0, 100))
      )
    } catch {}
  }

  destroy(): void {
    for (const id of this.crons.keys()) {
      this.stopCron(id)
    }
    this.tasks.clear()
    this.logs = []
  }
}

export const schedulerService = new SchedulerService()
