import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DocumentEditor } from './DocumentEditor'
import { Plus, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Doc {
  id: string
  title: string
  content: string
}

export function DocumentPanel() {
  const [docs, setDocs] = useState<Doc[]>([
    {
      id: 'doc-1',
      title: 'API 文档',
      content: '<h2>API 文档</h2><p>项目 API 接口文档</p><h3>GET /api/users</h3><p>获取用户列表</p><pre><code>fetch("/api/users")</code></pre>'
    }
  ])
  const [activeDocId, setActiveDocId] = useState<string | null>('doc-1')
  const [editing, setEditing] = useState(false)

  const activeDoc = docs.find((d) => d.id === activeDocId)

  const handleNewDoc = () => {
    const id = `doc-${Date.now()}`
    const newDoc: Doc = { id, title: '新文档', content: '' }
    setDocs([newDoc, ...docs])
    setActiveDocId(id)
    setEditing(true)
  }

  const handleUpdateContent = (html: string) => {
    if (!activeDoc) return
    setDocs(docs.map((d) => (d.id === activeDoc.id ? { ...d, content: html } : d)))
  }

  const handleUpdateTitle = (title: string) => {
    if (!activeDoc) return
    setDocs(docs.map((d) => (d.id === activeDoc.id ? { ...d, title } : d)))
  }

  if (!activeDoc && docs.length > 0) {
    setActiveDocId(docs[0].id)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-medium">文档</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewDoc} title="新建文档">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Doc list + editor */}
      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center p-4">
          <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground mb-3">暂无文档</p>
          <Button variant="outline" size="sm" onClick={handleNewDoc}>
            <Plus className="mr-1.5 h-3 w-3" />
            新建文档
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Doc list sidebar */}
          <div className="w-28 shrink-0 border-r border-border overflow-y-auto p-1.5 space-y-0.5">
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => { setActiveDocId(doc.id); setEditing(false) }}
                className={cn(
                  'w-full rounded px-2 py-1.5 text-left text-xs transition-colors',
                  doc.id === activeDocId
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50'
                )}
              >
                <div className="truncate">{doc.title}</div>
                <div className="text-[10px] text-muted-foreground/50 truncate">
                  {doc.content.replace(/<[^>]+>/g, '').slice(0, 30)}
                </div>
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            {activeDoc && (
              <div className="h-full flex flex-col">
                {/* Title + edit toggle */}
                <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
                  {editing ? (
                    <input
                      value={activeDoc.title}
                      onChange={(e) => handleUpdateTitle(e.target.value)}
                      className="flex-1 bg-transparent text-sm font-medium outline-none"
                    />
                  ) : (
                    <span className="text-sm font-medium flex-1">{activeDoc.title}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setEditing(!editing)}
                  >
                    {editing ? '预览' : '编辑'}
                  </Button>
                </div>
                <div className="flex-1 overflow-auto">
                  <DocumentEditor
                    content={activeDoc.content}
                    onChange={handleUpdateContent}
                    readOnly={!editing}
                    placeholder={`编写 ${activeDoc.title}...`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
