import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CodeBlock from '@tiptap/extension-code-block'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import {
  Bold, Italic, Code, List, ListOrdered, Quote,
  Table2, ImagePlus, Heading1, Heading2, Eye, Edit3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface DocumentEditorProps {
  content: string
  onChange?: (html: string) => void
  readOnly?: boolean
  placeholder?: string
  className?: string
}

export function DocumentEditor({
  content,
  onChange,
  readOnly = false,
  placeholder = '开始编写文档...',
  className
}: DocumentEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>(readOnly ? 'preview' : 'edit')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false // Use our custom one
      }),
      CodeBlock.configure({
        HTMLAttributes: { class: 'bg-muted rounded-md border border-border p-3 text-xs font-mono' }
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: true }),
      Placeholder.configure({ placeholder })
    ],
    content,
    editable: !readOnly && mode === 'edit',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] p-3',
          className
        )
      }
    }
  })

  // Sync content when prop changes
  if (editor && content !== editor.getHTML() && !editor.isFocused) {
    editor.commands.setContent(content)
  }

  if (!editor) return null

  return (
    <div className="rounded-md border border-border overflow-hidden">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
          <ToolButton editor={editor} action="bold" icon={Bold} />
          <ToolButton editor={editor} action="italic" icon={Italic} />
          <ToolButton editor={editor} action="code" icon={Code} />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolButton editor={editor} action="heading1" icon={Heading1} />
          <ToolButton editor={editor} action="heading2" icon={Heading2} />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolButton editor={editor} action="bulletList" icon={List} />
          <ToolButton editor={editor} action="orderedList" icon={ListOrdered} />
          <ToolButton editor={editor} action="blockquote" icon={Quote} />
          <ToolButton editor={editor} action="codeBlock" icon={Code} />
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
          >
            {mode === 'edit' ? (
              <><Eye className="h-3 w-3" /> 预览</>
            ) : (
              <><Edit3 className="h-3 w-3" /> 编辑</>
            )}
          </Button>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}

function ToolButton({
  editor,
  action,
  icon: Icon
}: {
  editor: any
  action: string
  icon: React.ComponentType<{ className?: string }>
}) {
  const isActive = editor.isActive(action) ||
    (action === 'heading1' && editor.isActive('heading', { level: 1 })) ||
    (action === 'heading2' && editor.isActive('heading', { level: 2 }))

  const run = () => {
    switch (action) {
      case 'bold': editor.chain().focus().toggleBold().run(); break
      case 'italic': editor.chain().focus().toggleItalic().run(); break
      case 'code': editor.chain().focus().toggleCode().run(); break
      case 'heading1': editor.chain().focus().toggleHeading({ level: 1 }).run(); break
      case 'heading2': editor.chain().focus().toggleHeading({ level: 2 }).run(); break
      case 'bulletList': editor.chain().focus().toggleBulletList().run(); break
      case 'orderedList': editor.chain().focus().toggleOrderedList().run(); break
      case 'blockquote': editor.chain().focus().toggleBlockquote().run(); break
      case 'codeBlock': editor.chain().focus().toggleCodeBlock().run(); break
    }
  }

  return (
    <button
      onClick={run}
      className={cn(
        'rounded p-1 transition-colors',
        isActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
      )}
      title={action}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}
