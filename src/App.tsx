import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { SEO } from './components/SEO'
import { ProblemCard } from './components/ProblemCard'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Experiments = lazy(() => import('./pages/Experiments'))

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
      <SEO
        title="悟理星球 - 初中物理学习平台"
        description="让物理不再难懂，用互动实验和可视化教学，帮孩子真正理解声、光、热、力、电的奥秘"
        canonicalUrl="https://251119.xyz/"
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/experiments" element={<Experiments />} />
        <Route path="/problem/:filePath" element={<ProblemCardWrapper />} />
      </Routes>
    </Suspense>
  )
}

function ProblemCardWrapper() {
  // 根据路由参数加载对应题目
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <ProblemCard filePath="/content/problems/sample.json" />
    </div>
  )
}

export default App
