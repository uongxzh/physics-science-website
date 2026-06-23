import { Routes, Route, Link } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ProblemCard } from './components/ProblemCard'
import { useParams } from 'react-router-dom'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Experiments = lazy(() => import('./pages/Experiments'))
const Videos = lazy(() => import('./pages/Videos'))
const Problems = lazy(() => import('./pages/Problems'))

function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>加载中...</div>
    </div>
  )
}

function Navbar() {
  const linkStyle = {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: 8,
    transition: 'all 0.2s',
  }

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #1e293b',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <Link to="/" style={{ color: '#f8fafc', textDecoration: 'none', fontWeight: 700, fontSize: '1.2rem' }}>
        悟理星球
      </Link>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link to="/experiments" style={linkStyle}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.background = '#1e293b' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent' }}
        >🔬 实验</Link>
        <Link to="/videos" style={linkStyle}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.background = '#1e293b' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent' }}
        >🎬 视频</Link>
        <Link to="/problems" style={linkStyle}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.background = '#1e293b' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent' }}
        >✍️ 题库</Link>
        <Link to="/about" style={linkStyle}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.background = '#1e293b' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent' }}
        >关于</Link>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/experiments" element={<Experiments />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/problems" element={<Problems />} />
        <Route path="/problem/*" element={<ProblemCardWrapper />} />
      </Routes>
    </Suspense>
  )
}

function ProblemCardWrapper() {
  const { '*': filePath } = useParams<{ '*': string }>()
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, background: '#0f172a', minHeight: '100vh' }}>
      <Link to="/problems" style={{ color: '#94a3b8', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>← 返回题库</Link>
      <ProblemCard filePath={`/content/problems/${filePath}`} />
    </div>
  )
}

export default App
