import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, ChevronDown, ChevronRight, Edit3, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentCardProps {
  title: string
  content: string
  compact?: boolean
  onEdit?: () => void
}

export function DocumentCard({ title, content, compact, onEdit }: DocumentCardProps) {
  const [expanded, setExpanded] = useState(!compact)

  const plainText = content.replace(/<[^>]+>/g, '').slice(0, 200)

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
          {title}
        </button>
        {onEdit && (
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onEdit}>
            <Edit3 className="mr-1 h-3 w-3" />
            编辑
          </Button>
        )}
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-3">
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-xs"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}

      {/* Preview line when collapsed */}
      {!expanded && (
        <div className="px-3 py-2 text-xs text-muted-foreground/60 truncate">
          {plainText || '(空文档)'}
        </div>
      )}
    </div>
  )
}
