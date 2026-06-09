import { useEffect, useMemo, useState } from 'react'
import { SEO } from '../components/SEO'
import { ChapterCard } from '../components/ChapterCard'
import { ChapterDetail } from '../components/ChapterDetail'

interface Chapter {
  id: string
  title: string
  description: string
  category: string
  order: number
  status: string
  word_count: number
  has_experiment: boolean
  has_problems: boolean
}

interface CategoryInfo {
  id: string
  name: string
  icon: string
  chapter_count: number
}

interface CurriculumData {
  version: string
  last_updated: string
  total_chapters: number
  categories: CategoryInfo[]
  chapters: Chapter[]
}

interface Experiment {
  id: string
  title: string
  embed_url: string
  tags: string[]
}

interface ExperimentsData {
  categories: Array<{
    id: string
    experiments: Experiment[]
  }>
}

export default function Learning() {
  const [curriculum, setCurriculum] = useState<CurriculumData | null>(null)
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/content/curriculum.json').then((r) => r.json()),
      fetch('/content/experiments.json')
        .then((r) => r.json() as Promise<ExperimentsData>)
        .catch(() => ({ categories: [] })),
    ])
      .then(([curriculumData, experimentsData]) => {
        setCurriculum(curriculumData)
        const allExps = experimentsData.categories?.flatMap((c) => c.experiments) || []
        setExperiments(allExps)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryInfo>()
    curriculum?.categories.forEach((c) => map.set(c.id, c))
    return map
  }, [curriculum])

  const filteredChapters = useMemo(() => {
    if (!curriculum) return []
    return curriculum.chapters.filter((ch) => {
      const matchesCategory = activeCategory === 'all' || ch.category === activeCategory
      const matchesSearch =
        search.trim() === '' ||
        ch.title.toLowerCase().includes(search.toLowerCase()) ||
        ch.description.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [curriculum, activeCategory, search])

  const stats = useMemo(() => {
    if (!curriculum) return { total: 0, complete: 0, draft: 0, empty: 0 }
    return curriculum.chapters.reduce(
      (acc, ch) => {
        acc.total++
        if (ch.status === 'complete') acc.complete++
        else if (ch.status === 'draft') acc.draft++
        else acc.empty++
        return acc
      },
      { total: 0, complete: 0, draft: 0, empty: 0 }
    )
  }, [curriculum])

  const selectedChapter = useMemo(
    () => curriculum?.chapters.find((c) => c.id === selectedChapterId),
    [curriculum, selectedChapterId]
  )

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#f8fafc',
        }}
      >
        <div style={{ color: '#64748b' }}>{'\u23f3'} 加载中...</div>
      </div>
    )
  }

  if (error || !curriculum) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#f8fafc',
          padding: 24,
        }}
      >
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '1.25rem', marginBottom: 8, color: '#b91c1c' }}>
            {'\u26a0\ufe0f'} 加载失败
          </div>
          <p>无法加载课程数据，请稍后重试。</p>
        </div>
      </div>
    )
  }

  if (selectedChapter && selectedChapterId) {
    return (
      <div
        style={{
          background: '#f8fafc',
          minHeight: '100vh',
          color: '#1e293b',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
          paddingTop: 24,
          paddingBottom: 60,
        }}
      >
        <SEO
          title={`${selectedChapter.title} - 学习中心 - 悟理星球`}
          description={selectedChapter.description}
          canonicalUrl={`https://251119.xyz/learning/${selectedChapter.id}`}
        />
        <ChapterDetail
          chapter={selectedChapter}
          category={categoryMap.get(selectedChapter.category) || { id: '', name: '', icon: '' }}
          experiments={experiments}
          onBack={() => setSelectedChapterId(null)}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#f8fafc',
        minHeight: '100vh',
        color: '#1e293b',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
      }}
    >
      <SEO
        title="学习中心 - 悟理星球"
        description="系统学习初中物理，从基础到进阶，覆盖中考全部考点"
        canonicalUrl="https://251119.xyz/learning"
      />

      <header
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
          color: 'white',
          padding: '40px 0 32px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              marginBottom: 16,
            }}
          >
            {'\u2190'} 返回首页
          </a>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>
            {'\ud83d\udcda'} 学习中心
          </h1>
          <p style={{ fontSize: '0.9375rem', opacity: 0.85, maxWidth: 520, margin: '0 auto' }}>
            五大模块，{curriculum.total_chapters}个章节，覆盖中考物理全部考点
          </p>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 12,
            padding: '24px 0 16px',
          }}
        >
          {[
            { label: '\u603b\u7ae0\u8282', value: stats.total, color: '#1e293b' },
            { label: '\u5df2\u5b8c\u6210', value: stats.complete, color: '#10b981' },
            { label: '\u8349\u7a3f', value: stats.draft, color: '#f59e0b' },
            { label: '\u5f85\u586b\u5145', value: stats.empty, color: '#94a3b8' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: 14,
                textAlign: 'center',
              }}
            >
              <div
                style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, lineHeight: 1 }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: '8px 0 16px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="\u641c\u7d22\u7ae0\u8282..."
            style={{
              width: '100%',
              maxWidth: 400,
              padding: '10px 16px',
              borderRadius: 9999,
              border: '1px solid #e2e8f0',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Category tabs */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            padding: '8px 0 16px',
            scrollbarWidth: 'none',
          }}
        >
          <button
            onClick={() => setActiveCategory('all')}
            style={{
              flexShrink: 0,
              padding: '8px 16px',
              borderRadius: 9999,
              border: '1px solid',
              borderColor: activeCategory === 'all' ? '#1a56db' : '#e2e8f0',
              background: activeCategory === 'all' ? '#1a56db' : '#ffffff',
              color: activeCategory === 'all' ? 'white' : '#64748b',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            全部
          </button>
          {curriculum.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: 9999,
                border: '1px solid',
                borderColor: activeCategory === cat.id ? '#1a56db' : '#e2e8f0',
                background: activeCategory === cat.id ? '#1a56db' : '#ffffff',
                color: activeCategory === cat.id ? 'white' : '#64748b',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Chapter grid */}
        <div style={{ padding: '8px 0 60px' }}>
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: 16,
            }}
          >
            全\u90e8课程
            <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 8 }}>
              共 {filteredChapters.length} 个章节
            </span>
          </h2>

          {filteredChapters.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#64748b',
              }}
            >
              <div style={{ fontSize: '1.25rem', marginBottom: 8 }}>{'\ud83d\udd0d'} 未找到相\u5173章节</div>
              <p>请\u5c1d\u8bd5\u5176\u4ed6\u641c\u7d22\u8bcd\u6216\u5207\u6362\u5206\u7c7b</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 20,
              }}
            >
              {filteredChapters.map((ch) => (
                <ChapterCard
                  key={ch.id}
                  chapter={ch}
                  category={categoryMap.get(ch.category) || { id: ch.category, name: ch.category, icon: '' }}
                  onClick={() => setSelectedChapterId(ch.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
