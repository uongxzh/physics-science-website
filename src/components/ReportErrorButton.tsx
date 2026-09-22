import { useState } from 'react'

interface ReportErrorButtonProps {
  chapterId: string
  chapterTitle: string
}

const GITHUB_REPO = 'uongxzh/physics-science-website'

function buildPrefilledIssueUrl(
  chapterId: string,
  chapterTitle: string,
  description: string
): string {
  const title = `[content-bug] ${chapterTitle} (${chapterId})`
  const body = [
    '## 章节',
    `- ID: ${chapterId}`,
    `- 标题: ${chapterTitle}`,
    '',
    '## 错误描述',
    description,
    '',
    '## 来源',
    '网页报告错误按钮',
  ].join('\n')

  const params = new URLSearchParams({ labels: 'content-bug', title, body })
  return `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}`
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export function ReportErrorButton({ chapterId, chapterTitle }: ReportErrorButtonProps) {
  const [showForm, setShowForm] = useState(false)
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit() {
    const text = description.trim()
    if (!text) return

    setStatus('submitting')
    setErrorMessage('')

    const apiEndpoint =
      (import.meta.env.VITE_CONTENT_BUG_API as string | undefined) ||
      '/api/report-content-bug'

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          chapterTitle,
          description: text,
        }),
      })

      const contentType = response.headers.get('content-type') || ''
      const isHtmlFallback = contentType.includes('text/html')

      if (response.ok && !isHtmlFallback) {
        setStatus('success')
        setDescription('')
        return
      }

      // Serverless endpoint not deployed: fall back to GitHub's prefilled issue form.
      if (response.status === 404 || response.status === 405 || isHtmlFallback) {
        window.open(
          buildPrefilledIssueUrl(chapterId, chapterTitle, text),
          '_blank',
          'noopener,noreferrer'
        )
        setStatus('success')
        setDescription('')
        return
      }

      const message = await response.text().catch(() => '')
      throw new Error(message || `创建 Issue 失败 (${response.status})`)
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : '创建 Issue 失败，请稍后重试')
    }
  }

  if (status === 'success') {
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
        ✅ 反馈已提交，感谢您的建议！
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
          📋 发现错误？点此反馈
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
          <h4 style={{ marginBottom: 12, color: '#0f172a' }}>反馈：{chapterTitle}</h4>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请描述您发现的问题..."
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
          {status === 'error' && (
            <p style={{ color: '#b91c1c', fontSize: '0.875rem', marginBottom: 12 }}>
              {errorMessage}
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowForm(false)
                setStatus('idle')
                setErrorMessage('')
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={status === 'submitting'}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#3b82f6',
                color: '#ffffff',
                cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                opacity: status === 'submitting' ? 0.6 : 1,
              }}
            >
              {status === 'submitting' ? '提交中...' : '提交反馈'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
