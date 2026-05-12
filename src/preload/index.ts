import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  getApiPort: () => ipcRenderer.invoke('api:getPort') as Promise<number>,
  hasApiKey: () => ipcRenderer.invoke('api:hasKey') as Promise<boolean>,

  // Git API
  git: {
    init: (workspacePath: string) => ipcRenderer.invoke('git:init', workspacePath),
    status: (workspacePath: string) => ipcRenderer.invoke('git:status', workspacePath),
    createBranch: (workspacePath: string, name: string) =>
      ipcRenderer.invoke('git:createBranch', workspacePath, name),
    checkout: (workspacePath: string, name: string) =>
      ipcRenderer.invoke('git:checkout', workspacePath, name),
    currentBranch: (workspacePath: string) =>
      ipcRenderer.invoke('git:currentBranch', workspacePath),
    branches: (workspacePath: string) => ipcRenderer.invoke('git:branches', workspacePath),
    commit: (workspacePath: string, message: string) =>
      ipcRenderer.invoke('git:commit', workspacePath, message),
    merge: (workspacePath: string, branch: string) =>
      ipcRenderer.invoke('git:merge', workspacePath, branch),
    abortMerge: (workspacePath: string) => ipcRenderer.invoke('git:abortMerge', workspacePath),
    diff: (workspacePath: string, base: string, target?: string) =>
      ipcRenderer.invoke('git:diff', workspacePath, base, target),
    writeFile: (workspacePath: string, relativePath: string, content: string) =>
      ipcRenderer.invoke('git:writeFile', workspacePath, relativePath, content),
    readFile: (workspacePath: string, relativePath: string) =>
      ipcRenderer.invoke('git:readFile', workspacePath, relativePath),
    listFiles: (workspacePath: string, subPath: string) =>
      ipcRenderer.invoke('git:listFiles', workspacePath, subPath)
  },

  // Browser API
  browser: {
    navigate: (url: string) => ipcRenderer.invoke('browser:navigate', url),
    screenshot: () => ipcRenderer.invoke('browser:screenshot'),
    getHTML: () => ipcRenderer.invoke('browser:getHTML'),
    getText: () => ipcRenderer.invoke('browser:getText'),
    executeJS: (code: string) => ipcRenderer.invoke('browser:executeJS', code),
    getState: () => ipcRenderer.invoke('browser:getState'),
    showView: (url: string) => ipcRenderer.invoke('browser:showView', url),
    hideView: () => ipcRenderer.invoke('browser:hideView')
  },

  // FFmpeg API
  ffmpeg: {
    detect: () => ipcRenderer.invoke('ffmpeg:detect'),
    getInfo: (filePath: string) => ipcRenderer.invoke('ffmpeg:getInfo', filePath),
    concat: (files: string[], output?: string) => ipcRenderer.invoke('ffmpeg:concat', files, output),
    trim: (file: string, start: string, duration: string, output?: string) =>
      ipcRenderer.invoke('ffmpeg:trim', file, start, duration, output),
    transcode: (file: string, options: any, output?: string) =>
      ipcRenderer.invoke('ffmpeg:transcode', file, options, output),
    addSubtitle: (file: string, text: string, output?: string) =>
      ipcRenderer.invoke('ffmpeg:addSubtitle', file, text, output),
    extractAudio: (file: string, output?: string) =>
      ipcRenderer.invoke('ffmpeg:extractAudio', file, output),
    screenshot: (file: string, atTime: string, output?: string) =>
      ipcRenderer.invoke('ffmpeg:screenshot', file, atTime, output),
    outputDir: () => ipcRenderer.invoke('ffmpeg:outputDir'),
    selectFile: () => ipcRenderer.invoke('ffmpeg:selectFile')
  },

  // Scheduler API
  scheduler: {
    list: () => ipcRenderer.invoke('scheduler:list'),
    create: (task: any) => ipcRenderer.invoke('scheduler:create', task),
    update: (id: string, updates: any) => ipcRenderer.invoke('scheduler:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('scheduler:delete', id),
    get: (id: string) => ipcRenderer.invoke('scheduler:get', id),
    runOnce: (id: string) => ipcRenderer.invoke('scheduler:runOnce', id),
    getLogs: (taskId?: string) => ipcRenderer.invoke('scheduler:getLogs', taskId)
  },

  // Settings
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    getPresets: () => ipcRenderer.invoke('settings:getPresets'),
    add: (provider: string, apiKey: string, model: string) =>
      ipcRenderer.invoke('settings:add', provider, apiKey, model),
    updateKey: (id: string, apiKey: string) =>
      ipcRenderer.invoke('settings:updateKey', id, apiKey),
    updateModel: (id: string, model: string) =>
      ipcRenderer.invoke('settings:updateModel', id, model),
    remove: (id: string) => ipcRenderer.invoke('settings:remove', id),
    setActive: (id: string) => ipcRenderer.invoke('settings:setActive', id)
  },

  // Dialog
  selectDir: () => ipcRenderer.invoke('dialog:selectDir') as Promise<string | null>
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
