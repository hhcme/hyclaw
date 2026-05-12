export interface Project {
  id: string
  name: string
  workspacePath: string
  createdAt: string
}

export interface Agent {
  id: string
  projectId: string
  name: string
  role: string
  systemPrompt: string
  skills: string[]
  personality: string
  workflow: string
  createdAt: string
}

export interface Conversation {
  id: string
  projectId: string
  name: string
  agentIds: string[]
  createdAt: string
  status: 'active' | 'paused' | 'archived'
}

export interface Message {
  id: string
  conversationId: string
  agentId: string
  role: 'user' | 'agent' | 'system'
  content: string
  replyToId?: string
  messageType: 'text' | 'diff' | 'task' | 'document' | 'tool_call'
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface Task {
  id: string
  conversationId: string
  agentId: string
  title: string
  description: string
  priority: 'normal' | 'high' | 'urgent'
  status: 'queued' | 'in_progress' | 'waiting' | 'blocked' | 'paused' | 'review' | 'completed' | 'cancelled'
  dependsOn?: string[]
  createdAt: string
}

declare global {
  interface Window {
    electronAPI: {
      getVersion: () => Promise<string>
      getPath: (name: string) => Promise<string>
      getApiPort: () => Promise<number>
      hasApiKey: () => Promise<boolean>
      git: {
        init: (workspacePath: string) => Promise<boolean>
        status: (workspacePath: string) => Promise<GitStatus>
        createBranch: (workspacePath: string, name: string) => Promise<boolean>
        checkout: (workspacePath: string, name: string) => Promise<boolean>
        currentBranch: (workspacePath: string) => Promise<string>
        branches: (workspacePath: string) => Promise<string[]>
        commit: (workspacePath: string, message: string) => Promise<boolean>
        merge: (workspacePath: string, branch: string) => Promise<{ hasConflict: boolean; conflictFiles: string[] }>
        abortMerge: (workspacePath: string) => Promise<boolean>
        diff: (workspacePath: string, base: string, target?: string) => Promise<DiffResult[]>
        writeFile: (workspacePath: string, relativePath: string, content: string) => Promise<boolean>
        readFile: (workspacePath: string, relativePath: string) => Promise<string>
        listFiles: (workspacePath: string, subPath: string) => Promise<string[]>
      }
      browser: {
        navigate: (url: string) => Promise<BrowserState>
        screenshot: () => Promise<string | null>
        getHTML: () => Promise<string>
        getText: () => Promise<string>
        executeJS: (code: string) => Promise<string>
        getState: () => Promise<BrowserState>
        showView: (url: string) => Promise<boolean>
        hideView: () => Promise<boolean>
      }
      ffmpeg: {
        detect: () => Promise<{ found: boolean; path: string; version: string }>
        getInfo: (filePath: string) => Promise<VideoInfo>
        concat: (files: string[], output?: string) => Promise<VideoOpResult>
        trim: (file: string, start: string, duration: string, output?: string) => Promise<VideoOpResult>
        transcode: (file: string, options: any, output?: string) => Promise<VideoOpResult>
        addSubtitle: (file: string, text: string, output?: string) => Promise<VideoOpResult>
        extractAudio: (file: string, output?: string) => Promise<VideoOpResult>
        screenshot: (file: string, atTime: string, output?: string) => Promise<VideoOpResult>
        outputDir: () => Promise<string>
        selectFile: () => Promise<string | null>
      }
      scheduler: {
        list: () => Promise<ScheduledTask[]>
        create: (task: any) => Promise<ScheduledTask>
        update: (id: string, updates: any) => Promise<ScheduledTask | null>
        delete: (id: string) => Promise<boolean>
        get: (id: string) => Promise<ScheduledTask | null>
        runOnce: (id: string) => Promise<TaskLog>
        getLogs: (taskId?: string) => Promise<TaskLog[]>
      }
      settings: {
        get: () => Promise<AppSettings>
        getPresets: () => Promise<ProviderPreset[]>
        add: (provider: string, apiKey: string, model: string) => Promise<AppSettings>
        updateKey: (id: string, apiKey: string) => Promise<AppSettings>
        updateModel: (id: string, model: string) => Promise<AppSettings>
        remove: (id: string) => Promise<AppSettings>
        setActive: (id: string) => Promise<AppSettings>
      }
      selectDir: () => Promise<string | null>
    }
  }
}

export interface ProviderEntry {
  id: string
  provider: string
  apiKey: string
  model: string
  baseURL: string
}

export interface AppSettings {
  activeProviderId: string | null
  providers: ProviderEntry[]
}

export interface ProviderPreset {
  provider: string
  label: string
  baseURL: string
  models: string[]
}

export interface ScheduledTask {
  id: string
  name: string
  description: string
  cronExpression: string
  action: string
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

export interface BrowserState {
  url: string
  title: string
  screenshot?: string
  isLoading: boolean
}

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

export interface VideoInfo {
  file: string
  duration: string
  resolution: string
  fps: number
  codec: string
  bitrate: string
}

export interface VideoOpResult {
  success: boolean
  outputFile: string
  duration: string
  size: string
  error?: string
}
