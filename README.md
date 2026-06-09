# 悟理星球 - 初中物理学习平台

[![Deploy Status](https://github.com/uongxzh/physics-science-website/actions/workflows/deploy.yml/badge.svg)](https://github.com/uongxzh/physics-science-website/actions/workflows/deploy.yml)
[![Link Check](https://github.com/uongxzh/physics-science-website/actions/workflows/links.yml/badge.svg)](https://github.com/uongxzh/physics-science-website/actions/workflows/links.yml)

🔗 **在线访问**: [https://251119.xyz](https://251119.xyz)

---

## 🏗️ 架构

- **前端**: React 18 + TypeScript + Vite
- **样式**: CSS Modules / 原生 CSS
- **部署**: GitHub Pages (通过 GitHub Actions 自动构建部署)
- **CDN**: Cloudflare (可选)
- **分析**: Google Analytics 4 + Microsoft Clarity

---

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
npm run type-check
```

---

## 🤖 AI 内容生成

```bash
# 设置 API Key
$env:DEEPSEEK_API_KEY="your-api-key"

# 生成每日题目和知识点
npm run generate

# 验证生成内容
npm run validate content/problems/2026-06-08-xxx.json
```

## 🔍 进化引擎

```bash
# 扫描课程缺口（空章节、内容不足、缺实验/习题）
npm run scan-gaps
# 或指定输入/输出路径
npx tsx scripts/scan-gaps.ts [curriculum.json] [gaps-report.json]

# 物理质检（公式检查 + 超纲检测 + LLM 深度审查）
npm run physics-qa
# 或指定章节目录/输出路径
npx tsx scripts/physics-qa.ts [chapters-dir] [qa-report.json]
# 需要 Gemini API Key
$env:GEMINI_API_KEY="your-api-key"

# 运行单元测试
npm test
```

---

## 📁 目录结构

```
.
├── .github/workflows/    # CI/CD 工作流
├── content/              # AI 生成的内容数据
│   ├── problems/         # 物理题目
│   ├── knowledge/        # 知识点
│   └── experiments/      # 实验数据
├── public/               # 静态资源（图片等）
├── scripts/              # AI 内容生成脚本
├── src/
│   ├── components/       # 组件
│   ├── pages/            # 页面
│   └── App.tsx           # 路由配置
├── vite.config.ts        # Vite 配置（含图片优化、Sitemap）
└── lighthouserc.js       # Lighthouse CI 性能门禁
```

---

## 🔧 自动化维护体系

| 功能 | 工具 | 触发方式 |
|------|------|----------|
| 构建部署 | GitHub Actions | push 到 main 分支 |
| 性能检测 | Lighthouse CI | 每次部署前 |
| 死链检测 | Lychee | 每周日凌晨 |
| 站点监控 | GitHub Actions curl | 每6小时 |
| SSL 监控 | action-ssl-cert-expiry-checker | 每6小时 |
| 依赖更新 | Dependabot | 每周一 |
| 索引提交 | IndexNow | push / 每12小时 |
| 图片优化 | vite-plugin-image-optimizer | 构建时 |
| 代码检查 | ESLint + TypeScript | 构建时 |

---

## ⚙️ 配置说明

### GitHub Secrets

在仓库 **Settings → Secrets and variables → Actions** 中配置：

| Secret | 用途 | 必需 |
|--------|------|------|
| `INDEXNOW_KEY` | Bing 自动索引提交 | 可选 |

### 第三方服务配置

| 服务 | 配置位置 | 说明 |
|------|----------|------|
| Google Analytics 4 | `index.html` | 替换 `G-XXXXXXXXXX` |
| Microsoft Clarity | `index.html` | 替换 `YOUR_PROJECT_ID` |
| Sentry | `src/main.tsx` | 取消注释并替换 DSN |
| DeepSeek API | 本地环境变量 | `$env:DEEPSEEK_API_KEY` |

---

## 📄 许可证

MIT
