import { SEO } from '../components/SEO'

export default function About() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <SEO
        title="关于老师 - 悟理星球"
        description="钟老师，初中物理骨干教师，15年教学经验，悟理星球创办人"
        canonicalUrl="https://251119.xyz/about"
      />

      {/* Warning Banner */}
      <div style={{
        background: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: 8,
        padding: '12px 16px', fontSize: '0.9rem', color: '#E65100', marginBottom: 24
      }}>
        ⚠️ 本页部分内容仍为占位模板，需钟老师本人补充。可编辑 src/pages/About.tsx 后重新部署。
      </div>

      {/* Breadcrumb */}
      <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 24 }}>
        首页 &gt; 关于老师
      </div>

      {/* Profile Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 48, alignItems: 'start', marginBottom: 48 }}>
        {/* Left: Photo */}
        <div>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            borderRadius: 16, height: 300, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '4rem'
          }}>
            👨‍🏫
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <p style={{ fontWeight: 600, fontSize: '1.1rem', color: '#f8fafc' }}>钟老师</p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 4 }}>物理教师 · 网站创办人</p>
          </div>
        </div>

        {/* Right: Info */}
        <div>
          <h1 style={{ fontSize: 36, color: '#f8fafc', marginBottom: 8 }}>钟老师</h1>
          <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: 16 }}>
            初中物理骨干教师 | 15年教学经验
          </p>
          <p style={{ color: '#cbd5e1', lineHeight: 1.8, marginBottom: 24 }}>
            [请填写毕业院校]，从教15年。[请填写荣誉及资质]。坚信"物理源于生活"，致力于用生动的教学方式让每一位学生都能理解物理的本质。[请填写教学风格介绍]。
          </p>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[['15', '年教龄'], ['3000+', '学生'], ['96%', '满意度'], ['12', '篇论文']].map(([n, l]) => (
              <div key={n} style={{ textAlign: 'center', padding: 16, background: '#1e293b', borderRadius: 12 }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6' }}>{n}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Teaching Philosophy */}
          <h2 style={{ fontSize: 20, color: '#f8fafc', marginBottom: 12 }}>教学理念</h2>
          <p style={{ fontSize: '1.1rem', fontStyle: 'italic', color: '#cbd5e1', borderLeft: '4px solid #3b82f6', paddingLeft: 16 }}>
            "物理不是背出来的，是理解出来的。"
          </p>
          <p style={{ color: '#94a3b8', marginTop: 12 }}>
            每一个学生都有学好物理的潜力，关键是找到适合他的理解方式。
          </p>
        </div>
      </div>

      {/* Teaching Features */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 24, color: '#f8fafc', marginBottom: 8 }}>教学特色</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>四大教学特色，帮助学生真正学好物理</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: '🌍', title: '生活化教学', desc: '从日常现象出发，让物理不再抽象。把知识点融入生活场景，让学生在熟悉的情境中理解物理规律。' },
            { icon: '🔬', title: '实验驱动', desc: '动手操作，在实践中理解原理。通过演示实验和学生动手实验，培养观察能力和科学思维。' },
            { icon: '🎯', title: '个性化辅导', desc: '关注每个学生的学习进度和薄弱点，因材施教，制定针对性的学习方案和练习计划。' },
            { icon: '💡', title: '科技赋能', desc: '运用现代科技让学习更高效有趣。借助互动模拟、可视化工具等手段提升学习体验。' },
          ].map(f => (
            <div key={f.title} style={{ padding: 20, background: '#1e293b', borderRadius: 12 }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ color: '#f8fafc', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 24, color: '#f8fafc', marginBottom: 8 }}>家长怎么说</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>来自真实家长和学生的反馈</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {[
            { quote: '张老师的课让孩子对物理产生了浓厚兴趣，成绩从60分提升到了85分！', author: '李女士', role: '初三家长' },
            { quote: '以前觉得物理很难，现在发现生活中到处都是物理知识，太有意思了！', author: '王同学', role: '初二学生' },
            { quote: '张老师非常负责，每次课后都会反馈孩子的学习情况，我们很满意。', author: '陈先生', role: '初二家长' },
            { quote: '跟着张老师复习了三个月，中考物理考了92分，感谢老师！', author: '赵同学', role: '初三学生' },
          ].map((t, i) => (
            <div key={i} style={{ padding: 20, background: '#1e293b', borderRadius: 12 }}>
              <p style={{ color: '#cbd5e1', lineHeight: 1.6, marginBottom: 12, fontStyle: 'italic' }}>「{t.quote}」</p>
              <p style={{ fontWeight: 600, color: '#f8fafc' }}>{t.author}</p>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{t.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div style={{ textAlign: 'center', padding: 32, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', borderRadius: 16, color: '#e2e8f0', marginBottom: 48 }}>
        <h2 style={{ fontSize: 24, color: '#f8fafc', marginBottom: 8 }}>有问题？随时联系</h2>
        <p style={{ opacity: 0.8, marginBottom: 8 }}>欢迎学生和家长通过以下方式与我交流，无论是学习问题还是建议反馈，我都会尽快回复。</p>
        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>contact@251119.xyz · 微信：[请填写微信号] ·251119.xyz · 中国 · 初中物理在线教育</p>
      </div>

      {/* FAQ */}
      <div>
        <h2 style={{ fontSize: 24, color: '#f8fafc', marginBottom: 8 }}>常见问题</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>关于网站的常见疑问解答</p>
        {[
          ['网站上的内容都是免费的吗？', '是的，悟理星球所有学习资源、实验模拟和知识图谱完全免费开放给所有初中生和家长使用。'],
          ['互动实验可以在手机上使用吗？', '可以！所有互动实验都针对手机和电脑做了适配，随时随地都能做实验。'],
          ['如何获取学习资料的下载链接？', '进入"学习资源"页面，找到需要的资料，点击"立即下载"按钮即可。'],
          ['有线下辅导课程吗？', '目前网站主要提供线上学习资源。如需了解线下课程，请通过留言功能联系老师。'],
          ['内容会定期更新吗？', '会！我会定期更新学习资料、添加新的互动实验，并根据中考大纲调整内容。'],
          ['家长如何了解孩子的学习进度？', '建议家长和孩子一起浏览网站内容，通过"知识图谱"功能可以直观看到知识点掌握情况。'],
        ].map(([q, a]) => (
          <div key={q} style={{ borderBottom: '1px solid #334155', padding: '16px 0' }}>
            <p style={{ fontWeight: 600, color: '#f8fafc' }}>{q}</p>
            <p style={{ color: '#94a3b8', marginTop: 8, fontSize: '0.9rem' }}>{a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
