import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  Trash2, Plus, Check, Settings, Eye, EyeOff, Loader2,
  Radio, Key, Cpu, Globe
} from 'lucide-react'
import type { AppSettings, ProviderEntry, ProviderPreset } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: Props) {
  const [settings, setSettings] = useState<AppSettings>({ activeProviderId: null, providers: [] })
  const [presets, setPresets] = useState<ProviderPreset[]>([])
  const [loaded, setLoaded] = useState(false)

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [addProvider, setAddProvider] = useState('anthropic')
  const [addKey, setAddKey] = useState('')
  const [addModel, setAddModel] = useState('')
  const [showAddKey, setShowAddKey] = useState(false)

  // Edit key
  const [editId, setEditId] = useState<string | null>(null)
  const [editKey, setEditKey] = useState('')
  const [showEditKey, setShowEditKey] = useState(false)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    Promise.all([
      window.electronAPI?.settings?.get(),
      window.electronAPI?.settings?.getPresets()
    ]).then(([s, p]) => {
      if (s) setSettings(s)
      if (p) {
        setPresets(p)
        if (p.length > 0) {
          setAddModel(p[0].models[0])
        }
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [open])

  const activePreset = presets.find((p) => p.provider === addProvider)

  const handleAdd = async () => {
    if (!addKey.trim()) return
    setSaving(true)
    try {
      const result = await window.electronAPI?.settings?.add(addProvider, addKey.trim(), addModel)
      if (result) setSettings(result)
      setAddKey('')
      setShowAdd(false)
      setAddProvider('anthropic')
      if (presets.length > 0) setAddModel(presets[0].models[0])
    } finally { setSaving(false) }
  }

  const handleUpdateKey = async () => {
    if (!editId || !editKey.trim()) return
    setSaving(true)
    try {
      const result = await window.electronAPI?.settings?.updateKey(editId, editKey.trim())
      if (result) setSettings(result)
      setEditId(null)
      setEditKey('')
    } finally { setSaving(false) }
  }

  const handleUpdateModel = async (id: string, model: string) => {
    const result = await window.electronAPI?.settings?.updateModel(id, model)
    if (result) setSettings(result)
  }

  const handleRemove = async (id: string) => {
    const result = await window.electronAPI?.settings?.remove(id)
    if (result) setSettings(result)
  }

  const handleSetActive = async (id: string) => {
    const result = await window.electronAPI?.settings?.setActive(id)
    if (result) setSettings(result)
  }

  const activeProvider = settings.providers.find((p) => p.id === settings.activeProviderId)
  const activePresetForProvider = (provider: string) => presets.find((p) => p.provider === provider)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">


        {!loaded ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Provider list */}
            {settings.providers.length > 0 ? (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {settings.providers.map((entry) => {
                  const preset = activePresetForProvider(entry.provider)
                  const isActive = entry.id === settings.activeProviderId

                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        'rounded-lg border p-3 transition-colors',
                        isActive
                          ? 'border-blue-500/50 bg-blue-500/[0.04]'
                          : 'border-border hover:border-border/80'
                      )}
                    >
                      {/* Edit mode */}
                      {editId === entry.id ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{preset?.label || entry.provider}</span>
                            <span className="text-xs text-muted-foreground">{entry.model}</span>
                          </div>
                          <div className="relative">
                            <Input
                              type={showEditKey ? 'text' : 'password'}
                              value={editKey}
                              onChange={(e) => setEditKey(e.target.value)}
                              placeholder="输入新的 API Key"
                              className="pr-10 font-mono text-xs"
                              autoFocus
                              onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateKey() }}
                            />
                            <button
                              onClick={() => setShowEditKey(!showEditKey)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showEditKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <div className="flex gap-1.5">
                            <Button size="sm" className="h-7 text-xs" onClick={handleUpdateKey} disabled={saving}>
                              {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                              确认
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setEditId(null); setEditKey('') }}>
                              取消
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Normal mode */}
                          <div className="flex items-start gap-3">
                            {/* Radio to select active */}
                            <button
                              onClick={() => handleSetActive(entry.id)}
                              className={cn(
                                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                isActive
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-muted-foreground/30'
                              )}
                            >
                              {isActive && <div className="h-2 w-2 rounded-full bg-white" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {preset?.label || entry.provider}
                                </span>
                                {isActive && (
                                  <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-500">
                                    当前使用
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Cpu className="h-3 w-3" />
                                  {entry.model}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Key className="h-3 w-3" />
                                  {entry.apiKey || '(未设置)'}
                                </span>
                              </div>

                              {/* Model selector (only for active) */}
                              {isActive && preset && (
                                <div className="mt-2">
                                  <Select value={entry.model} onValueChange={(v) => handleUpdateModel(entry.id, v)}>
                                    <SelectTrigger className="h-7 text-xs w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                      {preset.models.map((m) => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={() => { setEditId(entry.id); setEditKey('') }}
                                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent"
                                title="修改 Key"
                              >
                                <Key className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemove(entry.id)}
                                className="rounded p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                title="删除"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed border-border">
                <Globe className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">还没添加模型服务商</p>
                <p className="text-xs text-muted-foreground/50">添加后将自动配置为当前使用的服务商</p>
              </div>
            )}

            {/* Add form */}
            {showAdd ? (
              <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
                <div className="text-xs font-medium text-muted-foreground">添加服务商</div>

                <Select value={addProvider} onValueChange={(v) => {
                  setAddProvider(v)
                  const p = presets.find((pr) => pr.provider === v)
                  if (p) setAddModel(p.models[0])
                }}>
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {presets.map((p) => (
                      <SelectItem key={p.provider} value={p.provider}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={addModel} onValueChange={setAddModel}>
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {activePreset?.models.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Input
                    type={showAddKey ? 'text' : 'password'}
                    value={addKey}
                    onChange={(e) => setAddKey(e.target.value)}
                    placeholder={`${activePreset?.label || ''} API Key`}
                    className="pr-10 font-mono text-xs"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
                  />
                  <button
                    onClick={() => setShowAddKey(!showAddKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAddKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-xs flex-1" onClick={handleAdd} disabled={!addKey.trim() || saving}>
                    <Check className="mr-1 h-3 w-3" /> 添加
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowAdd(false); setAddKey('') }}>
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowAdd(true)}
              >
                <Plus className="mr-2 h-3.5 w-3.5" />
                添加服务商
              </Button>
            )}

            {/* Status */}
            {activeProvider ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/5 rounded-md px-3 py-2">
                <Check className="h-3.5 w-3.5 shrink-0" />
                <span>当前使用：{presets.find((p) => p.provider === activeProvider.provider)?.label || activeProvider.provider} · {activeProvider.model}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-yellow-600 bg-yellow-500/5 rounded-md px-3 py-2">
                <Settings className="h-3.5 w-3.5 shrink-0" />
                未选择服务商，将使用离线模拟模式
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
