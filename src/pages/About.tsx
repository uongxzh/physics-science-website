import { SEO } from '../components/SEO'

export default function About() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
      <SEO
        title="关于我们 - 悟理星球"
        description="悟理星球是一个专注于初中物理学习的在线教育平台，致力于通过互动实验和可视化教学让物理变得简单有趣。"
        canonicalUrl="https://251119.xyz/about"
      />
      <h1 style={{ fontSize: 36, marginBottom: 24 }}>关于悟理星球</h1>
      <p style={{ fontSize: 16, lineHeight: 1.8, color: '#cbd5e1', marginBottom: 16 }}>
        悟理星球是一个专注于初中物理学习的在线教育平台。我们相信，物理不应该只是公式和计算的堆砌，而应该是对自然规律的探索和理解。
      </p>
      <p style={{ fontSize: 16, lineHeight: 1.8, color: '#cbd5e1', marginBottom: 16 }}>
        通过互动实验、可视化演示和AI辅助学习，我们帮助学生真正理解声、光、热、力、电的奥秘，让物理变得简单有趣。
      </p>
      <h2 style={{ fontSize: 24, margin: '32px 0 16px' }}>平台特色</h2>
      <ul style={{ paddingLeft: 24, color: '#cbd5e1', lineHeight: 2 }}>
        <li>互动虚拟实验 - 动手操作，验证物理定律</li>
        <li>可视化教学 - 抽象概念直观呈现</li>
        <li>AI智能出题 - 个性化练习，针对薄弱点</li>
        <li>知识体系完整 - 覆盖初中物理全部章节</li>
      </ul>
    </div>
  )
}
