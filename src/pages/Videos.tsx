import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SEO } from '../components/SEO'

interface Video {
  id: string
  title: string
  description: string
  platform: string
  bvid: string
  duration: string
  thumbnail: string
  tags: string[]
}

interface Category {
  id: string
  name: string
  videos: Video[]
}

interface VideosData {
  categories: Category[]
}

export default function Videos() {
  const [data, setData] = useState<VideosData | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/content/videos.json')
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
        title="视频课堂 - 悟理星球"
        description="初中物理视频学习资源，精选名师讲解"
        canonicalUrl="https://251119.xyz/videos"
      />

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)', color: 'white', padding: '40px 0 32px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: 16 }}>
            ← 返回首页
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>🎬 视频课堂</h1>
          <p style={{ fontSize: '0.9375rem', opacity: 0.85, maxWidth: 500, margin: '0 auto' }}>
            精选物理教学视频，名师讲解深入浅出
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
              {cat.name}
            </button>
          ))}
        </div>

        {/* Video Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, padding: '20px 0 40px' }}>
          {currentCategory?.videos.map((video) => (
            <div
              key={video.id}
              style={{
                background: '#ffffff',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
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
              {/* Video Thumbnail / Player */}
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)' }}>
                {activeVideo?.id === video.id ? (
                  <iframe
                    src={`https://player.bilibili.com/player.html?bvid=${video.bvid}&autoplay=1`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', borderRadius: '16px 16px 0 0' }}
                    allow="fullscreen; autoplay"
                    title={video.title}
                  />
                ) : (
                  <div
                    style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#64748b', cursor: 'pointer' }}
                    onClick={() => setActiveVideo(video)}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#1a56db',
                        color: 'white',
                        border: 'none',
                        fontSize: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(26,86,219,0.3)',
                        transition: 'transform 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      ▶
                    </div>
                    <span style={{ fontSize: '0.875rem' }}>{video.duration}</span>
                  </div>
                )}
              </div>

              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>{video.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 10 }}>{video.description}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {video.tags.map((tag) => (
                    <span key={tag} style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: 999, fontSize: '0.75rem', color: '#475569' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
