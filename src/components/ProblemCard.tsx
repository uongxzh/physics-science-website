import { useEffect, useState } from 'react'

interface Problem {
  title: string
  question: string
  options?: string[]
  answer: string
  explanation: string
  keyPoint: string
  mistake: string
  difficulty: number
  chapter: string
  image?: string
  meta: {
    generatedAt: string
    topic: string
    grade: string
  }
}

export function ProblemCard({ filePath }: { filePath: string }) {
  const [problem, setProblem] = useState<Problem | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(filePath)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then((data) => setProblem(data))
      .catch((err) => {
        console.error('Failed to load problem:', err)
        setError('题目加载失败')
      })
  }, [filePath])

  if (error) return <div style={{ padding: 24, color: '#ef4444' }}>{error}</div>
  if (!problem) return <div style={{ padding: 24 }}>加载中...</div>

  return (
    <article
      style={{
        background: '#1e293b',
        borderRadius: 16,
        padding: 24,
        margin: '16px 0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      }}
    >
      <header style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span
          style={{
            background: '#3b82f6',
            color: 'white',
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: 12,
          }}
        >
          {problem.meta.grade}
        </span>
        <span
          style={{
            background: '#8b5cf6',
            color: 'white',
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: 12,
          }}
        >
          {problem.chapter}
        </span>
        <span style={{ color: '#fbbf24', fontSize: 14 }}>
          {'★'.repeat(problem.difficulty)}
          <span style={{ color: '#475569' }}>{'★'.repeat(5 - problem.difficulty)}</span>
        </span>
      </header>

      <h2 style={{ fontSize: 20, marginBottom: 16, color: '#f8fafc' }}>{problem.title}</h2>

      {problem.image && (
        <img
          src={problem.image}
          alt={problem.title}
          style={{
            width: '100%',
            maxWidth: 480,
            maxHeight: 260,
            objectFit: 'contain',
            marginBottom: 16,
            borderRadius: 12,
            background: '#0f172a',
            display: 'block',
          }}
        />
      )}

      <div
        style={{ marginBottom: 16, lineHeight: 1.8 }}
        dangerouslySetInnerHTML={{ __html: problem.question.replace(/\$(.*?)\$/g, '<code style="background:#0f172a;padding:2px 6px;border-radius:4px;">$1</code>') }}
      />

      {problem.options && (
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: 16 }}>
          {problem.options.map((opt, i) => (
            <li
              key={i}
              style={{
                padding: '8px 12px',
                marginBottom: 8,
                background: '#334155',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setShowAnswer(!showAnswer)}
        style={{
          background: showAnswer ? '#475569' : '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 14,
          marginBottom: 16,
        }}
      >
        {showAnswer ? '🔒 隐藏解析' : '🔓 查看解析'}
      </button>

      {showAnswer && (
        <div
          style={{
            background: '#0f172a',
            padding: 16,
            borderRadius: 12,
            border: '1px solid #334155',
          }}
        >
          <p style={{ marginBottom: 12, color: '#4ade80' }}>
            <strong>答案：</strong>
            {problem.answer}
          </p>
          <div
            style={{ marginBottom: 12, lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{
              __html: problem.explanation.replace(/\$(.*?)\$/g, '<code style="background:#1e293b;padding:2px 6px;border-radius:4px;">$1</code>'),
            }}
          />
          <p style={{ marginBottom: 8, color: '#60a5fa' }}>
            <strong>💡 考点：</strong>
            {problem.keyPoint}
          </p>
          <p style={{ color: '#f87171' }}>
            <strong>⚠️ 易错点：</strong>
            {problem.mistake}
          </p>
        </div>
      )}

      <footer style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #334155' }}>
        <small style={{ color: '#64748b' }}>
          生成时间：{new Date(problem.meta.generatedAt).toLocaleDateString('zh-CN')}
        </small>
      </footer>
    </article>
  )
}
