import { useState } from 'react'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { FolderOpen, Folder, Check } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectCreateDialog({ open, onOpenChange }: Props) {
  const { createProject } = useAppStore()
  const [dirPath, setDirPath] = useState('')
  const [projectName, setProjectName] = useState('')

  const handleSelectDir = async () => {
    try {
      const path = await window.electronAPI?.selectDir?.()
      if (path) {
        setDirPath(path)
        const name = path.split('/').pop() || path.split('\\').pop() || '新项目'
        setProjectName(name)
      }
    } catch {}
  }

  const handleCreate = async () => {
    if (!projectName.trim() || !dirPath.trim()) return
    createProject(projectName.trim(), dirPath.trim())

    // Init git in the project directory
    try {
      await window.electronAPI?.git?.init(dirPath.trim())
    } catch {}

    onOpenChange(false)
    setDirPath('')
    setProjectName('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">新建项目</DialogTitle>
          <DialogDescription>
            选择项目所在目录，项目名称默认为文件夹名。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Directory selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">项目目录</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Folder className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={dirPath}
                  onChange={(e) => {
                    setDirPath(e.target.value)
                    if (!projectName || projectName === dirPath.split('/').pop()) {
                      const name = e.target.value.split('/').pop() || ''
                      setProjectName(name)
                    }
                  }}
                  placeholder="选择或输入项目目录..."
                  className="pl-8 text-xs font-mono"
                />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleSelectDir}>
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Project name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">项目名称</label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="输入项目名称"
              className="text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            />
          </div>

          {/* Summary */}
          {dirPath && projectName && (
            <div className="rounded-md bg-muted/30 p-3 space-y-1 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Folder className="h-3.5 w-3.5" />
                <span className="font-mono truncate">{dirPath}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-[10px]">创建后将自动初始化 Git 仓库并添加 PM Agent</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>取消</Button>
            <Button className="flex-1" onClick={handleCreate} disabled={!projectName.trim() || !dirPath.trim()}>
              <Check className="mr-1.5 h-4 w-4" />
              创建项目
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
