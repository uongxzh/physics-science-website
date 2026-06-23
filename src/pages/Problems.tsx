import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SEO } from '../components/SEO'

interface Chapter {
  id: string
  name: string
  grade: string
  count: number
  problems: {
    id: string
    title: string
    chapter: string
    grade: string
    difficulty: number
    tags: string[]
    image?: string
    path: string
  }[]
}

interface Data {
  chapters: Chapter[]
  description: string
}

export default function Problems() {
  const [data, setData] = useState<Data | null>(null)
  const [active, setActive] = useState('')
  const [grade, setGrade] = useState('')

  useEffect(() => {
    fetch('/content/problems.json')
      .then(r => r.json())
      .then((json) => {
        setData(json)
        setActive(json.chapters[0]?.id || '')
      })
  }, [])

  const chapters = data?.chapters.filter(c => grade ? c.grade === grade : true) || []
  const current = chapters.find(c => c.id === active)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b' }}>
      <SEO title='题库与练习 - 悟理星球' description='沪科版初中物理题库' canonicalUrl='https://251119.xyz/problems' />
      <header style={{ background: 'linear-gradient(135deg, #1e3a5f, #2d5a87)', color: 'white', textAlign: 'center', padding: '40px 16px' }}>
        <Link to='/' style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>← 返回首页</Link>
        <h1>题库与练习</h1>
        <p>{data?.description}</p>
      </header>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          {['', '八年级', '九年级'].map(g => (
            <button key={g || 'all'} onClick={() => { setGrade(g); setActive(chapters.find(c => g ? c.grade === g : true)?.id || '') }} style={{ padding: '8px 16px', borderRadius: 999, border: '1px solid ' + (grade === g ? '#1a56db' : '#e2e8f0'), background: grade === g ? '#1a56db' : 'white', color: grade === g ? 'white' : '#64748b', cursor: 'pointer' }}>{g || '全部年级'}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24 }}>
          {chapters.map(c => (
            <button key={c.id} onClick={() => setActive(c.id)} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 999, border: '1px solid ' + (active === c.id ? '#1a56db' : '#e2e8f0'), background: active === c.id ? '#1a56db' : 'white', color: active === c.id ? 'white' : '#64748b', cursor: 'pointer' }}>{c.name} ({c.count})</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {current?.problems.map(p => (
            <Link key={p.id} to={'/problem/' + p.path} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, textDecoration: 'none', color: 'inherit' }}>
              {p.image && <div style={{ height: 160, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderRadius: 8 }}><img src={p.image} alt='' style={{ maxHeight: '100%', maxWidth: '100%' }} /></div>}
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ background: '#dbeafe', color: '#1a56db', padding: '2px 8px', borderRadius: 999, fontSize: 12 }}>{p.grade}</span>
                <span style={{ color: '#fbbf24', fontSize: 12 }}>{'★'.repeat(p.difficulty)}<span style={{ color: '#cbd5e1' }}>{'★'.repeat(5 - p.difficulty)}</span></span>
              </div>
              <h3 style={{ fontSize: 16, margin: '0 0 8px' }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>{p.chapter}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
