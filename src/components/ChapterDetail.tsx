import { useEffect, useState } from 'react'
import { LearningMarkdown } from './LearningMarkdown'

interface Chapter {
  id: string
  title: string
  category: string
}

interface Experiment {
  id: string
  title: string
  embed_url: string
  tags: string[]
}

interface CategoryInfo {
  id: string
  name: string
  icon: string
}

interface ChapterDetailProps {
  chapter: Chapter
  category: CategoryInfo
  experiments: Experiment[]
  onBack: () => void
}

export function ChapterDetail({ chapter, category, experiments, onBack }: ChapterDetailProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`/content/chapters/${chapter.id}.md`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load')
        return res.text()
      })
      .then((text) => {
        // Strip YAML frontmatter for display
        const cleaned = text.replace(/^---\n[\s\S]*?\n---\n?/, '')
        setContent(cleaned.trim() || '# ' + chapter.title + '\n\n\u672c\u7ae0\u5185\u5bb9\u5c1a\u672a\u586b\u5145\u3002')
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [chapter.id, chapter.title])

  const matchedExperiments = experiments.filter(
    (exp) =>
      exp.tags.some((tag) =>
        [chapter.title, category.name].some((term) => tag.includes(term))
      ) || exp.tags.some((tag) => chapter.id.toLowerCase().includes(tag.toLowerCase()))
  )

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '1.125rem' }}>{'\u23f3'} 加载中...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: '#3b82f6',
          background: 'transparent',
          border: 'none',
          padding: 0,
          fontSize: '0.875rem',
          cursor: 'pointer',
          marginBottom: 20,
        }}
      >
        {'\u2190'} 返回学习中心
      </button>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          color: '#64748b',
          fontSize: '0.875rem',
        }}
      >
        <span>{category.icon}</span>
        <span>{category.name}</span>
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>
        {chapter.title}
      </h1>

      {error ? (
        <div
          style={{
            padding: 24,
            background: '#fef2f2',
            color: '#b91c1c',
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          {'\u26a0\ufe0f'} 加载章节内容失败，请稍后重试。
        </div>
      ) : (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '28px 32px',
            marginBottom: 32,
          }}
        >
          <LearningMarkdown content={content} />
        </div>
      )}

      {matchedExperiments.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: 16,
            }}
          >
            {'\ud83e\uddea'} 相关实验
          </h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {matchedExperiments.map((exp) => (
              <div
                key={exp.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: 16, borderBottom: '1px solid #f1f5f9' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                    {exp.title}
                  </h3>
                </div>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={exp.embed_url}
                    title={exp.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                    allowFullScreen
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <FeedbackButton chapterId={chapter.id} chapterTitle={chapter.title} />
    </div>
  )
}

function FeedbackButton({ chapterId, chapterTitle }: { chapterId: string; chapterTitle: string }) {
  const [showForm, setShowForm] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div
        style={{
          padding: 16,
          background: '#f0fdf4',
          color: '#15803d',
          borderRadius: 8,
          textAlign: 'center',
        }}
      >
        {'\u2705'} 反馈已记录，\u611f\u8c22\u60a8\u7684\u5efa\u8bae\uff01
      </div>
    )
  }

  return (
    <div style={{ marginTop: 24 }}>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            color: '#64748b',
            background: 'transparent',
            border: '1px dashed #cbd5e1',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          {'\ud83d\udccb'} 发\u73b0\u9519\u8bef\uff1f\u70b9\u6b64\u53cd\u9988
        </button>
      ) : (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h4 style={{ marginBottom: 12, color: '#0f172a' }}>
            \u53cd\u9988：{chapterTitle}
          </h4>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="\u8bf7\u63cf\u8ff0\u60a8\u53d1\u73b0\u7684\u95ee\u9898..."
            style={{
              width: '100%',
              minHeight: 100,
              padding: 12,
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              marginBottom: 12,
            }}
          />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              \u53d6\u6d88
            </button>
            <button
              onClick={() => {
                if (!feedback.trim()) return
                const title = encodeURIComponent(`[content-bug] ${chapterTitle} (${chapterId})`)
                const body = encodeURIComponent(
                  `## \u7ae0\u8282\n- ID: ${chapterId}\n- \u6807\u9898: ${chapterTitle}\n\n## \u95ee\u9898\u63cf\u8ff0\n${feedback}\n\n## \u6765\u6e90\n\u7f51\u9875\u53cd\u9988\u6309\u94ae`
                )
                window.open(
                  `https://github.com/uongxzh/physics-science-website/issues/new?labels=content-bug&title=${title}&body=${body}`,
                  '_blank'
                )
                setSubmitted(true)
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#3b82f6',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              \u63d0\u4ea4\u53cd\u9988
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
