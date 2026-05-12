import { Button } from '@/components/ui/button'
import { AlertTriangle, GitMerge, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DiffCard } from '@/components/diff/DiffCard'
import type { DiffResult } from '@/types'

interface ConflictViewProps {
  conflictFiles: string[]
  ourDiffs: DiffResult[]
  theirDiffs: DiffResult[]
  onAcceptOurs: () => void
  onAcceptTheirs: () => void
  onManualResolve: () => void
  onAbort: () => void
}

export function ConflictView({
  conflictFiles,
  ourDiffs,
  theirDiffs,
  onAcceptOurs,
  onAcceptTheirs,
  onManualResolve,
  onAbort
}: ConflictViewProps) {
  return (
    <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/[0.03] overflow-hidden">
      {/* Banner */}
      <div className="flex items-center gap-2 border-b border-yellow-500/20 bg-yellow-500/10 px-3 py-2">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
          合并冲突
        </span>
        <span className="text-xs text-yellow-600/70 dark:text-yellow-500/70">
          {conflictFiles.length} 个文件
        </span>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onAbort} className="h-7 text-xs text-muted-foreground hover:text-red-500">
          <X className="mr-1 h-3 w-3" />
          取消合并
        </Button>
      </div>

      <div className="p-3 space-y-3">
        <p className="text-xs text-muted-foreground">
          以下文件在主分支和当前对话分支都被修改了，请选择处理方式。
        </p>

        <div className="flex flex-wrap gap-1">
          {conflictFiles.map((f) => (
            <span key={f} className="rounded bg-yellow-500/10 px-2 py-0.5 text-xs font-mono text-yellow-600 dark:text-yellow-400">
              {f}
            </span>
          ))}
        </div>

        {/* Side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-medium">当前分支 (ours)</span>
            </div>
            {ourDiffs.length > 0 && (
              <DiffCard diffs={ourDiffs} compact />
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full justify-start border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5"
              onClick={onAcceptOurs}
            >
              <GitMerge className="mr-2 h-3.5 w-3.5" />
              采用当前分支版本
            </Button>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-medium">目标分支 (theirs)</span>
            </div>
            {theirDiffs.length > 0 && (
              <DiffCard diffs={theirDiffs} compact />
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full justify-start border-blue-500/30 text-blue-600 hover:bg-blue-500/5"
              onClick={onAcceptTheirs}
            >
              <GitMerge className="mr-2 h-3.5 w-3.5" />
              采用目标分支版本
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onManualResolve} className="text-xs">
            <ArrowRight className="mr-1.5 h-3 w-3" />
            手动解决冲突
          </Button>
        </div>
      </div>
    </div>
  )
}
