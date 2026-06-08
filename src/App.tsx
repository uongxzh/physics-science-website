import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { SEO } from './components/SEO'
import { ProblemCard } from './components/ProblemCard'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Experiments = lazy(() => import('./pages/Experiments'))
const Videos = lazy(() => import('./pages/Videos'))

function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>加载中...</div>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/experiments" element={<Experiments />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/problem/:filePath" element={<ProblemCardWrapper />} />
      </Routes>
    </Suspense>
  )
}

function ProblemCardWrapper() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <ProblemCard filePath="/content/problems/sample.json" />
    </div>
  )
}

export default App
