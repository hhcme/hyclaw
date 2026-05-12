import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, ChevronDown, ChevronRight, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DiffResult } from '@/types'

interface DiffCardProps {
  diffs: DiffResult[]
  onAccept?: () => void
  onReject?: () => void
  compact?: boolean
}

export function DiffCard({ diffs, onAccept, onReject, compact }: DiffCardProps) {
  const [expanded, setExpanded] = useState(!compact)
  const [activeFile, setActiveFile] = useState(0)

  if (diffs.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        无文件变更
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <FileText className="h-3 w-3" />
          文件变更 ({diffs.length})
        </button>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-emerald-500 mr-1">
            +{diffs.reduce((sum, d) => sum + d.newContent.split('\n').length, 0)}
          </span>
          <span className="text-[10px] text-red-500 mr-2">
            -{diffs.reduce((sum, d) => sum + d.oldContent.split('\n').length, 0)}
          </span>
          {onAccept && (
            <button onClick={onAccept} className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-emerald-600 hover:bg-emerald-500/10">
              <Check className="h-3 w-3" /> 应用
            </button>
          )}
          {onReject && (
            <button onClick={onReject} className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-red-500 hover:bg-red-500/10">
              <X className="h-3 w-3" /> 驳回
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <>
          {/* File tabs */}
          {diffs.length > 1 && (
            <div className="flex gap-0.5 border-b border-border bg-muted/20 px-1 py-1">
              {diffs.map((diff, idx) => (
                <button
                  key={diff.file}
                  onClick={() => setActiveFile(idx)}
                  className={cn(
                    'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                    activeFile === idx
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {diff.file}
                  <span className={cn(
                    'ml-1',
                    diff.changeType === 'added' ? 'text-emerald-500' :
                    diff.changeType === 'deleted' ? 'text-red-500' :
                    'text-yellow-500'
                  )}>
                    {{ added: 'A', modified: 'M', deleted: 'D' }[diff.changeType]}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Diff content */}
          <DiffContent diff={diffs[activeFile]} />
        </>
      )}
    </div>
  )
}

function DiffContent({ diff }: { diff: DiffResult }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [lineCount, setLineCount] = useState(0)

  useEffect(() => {
    setLineCount(Math.max(
      diff.oldContent.split('\n').length,
      diff.newContent.split('\n').length
    ))
  }, [diff])

  if (diff.changeType === 'added') {
    return <AddedContent content={diff.newContent} />
  }

  if (diff.changeType === 'deleted') {
    return <DeletedContent content={diff.oldContent} />
  }

  return <SideBySideDiff diff={diff} />
}

function AddedContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="overflow-auto max-h-80 bg-emerald-500/[0.03]">
      <div className="flex">
        <div className="select-none shrink-0 w-10 text-right text-[10px] text-muted-foreground/60 bg-emerald-500/5 px-1 py-0.5 border-r border-emerald-500/10 font-mono leading-5">
          {lines.map((_, i) => (
            <div key={i}>+</div>
          ))}
        </div>
        <div className="flex-1 font-mono text-xs leading-5 px-2 py-0.5">
          {lines.map((line, i) => (
            <div key={i} className="text-emerald-700 dark:text-emerald-400">
              {line || ' '}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DeletedContent({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="overflow-auto max-h-80 bg-red-500/[0.03]">
      <div className="flex">
        <div className="select-none shrink-0 w-10 text-right text-[10px] text-muted-foreground/60 bg-red-500/5 px-1 py-0.5 border-r border-red-500/10 font-mono leading-5">
          {lines.map((_, i) => (
            <div key={i}>-</div>
          ))}
        </div>
        <div className="flex-1 font-mono text-xs leading-5 px-2 py-0.5">
          {lines.map((line, i) => (
            <div key={i} className="text-red-700 dark:text-red-400">
              {line || ' '}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SideBySideDiff({ diff }: { diff: DiffResult }) {
  const oldLines = diff.oldContent.split('\n')
  const newLines = diff.newContent.split('\n')
  const maxLen = Math.max(oldLines.length, newLines.length)

  return (
    <div className="overflow-auto max-h-80">
      <div className="grid grid-cols-2 divide-x divide-border text-xs font-mono leading-5">
        {/* Old (left) */}
        <div className="min-w-0">
          <div className="sticky top-0 bg-muted/50 border-b border-border px-2 py-0.5 text-[10px] text-muted-foreground font-sans">
            旧版本
          </div>
          {Array.from({ length: maxLen }).map((_, i) => {
            const oldLine = oldLines[i]
            const newLine = newLines[i]
            const changed = oldLine !== newLine

            return (
              <div key={i} className={cn(
                'flex',
                changed && 'bg-red-500/[0.06]'
              )}>
                <span className="select-none shrink-0 w-8 text-right text-[10px] text-muted-foreground/50 px-1 border-r border-border/50">
                  {i + 1}
                </span>
                <span className={cn(
                  'flex-1 px-2 truncate',
                  changed ? 'text-red-700 dark:text-red-400' : 'text-muted-foreground'
                )}>
                  {oldLine || ' '}
                </span>
              </div>
            )
          })}
        </div>

        {/* New (right) */}
        <div className="min-w-0">
          <div className="sticky top-0 bg-muted/50 border-b border-border px-2 py-0.5 text-[10px] text-muted-foreground font-sans">
            新版本
          </div>
          {Array.from({ length: maxLen }).map((_, i) => {
            const oldLine = oldLines[i]
            const newLine = newLines[i]
            const changed = oldLine !== newLine

            return (
              <div key={i} className={cn(
                'flex',
                changed && 'bg-emerald-500/[0.06]'
              )}>
                <span className="select-none shrink-0 w-8 text-right text-[10px] text-muted-foreground/50 px-1 border-r border-border/50">
                  {i + 1}
                </span>
                <span className={cn(
                  'flex-1 px-2 truncate',
                  changed ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                )}>
                  {newLine || ' '}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
