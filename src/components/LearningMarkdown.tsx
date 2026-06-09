import { useMemo } from 'react'

interface LearningMarkdownProps {
  content: string
}

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const boldRegex = /\*\*(.+?)\*\*|__(.+?)__/g
  let lastIndex = 0
  let match

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(parseItalicAndCode(text.slice(lastIndex, match.index)))
    }
    parts.push(<strong key={match.index}>{match[1] || match[2]}</strong>)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(parseItalicAndCode(text.slice(lastIndex)))
  }

  return parts.length > 0 ? parts : parseItalicAndCode(text)
}

function parseItalicAndCode(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /`(.+?)`|\*(.+?)\*/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`t-${match.index}`}>{text.slice(lastIndex, match.index)}</span>)
    }
    if (match[0].startsWith('`')) {
      parts.push(
        <code
          key={match.index}
          style={{
            background: '#1e293b',
            color: '#e2e8f0',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: '0.875em',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          }}
        >
          {match[1]}
        </code>
      )
    } else {
      parts.push(<em key={match.index}>{match[2]}</em>)
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`t-end`}>{text.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : text
}

export function LearningMarkdown({ content }: LearningMarkdownProps) {
  const elements = useMemo(() => {
    const lines = content.split('\n')
    const result: React.ReactNode[] = []
    let inCodeBlock = false
    let codeLines: string[] = []
    let listItems: React.ReactNode[] = []
    let listType: 'ul' | 'ol' | null = null

    const flushList = () => {
      if (listItems.length === 0) return
      const ListTag = listType === 'ol' ? 'ol' : 'ul'
      result.push(
        <ListTag
          key={`list-${result.length}`}
          style={{
            paddingLeft: 20,
            marginBottom: 16,
            lineHeight: 1.7,
            color: '#334155',
          }}
        >
          {listItems}
        </ListTag>
      )
      listItems = []
      listType = null
    }

    const flushCode = () => {
      if (codeLines.length === 0) return
      result.push(
        <pre
          key={`code-${result.length}`}
          style={{
            background: '#0f172a',
            color: '#e2e8f0',
            padding: 16,
            borderRadius: 8,
            overflowX: 'auto',
            fontSize: '0.875rem',
            marginBottom: 16,
          }}
        >
          <code style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
            {codeLines.join('\n')}
          </code>
        </pre>
      )
      codeLines = []
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      if (trimmed.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true
          continue
        } else {
          inCodeBlock = false
          flushCode()
          continue
        }
      }

      if (inCodeBlock) {
        codeLines.push(line)
        continue
      }

      if (i === 0 && trimmed === '---') {
        let j = 1
        while (j < lines.length && lines[j].trim() !== '---') j++
        i = j
        continue
      }
      if (trimmed === '---') continue

      if (trimmed === '') {
        flushList()
        continue
      }

      if (trimmed.startsWith('# ')) {
        flushList()
        result.push(
          <h1
            key={`h-${result.length}`}
            style={{ fontSize: '1.75rem', fontWeight: 700, margin: '32px 0 16px', color: '#0f172a' }}
          >
            {parseInline(trimmed.slice(2))}
          </h1>
        )
        continue
      }
      if (trimmed.startsWith('## ')) {
        flushList()
        result.push(
          <h2
            key={`h-${result.length}`}
            style={{ fontSize: '1.375rem', fontWeight: 600, margin: '28px 0 12px', color: '#1e293b' }}
          >
            {parseInline(trimmed.slice(3))}
          </h2>
        )
        continue
      }
      if (trimmed.startsWith('### ')) {
        flushList()
        result.push(
          <h3
            key={`h-${result.length}`}
            style={{ fontSize: '1.125rem', fontWeight: 600, margin: '20px 0 10px', color: '#334155' }}
          >
            {parseInline(trimmed.slice(4))}
          </h3>
        )
        continue
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const newType: 'ul' = 'ul'
        if (listType && listType !== newType) flushList()
        listType = newType
        listItems.push(
          <li key={`li-${i}`} style={{ marginBottom: 6 }}>
            {parseInline(trimmed.slice(2))}
          </li>
        )
        continue
      }
      if (/^\d+\.\s/.test(trimmed)) {
        const newType: 'ol' = 'ol'
        if (listType && listType !== newType) flushList()
        listType = newType
        const text = trimmed.replace(/^\d+\.\s/, '')
        listItems.push(
          <li key={`li-${i}`} style={{ marginBottom: 6 }}>
            {parseInline(text)}
          </li>
        )
        continue
      }

      if (trimmed.startsWith('> ')) {
        flushList()
        result.push(
          <blockquote
            key={`bq-${result.length}`}
            style={{
              borderLeft: '4px solid #3b82f6',
              paddingLeft: 16,
              margin: '16px 0',
              color: '#475569',
              fontStyle: 'italic',
            }}
          >
            {parseInline(trimmed.slice(2))}
          </blockquote>
        )
        continue
      }

      if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
        flushList()
        result.push(<hr key={`hr-${result.length}`} style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '24px 0' }} />)
        continue
      }

      flushList()
      result.push(
        <p
          key={`p-${result.length}`}
          style={{ lineHeight: 1.8, marginBottom: 14, color: '#334155' }}
        >
          {parseInline(trimmed)}
        </p>
      )
    }

    flushList()
    flushCode()
    return result
  }, [content])

  return <div style={{ fontSize: '1rem' }}>{elements}</div>
}
