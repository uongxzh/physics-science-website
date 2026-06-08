import { SEO } from '../components/SEO'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <SEO
        title="悟理星球 - 初中物理学习平台"
        description="让物理不再难懂，用互动实验和可视化教学，帮孩子真正理解声、光、热、力、电的奥秘"
        canonicalUrl="https://251119.xyz/"
      />
      <header
        style={{
          textAlign: 'center',
          padding: '120px 24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        }}
      >
        <h1 style={{ fontSize: 48, marginBottom: 16, color: '#f8fafc' }}>
          悟理星球
        </h1>
        <p style={{ fontSize: 20, color: '#94a3b8', maxWidth: 600, margin: '0 auto' }}>
          让物理不再难懂，用互动实验和可视化教学，帮孩子真正理解声、光、热、力、电的奥秘
        </p>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 48 }}>
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 32, marginBottom: 32, textAlign: 'center' }}>探索物理世界</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { title: '力学', desc: '力与运动、压强、浮力、简单机械', img: '/force-diagram.png' },
              { title: '光学', desc: '光的传播、反射、折射、透镜成像', img: '/light-prism.png' },
              { title: '热学', desc: '温度、热量、比热容、物态变化', img: '/heat-molecules.png' },
              { title: '电学', desc: '电路、欧姆定律、电功率、电磁', img: '/circuit-flow.png' },
              { title: '声学', desc: '声音的产生、传播、特性与应用', img: '/sound-waves.png' },
              { title: '实验', desc: '互动虚拟实验，动手验证物理定律', img: '/lab-equipment.jpg' },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: '#1e293b',
                  borderRadius: 16,
                  overflow: 'hidden',
                  transition: 'transform 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <img src={item.img} alt={item.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 20, marginBottom: 8 }}>{item.title}</h3>
                  <p style={{ color: '#94a3b8', fontSize: 14 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
