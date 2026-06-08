import { useEffect, useState } from 'react'
import { SEO } from '../components/SEO'

interface Experiment {
  id: string
  title: string
  description: string
  category: string
  difficulty: number
  image: string
}

export default function Experiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([])

  useEffect(() => {
    fetch('/content/experiments.json')
      .then((res) => res.json())
      .then((data) => setExperiments(data.experiments || []))
      .catch(() => setExperiments([]))
  }, [])

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
      <SEO
        title="物理实验 - 悟理星球"
        description="动手做实验，验证物理定律。悟理星球提供丰富的互动虚拟实验，让物理学习更直观。"
        canonicalUrl="https://251119.xyz/experiments"
      />
      <h1 style={{ fontSize: 36, marginBottom: 8, textAlign: 'center' }}>物理实验</h1>
      <p style={{ textAlign: 'center', color: '#94a3b8', marginBottom: 48 }}>
        动手做实验，验证物理定律
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        {experiments.map((exp) => (
          <div
            key={exp.id}
            style={{
              background: '#1e293b',
              borderRadius: 16,
              overflow: 'hidden',
              padding: 24,
            }}
          >
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>{exp.title}</h3>
            <p style={{ color: '#94a3b8', marginBottom: 12 }}>{exp.description}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ background: '#334155', padding: '4px 12px', borderRadius: 999, fontSize: 12 }}>
                {exp.category}
              </span>
              <span style={{ background: '#334155', padding: '4px 12px', borderRadius: 999, fontSize: 12 }}>
                难度: {'★'.repeat(exp.difficulty)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
