import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import fs from 'node:fs'

const execAsync = promisify(exec)

export interface GitStatus {
  branch: string
  clean: boolean
  files: Array<{ path: string; status: 'M' | 'A' | 'D' | '??' }>
  ahead: number
  behind: number
}

export interface DiffResult {
  file: string
  oldContent: string
  newContent: string
  changeType: 'modified' | 'added' | 'deleted'
}

export class GitService {
  private workspacePath: string

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath
  }

  private git(args: string): Promise<string> {
    return execAsync(`git ${args}`, { cwd: this.workspacePath }).then((r) => r.stdout.trim())
  }

  async isRepo(): Promise<boolean> {
    try {
      await this.git('rev-parse --git-dir')
      return true
    } catch {
      return false
    }
  }

  async init(): Promise<void> {
    if (!fs.existsSync(this.workspacePath)) {
      fs.mkdirSync(this.workspacePath, { recursive: true })
    }
    if (!await this.isRepo()) {
      await this.git('init')
      await this.git('config user.name "HyClaw"')
      await this.git('config user.email "hyclaw@local"')
    }
  }

  async getStatus(): Promise<GitStatus> {
    const branch = await this.git('branch --show-current').catch(() => 'main')
    const statusRaw = await this.git('status --porcelain').catch(() => '')

    const files = statusRaw
      .split('\n')
      .filter(Boolean)
      .map((line) => ({
        status: line.slice(0, 2).trim().replace('M', 'M').replace('A', 'A').replace('D', 'D').replace('?', '?').replace(' ', '') as GitStatus['files'][0]['status'],
        path: line.slice(3)
      }))

    const clean = files.length === 0

    let ahead = 0
    let behind = 0
    try {
      const tracking = await this.git('rev-list --left-right --count @{u}...HEAD 2>/dev/null')
      const parts = tracking.split('\t')
      ahead = parseInt(parts[0] || '0')
      behind = parseInt(parts[1] || '0')
    } catch {}

    return { branch, clean, files, ahead, behind }
  }

  async createBranch(name: string): Promise<void> {
    try {
      await this.git(`checkout -b ${name}`)
    } catch {
      // Branch may already exist, just switch
      await this.git(`checkout ${name}`)
    }
  }

  async checkoutBranch(name: string): Promise<void> {
    await this.git(`checkout ${name}`)
  }

  async getCurrentBranch(): Promise<string> {
    return this.git('branch --show-current')
  }

  async getBranches(): Promise<string[]> {
    const raw = await this.git('branch --list')
    return raw.split('\n').map((b) => b.replace(/^\*?\s+/, '').trim()).filter(Boolean)
  }

  async commit(message: string): Promise<void> {
    await this.git('add -A')
    await this.git(`commit -m "${message.replace(/"/g, '\\"')}"`)
  }

  async merge(branch: string): Promise<{ hasConflict: boolean; conflictFiles: string[] }> {
    try {
      await this.git(`merge ${branch} --no-edit`)
      return { hasConflict: false, conflictFiles: [] }
    } catch {
      const raw = await this.git('diff --name-only --diff-filter=U').catch(() => '')
      const conflictFiles = raw.split('\n').filter(Boolean)
      return { hasConflict: true, conflictFiles }
    }
  }

  async abortMerge(): Promise<void> {
    await this.git('merge --abort').catch(() => {})
  }

  async getDiff(baseBranch: string, targetBranch?: string): Promise<DiffResult[]> {
    const range = targetBranch ? `${baseBranch}...${targetBranch}` : baseBranch
    const files = await this.git(`diff --name-status ${range}`).catch(() => '')

    const diffs: DiffResult[] = []
    for (const line of files.split('\n').filter(Boolean)) {
      const parts = line.split('\t')
      const status = parts[0].charAt(0)
      const file = parts[1]

      const changeType = status === 'A' ? 'added' as const : status === 'D' ? 'deleted' as const : 'modified' as const

      let oldContent = ''
      let newContent = ''

      try {
        oldContent = targetBranch
          ? await this.git(`show ${baseBranch}:${file}`).catch(() => '')
          : await this.git(`show HEAD:${file}`).catch(() => '')

        newContent = targetBranch
          ? await this.git(`show ${targetBranch}:${file}`).catch(() => '')
          : fs.readFileSync(path.join(this.workspacePath, file), 'utf-8')
      } catch {}

      diffs.push({ file, oldContent, newContent, changeType })
    }

    return diffs
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.workspacePath, relativePath)
    const dir = path.dirname(fullPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(fullPath, content, 'utf-8')
  }

  async readFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.workspacePath, relativePath)
    return fs.readFileSync(fullPath, 'utf-8')
  }

  async listFiles(subPath = ''): Promise<string[]> {
    const dir = path.join(this.workspacePath, subPath)
    if (!fs.existsSync(dir)) return []

    const result: string[] = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.env.example') continue
      if (entry.name === 'node_modules' || entry.name === 'out' || entry.name === 'dist') continue

      const relative = subPath ? `${subPath}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        result.push(relative + '/')
        result.push(...await this.listFiles(relative))
      } else {
        result.push(relative)
      }
    }

    return result
  }
}

// Singleton instance per workspace
const instances = new Map<string, GitService>()

export function getGitService(workspacePath: string): GitService {
  if (!instances.has(workspacePath)) {
    instances.set(workspacePath, new GitService(workspacePath))
  }
  return instances.get(workspacePath)!
}
