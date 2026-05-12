import fs from 'node:fs'
import path from 'node:path'

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

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    provider: 'kimi',
    label: 'Kimi (月之暗面)',
    baseURL: 'https://api.moonshot.cn/anthropic',
    models: ['kimi-k2.6']
  },
  {
    provider: 'glm',
    label: 'GLM (智谱)',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['GLM-5.1']
  },
  {
    provider: 'deepseek',
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    models: ['deepseek-v4-pro']
  },
  {
    provider: 'minimax',
    label: 'MiniMax',
    baseURL: 'https://api.minimaxi.com/v1',
    models: ['MiniMax-M2.7']
  },
  {
    provider: 'anthropic',
    label: 'Anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    models: ['claude-sonnet-4-20250514']
  }
]

const defaultSettings: AppSettings = {
  activeProviderId: null,
  providers: []
}

const settingsPath = path.join(process.env.HOME || '/tmp', 'hyclaw-data', 'settings.json')

let settings: AppSettings = { ...defaultSettings }

function loadSettings(): void {
  try {
    if (!fs.existsSync(settingsPath)) return
    const data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    settings = { ...defaultSettings, ...data }
    // Activate the first provider if available
    if (settings.activeProviderId && !settings.providers.find((p) => p.id === settings.activeProviderId)) {
      settings.activeProviderId = settings.providers[0]?.id ?? null
    }
    applyActiveToEnv()
  } catch {}
}

function saveSettings(): void {
  try {
    const dir = path.dirname(settingsPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
  } catch {}
}

function applyActiveToEnv(): void {
  const active = getActiveProvider()
  if (active) {
    process.env.ANTHROPIC_API_KEY = active.apiKey
    process.env.ANTHROPIC_BASE_URL = active.baseURL
    process.env.ANTHROPIC_MODEL = active.model
  }
}

// Load on startup
loadSettings()

export function getSettings(): AppSettings {
  return {
    activeProviderId: settings.activeProviderId,
    providers: settings.providers.map((p) => ({
      ...p,
      apiKey: maskKey(p.apiKey)
    }))
  }
}

export function getActiveProvider(): ProviderEntry | null {
  if (!settings.activeProviderId) return null
  return settings.providers.find((p) => p.id === settings.activeProviderId) ?? null
}

export function addProvider(provider: string, apiKey: string, model: string): AppSettings {
  const preset = PROVIDER_PRESETS.find((p) => p.provider === provider)
  if (!preset) return getSettings()

  const entry: ProviderEntry = {
    id: `prov-${Date.now()}`,
    provider,
    apiKey,
    model,
    baseURL: preset.baseURL
  }

  settings.providers.push(entry)
  if (!settings.activeProviderId) {
    settings.activeProviderId = entry.id
  }
  applyActiveToEnv()
  saveSettings()
  return getSettings()
}

export function updateProviderKey(id: string, apiKey: string): AppSettings {
  const idx = settings.providers.findIndex((p) => p.id === id)
  if (idx === -1) return getSettings()
  settings.providers[idx].apiKey = apiKey
  if (settings.activeProviderId === id) applyActiveToEnv()
  saveSettings()
  return getSettings()
}

export function updateProviderModel(id: string, model: string): AppSettings {
  const idx = settings.providers.findIndex((p) => p.id === id)
  if (idx === -1) return getSettings()
  settings.providers[idx].model = model
  if (settings.activeProviderId === id) applyActiveToEnv()
  saveSettings()
  return getSettings()
}

export function removeProvider(id: string): AppSettings {
  settings.providers = settings.providers.filter((p) => p.id !== id)
  if (settings.activeProviderId === id) {
    settings.activeProviderId = settings.providers[0]?.id ?? null
  }
  applyActiveToEnv()
  saveSettings()
  return getSettings()
}

export function setActiveProvider(id: string): AppSettings {
  if (settings.providers.find((p) => p.id === id)) {
    settings.activeProviderId = id
    applyActiveToEnv()
    saveSettings()
  }
  return getSettings()
}

function maskKey(key: string): string {
  if (!key || key.length < 8) return ''
  return key.slice(0, 4) + '…' + key.slice(-4)
}
