import { ipcMain } from 'electron'
import { schedulerService } from './scheduler-service'
import type { ScheduledTask } from './scheduler-service'

export function registerSchedulerIPC(): void {
  ipcMain.handle('scheduler:list', () => {
    return schedulerService.listTasks()
  })

  ipcMain.handle('scheduler:create', (_event, task: Omit<ScheduledTask, 'id' | 'createdAt' | 'runCount' | 'lastRun' | 'nextRun'>) => {
    return schedulerService.createTask(task)
  })

  ipcMain.handle('scheduler:update', (_event, id: string, updates: Partial<ScheduledTask>) => {
    return schedulerService.updateTask(id, updates)
  })

  ipcMain.handle('scheduler:delete', (_event, id: string) => {
    return schedulerService.deleteTask(id)
  })

  ipcMain.handle('scheduler:get', (_event, id: string) => {
    return schedulerService.getTask(id)
  })

  ipcMain.handle('scheduler:runOnce', (_event, id: string) => {
    return schedulerService.runOnce(id)
  })

  ipcMain.handle('scheduler:getLogs', (_event, taskId?: string) => {
    return schedulerService.getLogs(taskId)
  })
}
