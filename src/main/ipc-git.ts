import { ipcMain } from 'electron'
import { getGitService } from './git-service'
import type { GitStatus, DiffResult } from './git-service'

export function registerGitIPC(): void {
  ipcMain.handle('git:init', async (_event, workspacePath: string) => {
    const git = getGitService(workspacePath)
    await git.init()
    return true
  })

  ipcMain.handle('git:status', async (_event, workspacePath: string): Promise<GitStatus> => {
    const git = getGitService(workspacePath)
    return git.getStatus()
  })

  ipcMain.handle('git:createBranch', async (_event, workspacePath: string, name: string) => {
    const git = getGitService(workspacePath)
    await git.createBranch(name)
    return true
  })

  ipcMain.handle('git:checkout', async (_event, workspacePath: string, name: string) => {
    const git = getGitService(workspacePath)
    await git.checkoutBranch(name)
    return true
  })

  ipcMain.handle('git:currentBranch', async (_event, workspacePath: string) => {
    const git = getGitService(workspacePath)
    return git.getCurrentBranch()
  })

  ipcMain.handle('git:branches', async (_event, workspacePath: string) => {
    const git = getGitService(workspacePath)
    return git.getBranches()
  })

  ipcMain.handle('git:commit', async (_event, workspacePath: string, message: string) => {
    const git = getGitService(workspacePath)
    await git.commit(message)
    return true
  })

  ipcMain.handle('git:merge', async (_event, workspacePath: string, branch: string) => {
    const git = getGitService(workspacePath)
    return git.merge(branch)
  })

  ipcMain.handle('git:abortMerge', async (_event, workspacePath: string) => {
    const git = getGitService(workspacePath)
    await git.abortMerge()
    return true
  })

  ipcMain.handle('git:diff', async (_event, workspacePath: string, base: string, target?: string): Promise<DiffResult[]> => {
    const git = getGitService(workspacePath)
    return git.getDiff(base, target)
  })

  ipcMain.handle('git:writeFile', async (_event, workspacePath: string, relativePath: string, content: string) => {
    const git = getGitService(workspacePath)
    await git.writeFile(relativePath, content)
    return true
  })

  ipcMain.handle('git:readFile', async (_event, workspacePath: string, relativePath: string) => {
    const git = getGitService(workspacePath)
    return git.readFile(relativePath)
  })

  ipcMain.handle('git:listFiles', async (_event, workspacePath: string, subPath: string) => {
    const git = getGitService(workspacePath)
    return git.listFiles(subPath)
  })
}
