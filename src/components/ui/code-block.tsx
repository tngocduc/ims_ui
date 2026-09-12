import * as React from 'react'
import { getHighlighter } from 'shiki'
import { Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  lang?: string
  className?: string
  showLineNumbers?: boolean
}

export function CodeBlock({ code, lang = 'json', className, showLineNumbers = false }: CodeBlockProps) {
  const [html, setHtml] = React.useState('')
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    getHighlighter({ themes: ['github-dark'], langs: [lang] }).then((highlighter) => {
      if (mounted) {
        setHtml(highlighter.codeToHtml(code, { lang, theme: 'github-dark', lineNumbers: showLineNumbers }))
      }
    })
    return () => { mounted = false }
  }, [code, lang, showLineNumbers])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!html) {
    return (
      <pre className={cn('p-4 font-mono text-sm bg-bg-base border border-border-subtle rounded-[4px] overflow-x-auto', className)}>
        <code>{code}</code>
      </pre>
    )
  }

  return (
    <div className={cn('group relative bg-bg-base border border-border-subtle rounded-[4px] overflow-hidden', className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-bg-surface">
        <span className="text-xs text-text-muted font-mono uppercase tracking-wider">{lang}</span>
        <button
          onClick={handleCopy}
          className="p-1.5 text-text-muted hover:text-text-primary transition-colors rounded-[4px] hover:bg-bg-surface-hover opacity-0 group-hover:opacity-100"
          aria-label="Copy to clipboard"
        >
          <Copy className={cn('h-4 w-4', copied && 'text-accent')} />
        </button>
      </div>
      <pre className="p-4 overflow-x-auto max-h-[500px]">
        <code className="font-mono text-sm leading-relaxed">{html}</code>
      </pre>
    </div>
  )
}

interface InlineCodeProps {
  children: React.ReactNode
  className?: string
}

export function InlineCode({ children, className }: InlineCodeProps) {
  return (
    <code className={cn('font-mono text-sm px-1.5 py-0.5 bg-bg-surface border border-border-subtle rounded-[4px]', className)}>
      {children}
    </code>
  )
}