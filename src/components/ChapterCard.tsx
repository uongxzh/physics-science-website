interface Chapter {
  id: string
  title: string
  description: string
  category: string
  status: string
  word_count: number
  has_experiment: boolean
  has_problems: boolean
}

interface CategoryInfo {
  id: string
  name: string
  icon: string
}

interface ChapterCardProps {
  chapter: Chapter
  category: CategoryInfo
  onClick: () => void
}

export function ChapterCard({ chapter, category, onClick }: ChapterCardProps) {
  const statusColor =
    chapter.status === 'complete'
      ? '#10b981'
      : chapter.status === 'draft'
      ? '#f59e0b'
      : '#94a3b8'

  const statusText =
    chapter.status === 'complete'
      ? '\u5df2\u5b8c\u6210'
      : chapter.status === 'draft'
      ? '\u8349\u7a3f'
      : '\u5f85\u586b\u5145'

  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#3b82f6'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.1)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e2e8f0'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: '1.25rem' }}>{category.icon}</span>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {category.name}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: statusColor,
            background: `${statusColor}15`,
            padding: '4px 10px',
            borderRadius: 9999,
          }}
        >
          {statusText}
        </span>
      </div>

      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
        {chapter.title}
      </h3>

      <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>
        {chapter.description}
      </p>

      <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: '#94a3b8' }}>
        <span>
          {'\u270d\ufe0f'} {chapter.word_count}字
        </span>
        {chapter.has_experiment && <span>{'\ud83e\uddea'} 实验</span>}
        {chapter.has_problems && <span>{'\ud83d\udcdd'} 习题</span>}
      </div>
    </button>
  )
}
