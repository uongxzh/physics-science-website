import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SEO } from '../components/SEO'

interface Experiment {
  id: string
  title: string
  description: string
  source: string
  embed_url: string
  thumbnail: string
  difficulty: string
  duration: string
  tags: string[]
}

interface Category {
  id: string
  name: string
  icon: string
  experiments: Experiment[]
}

interface ExperimentsData {
  categories: Category[]
}

export default function Experiments() {
  const [data, setData] = useState<ExperimentsData | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/content/experiments.json')
      .then((res) => res.json())
      .then((json) => {
        setData(json)
        if (json.categories?.length > 0) {
          setActiveCategory(json.categories[0].id)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const currentCategory = data?.categories.find((c) => c.id === activeCategory)

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ color: '#64748b' }}>加载中...</div>
      </div>
    )
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif' }}>
      <SEO
        title="虚拟实验室 - 悟理星球"
        description="初中物理虚拟实验平台，在线操作声光热力电实验"
        canonicalUrl="https://251119.xyz/experiments"
      />

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)', color: 'white', padding: '40px 0 32px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: 16 }}>
            ← 返回首页
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>🔬 虚拟实验室</h1>
          <p style={{ fontSize: '0.9375rem', opacity: 0.85, maxWidth: 500, margin: '0 auto' }}>
            在线操作 PhET 互动实验，亲手验证物理定律
          </p>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '20px 0 8px', scrollbarWidth: 'none' }}>
          {data?.categories.map((cat) => (
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

        {/* Experiment Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, padding: '20px 0 40px' }}>
          {currentCategory?.experiments.map((exp) => (
            <div
              key={exp.id}
              onClick={() => setActiveExperiment(exp)}
              style={{
                background: '#ffffff',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 160,
                  background: exp.thumbnail ? `url(${exp.thumbnail}) center/cover` : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1a56db',
                  fontSize: '2rem',
                }}
              >
                {!exp.thumbnail && '🔬'}
              </div>
              <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 9999,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    marginBottom: 10,
                    width: 'fit-content',
                    background: exp.difficulty === '基础' ? '#dcfce7' : exp.difficulty === '中等' ? '#fef9c3' : '#fee2e2',
                    color: exp.difficulty === '基础' ? '#166534' : exp.difficulty === '中等' ? '#854d0e' : '#991b1b',
                  }}
                >
                  {exp.difficulty}
                </span>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: 6 }}>{exp.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 12, flex: 1 }}>{exp.description}</p>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 'auto' }}>
                  <span>⏱️ {exp.duration}</span>
                  <span>📚 {exp.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {activeExperiment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
          onClick={() => setActiveExperiment(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 960,
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{activeExperiment.title}</h3>
              <button
                onClick={() => setActiveExperiment(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <iframe
                src={activeExperiment.embed_url}
                style={{ width: '100%', height: '100%', minHeight: 500, border: 'none' }}
                allow="fullscreen"
                title={activeExperiment.title}
              />
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {activeExperiment.tags.map((tag) => (
                <span key={tag} style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', color: '#475569' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
