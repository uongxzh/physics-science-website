#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface QAViolation {
  severity: "error" | "warning";
  type: "concept" | "formula" | "scope" | "safety";
  message: string;
  line?: number;
}

export interface QAReport {
  chapter_id: string;
  passed: boolean;
  violations: QAViolation[];
}

// 初中物理超纲关键词（高中/大学物理内容）
const OUT_OF_SCOPE_KEYWORDS = [
  "微积分",
  "导数",
  "积分",
  "向量叉乘",
  "矢量积",
  "散度",
  "旋度",
  "拉普拉斯",
  "麦克斯韦方程组",
  "薛定谔方程",
  "相对论",
  "洛伦兹变换",
  "质能方程",
  "E=mc²",
  "量子力学",
  "波函数",
  "不确定性原理",
  "热力学第二定律",
  "熵增",
  "理想气体状态方程",
  "PV=nRT",
  "气体状态方程",
  "普朗克常数",
  "黑体辐射",
  "光电效应",
];

// 安全相关关键词
const SAFETY_KEYWORDS = [
  "高压",
  "触电",
  "爆炸",
  "化学试剂",
  "强酸",
  "强碱",
  "辐射",
  "激光",
  "易燃",
  "有毒",
];

// 按学科分类的物理规则
interface PhysicsRule {
  id: string;
  category: string;
  severity: "error" | "warning";
  type: "concept" | "formula" | "scope" | "safety";
  message: string;
  check: (content: string, lines: string[]) => Array<{ line?: number }>;
}

const PHYSICS_RULES: PhysicsRule[] = [
  // ========== 力学 ==========
  {
    id: "mech-fma-accel",
    category: "mechanics",
    severity: "warning",
    type: "concept",
    message: "F=ma 应配合加速度说明，提醒学生力会改变运动状\u6001",
    check: (content) =>
      /F\s*=\s*ma|F=ma/i.test(content) && !content.includes("加速度") ? [{ line: undefined }] : [],
  },
  {
    id: "mech-buoyancy-direction",
    category: "mechanics",
    severity: "error",
    type: "concept",
    message: "浮力方向必\u987b竖\u76f4\u5411\u4e0a，不\u80fd\u8bf4\u6210\u5176\u4ed6\u65b9\u5411",
    check: (content) =>
      content.includes("浮力") && /浮力.*(水平|向下|斜向)/.test(content) ? [{ line: undefined }] : [],
  },
  {
    id: "mech-pressure-liquid",
    category: "mechanics",
    severity: "warning",
    type: "concept",
    message: "p=ρgh 仅\u9002\u7528\u4e8e\u6db2\u4f53\u538b\u5f3a，\u4e0d\u9002\u7528\u4e8e\u56fa\u4f53",
    check: (content) =>
      /p\s*=\s*ρgh|p=ρgh/.test(content) && content.includes("固体") && content.includes("压强")
        ? [{ line: undefined }]
        : [],
  },

  // ========== 光学 ==========
  {
    id: "optics-reflection-law",
    category: "optics",
    severity: "error",
    type: "concept",
    message: "反\u5c04\u89d2\u5fc5\u987b\u7b49\u4e8e\u5165\u5c04\u89d2，不\u80fd\u5199\u6210\u53cd\u5c04\u89d2\u5927\u4e8e\u6216\u5c0f\u4e8e\u5165\u5c04\u89d2",
    check: (content) =>
      content.includes("反射角") &&
      /反射角\s*[<>＜＞]\s*入射角/.test(content)
        ? [{ line: undefined }]
        : [],
  },
  {
    id: "optics-refraction-air-water",
    category: "optics",
    severity: "error",
    type: "concept",
    message: "光\u4ece\u7a7a\u6c14\u659c\u5c04\u5165\u6c34，\u6298\u5c04\u89d2\u5fc5\u987b\u5c0f\u4e8e\u5165\u5c04\u89d2",
    check: (content) =>
      content.includes("空气") &&
      content.includes("水") &&
      content.includes("折射") &&
      /折射角\s*[>＞]\s*入射角/.test(content)
        ? [{ line: undefined }]
        : [],
  },
  {
    id: "optics-lens-u-gt-2f",
    category: "optics",
    severity: "error",
    type: "concept",
    message: "凸\u900f\u955c u>2f 时\u5e94\u6210\u5012\u7acb\u7f29\u5c0f\u7684\u5b9e\u50cf，不\u80fd\u5199\u6210\u653e\u5927\u6216\u6b63\u7acb",
    check: (content) =>
      content.includes("凸透镜") &&
      /u\s*>\s*2f/.test(content) &&
      /(正立|放大|虚像)/.test(content)
        ? [{ line: undefined }]
        : [],
  },

  // ========== 电学 ==========
  {
    id: "elec-short-circuit",
    category: "electricity",
    severity: "error",
    type: "safety",
    message: "严\u7981\u6b63\u9762\u63cf\u8ff0\u7535\u6e90\u77ed\u8def\u4f5c\u4e3a\u53ef\u884c\u65b9\u6cd5",
    check: (content) =>
      /(?<!防止|避免|不能|禁止).*电源短路|短路.*可行|可以.*短路/.test(content)
        ? [{ line: undefined }]
        : [],
  },
  {
    id: "elec-ammeter-series",
    category: "electricity",
    severity: "error",
    type: "concept",
    message: "电\u6d41\u8868\u5fc5\u987b\u4e0e\u7528\u7535\u5668\u4e32\u8054，不\u80fd\u5e76\u8054",
    check: (content) =>
      content.includes("电流表") &&
      /电流表.*并联|并联.*电流表/.test(content)
        ? [{ line: undefined }]
        : [],
  },
  {
    id: "elec-voltmeter-parallel",
    category: "electricity",
    severity: "error",
    type: "concept",
    message: "电\u538b\u8868\u5fc5\u987b\u4e0e\u7528\u7535\u5668\u5e76\u8054，不\u80fd\u4e32\u8054",
    check: (content) =>
      content.includes("电压表") &&
      /电压表.*串联|串联.*电压表/.test(content)
        ? [{ line: undefined }]
        : [],
  },
  {
    id: "elec-ohms-law-units",
    category: "electricity",
    severity: "warning",
    type: "formula",
    message: "I=U/R 使\u7528\u65f6\u5e94\u6ce8\u610f\u5355\u4f4d\u7edf\u4e00（A、V、Ω）",
    check: (content) =>
      /I\s*=\s*U\/R|I=U\/R/.test(content) && !content.includes("单位") ? [{ line: undefined }] : [],
  },

  // ========== 热学 ==========
  {
    id: "thermal-heat-formula-units",
    category: "thermal",
    severity: "warning",
    type: "formula",
    message: "Q=cmΔt 中\u7684温\u5dee应\u4f7f\u7528\u6444\u6c0f\u5ea6（°C），不\u662f\u5f00\u5c14\u6587",
    check: (content) =>
      /Q\s*=\s*cmΔt|Q=cmΔt/.test(content) && /开尔文|K/.test(content)
        ? [{ line: undefined }]
        : [],
  },
  {
    id: "thermal-specific-heat-definition",
    category: "thermal",
    severity: "warning",
    type: "concept",
    message: "比\u70ed\u5bb9\u662f\u7269\u8d28\u7684\u4e00\u79cd\u7279\u6027，与\u8d28\u91cf\u65e0\u5173",
    check: (content) =>
      content.includes("比热容") &&
      /比热容.*(质量|多少|增大.*质量)/.test(content)
        ? [{ line: undefined }]
        : [],
  },

  // ========== 声学 ==========
  {
    id: "acoustics-pitch-frequency",
    category: "acoustics",
    severity: "error",
    type: "concept",
    message: "音\u8c03\u4e0e\u9891\u7387\u6210\u6b63\u6bd4，不\u80fd\u5199\u6210\u53cd\u6bd4",
    check: (content) =>
      content.includes("音调") &&
      content.includes("频率") &&
      /音调.*频率.*反比|频率.*音调.*反比/.test(content)
        ? [{ line: undefined }]
        : [],
  },
  {
    id: "acoustics-speed-of-sound",
    category: "acoustics",
    severity: "warning",
    type: "concept",
    message: "声\u901f\u5728\u7a7a\u6c14\u4e2d\u7ea6 340m/s，若\u5199\u6210\u5176\u4ed6\u6570\u503c\u9700\u8bf4\u660e\u6761\u4ef6",
    check: (content) =>
      content.includes("声速") &&
      /声速.*\d{3,}/.test(content) &&
      !/340|15°C|15℃/.test(content)
        ? [{ line: undefined }]
        : [],
  },
];

function inferCategory(chapterId: string, content: string): string {
  const idToCategory: Record<string, string> = {
    sound: "acoustics",
    light: "optics",
    lens: "optics",
    mirror: "optics",
    dispersion: "optics",
    refraction: "optics",
    reflection: "optics",
    temperature: "thermal",
    melting: "thermal",
    vaporization: "thermal",
    sublimation: "thermal",
    heat: "thermal",
    specific: "thermal",
    motion: "mechanics",
    velocity: "mechanics",
    force: "mechanics",
    gravity: "mechanics",
    friction: "mechanics",
    newton: "mechanics",
    pressure: "mechanics",
    buoyancy: "mechanics",
    machine: "mechanics",
    work: "mechanics",
    mechanical: "mechanics",
    electric: "electricity",
    circuit: "electricity",
    current: "electricity",
    voltage: "electricity",
    resistance: "electricity",
    ohm: "electricity",
    power: "electricity",
    magnetism: "electricity",
  };

  for (const [key, cat] of Object.entries(idToCategory)) {
    if (chapterId.toLowerCase().includes(key)) return cat;
  }

  // Fallback: scan first heading or YAML frontmatter
  const categoryMatch = content.match(/category:\s*(\w+)/);
  if (categoryMatch) return categoryMatch[1];

  return "";
}

export function runStructuredQA(chapterId: string, content: string): QAViolation[] {
  const violations: QAViolation[] = [];
  const lines = content.split("\n");
  const category = inferCategory(chapterId, content);

  // 1. 公式书写检查：$ 符号是\u5426成对
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip YAML frontmatter
    if (i === 0 && line.trim() === "---") continue;
    if (line.trim().startsWith("---")) continue;

    const dollarCount = (line.match(/\$/g) || []).length;
    if (dollarCount % 2 !== 0) {
      violations.push({
        severity: "error",
        type: "formula",
        message: `LaTeX 公式 $ 符号不成对（行内检测到 ${dollarCount} 个 $）`,
        line: i + 1,
      });
    }
  }

  // 2. 公式书写检查：检测未闭合的多行 $$ 块
  const doubleDollarMatches = content.match(/\$\$/g);
  if (doubleDollarMatches && doubleDollarMatches.length % 2 !== 0) {
    violations.push({
      severity: "error",
      type: "formula",
      message: `行间公式 $$ 块未正确闭合（检测到 ${doubleDollarMatches.length} 个 $$）`,
    });
  }

  // 3. 禁止超纲内容检查
  const contentLower = content.toLowerCase();
  const checkedRanges = new Set<number>();
  const sortedKeywords = [...OUT_OF_SCOPE_KEYWORDS].sort((a, b) => b.length - a.length);

  for (const keyword of sortedKeywords) {
    const keywordLower = keyword.toLowerCase();
    let idx = contentLower.indexOf(keywordLower);
    while (idx !== -1) {
      let alreadyMatched = false;
      for (let r = idx; r < idx + keywordLower.length; r++) {
        if (checkedRanges.has(r)) {
          alreadyMatched = true;
          break;
        }
      }
      if (!alreadyMatched) {
        for (let r = idx; r < idx + keywordLower.length; r++) {
          checkedRanges.add(r);
        }
        const lineIdx = lines.findIndex((l) => l.toLowerCase().includes(keywordLower));
        violations.push({
          severity: "error",
          type: "scope",
          message: `检测到超纲内容关键词：「${keyword}」（初中物理不应涉及）`,
          line: lineIdx >= 0 ? lineIdx + 1 : undefined,
        });
      }
      idx = contentLower.indexOf(keywordLower, idx + 1);
    }
  }

  // 4. 安全检查
  const hasSafetyWarning = SAFETY_KEYWORDS.some((k) => content.includes(k));
  if (hasSafetyWarning && !content.includes("安全") && !content.includes("注意")) {
    violations.push({
      severity: "warning",
      type: "safety",
      message: "内容涉及潜在危险操作（如高压、触电等），但未发现安全提示语",
    });
  }

  // 5. 概念完整性检查
  if (content.includes("学习目标") && !content.includes("例题")) {
    violations.push({
      severity: "warning",
      type: "concept",
      message: "章节包含学习目标但缺少例题，可能影响学习效果",
    });
  }

  // 6. 物理规律性规则检查（按学科）
  for (const rule of PHYSICS_RULES) {
    if (rule.category && rule.category !== category) continue;
    const hits = rule.check(content, lines);
    for (const hit of hits) {
      violations.push({
        severity: rule.severity,
        type: rule.type,
        message: rule.message,
        line: hit.line,
      });
    }
  }

  return violations;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

export async function runLLMQA(
  chapterId: string,
  content: string,
  apiKey?: string
): Promise<QAViolation[]> {
  const violations: QAViolation[] = [];
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    violations.push({
      severity: "warning",
      type: "concept",
      message: "GEMINI_API_KEY 未设置，跳过 LLM 深度质检",
    });
    return violations;
  }

  const prompt = `
你是一位资深初中物理教研员。请审阅以下初中物理教学 Markdown 章节，检查概念正确性、例题答案是否正确、公式推导是否合理。

要求输出一个 JSON 数组，每个元素包含：
- severity: "error" | "warning"
- type: "concept" | "formula" | "scope" | "safety"
- message: 问题描述（中文）

如果未发现任何问题，输出空数组 [] 。

---
章节内容：
${content}
---

请只输出 JSON 数组，不要任何其他说明。
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    let parsed: Array<{
      severity: "error" | "warning";
      type: "concept" | "formula" | "scope" | "safety";
      message: string;
    }>;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/```json\n?([\s\S]*?)\n?```/);
      parsed = match ? JSON.parse(match[1]) : [];
    }

    for (const v of parsed) {
      violations.push({
        severity: v.severity,
        type: v.type,
        message: `[LLM] ${v.message}`,
      });
    }
  } catch (err) {
    violations.push({
      severity: "warning",
      type: "concept",
      message: `LLM 质检调用失败: ${(err as Error).message}`,
    });
  }

  return violations;
}

export async function runFullQA(
  chapterId: string,
  content: string,
  apiKey?: string
): Promise<QAReport> {
  const structured = runStructuredQA(chapterId, content);
  const llm = await runLLMQA(chapterId, content, apiKey);

  const all = [...structured, ...llm];

  return {
    chapter_id: chapterId,
    passed: !all.some((v) => v.severity === "error"),
    violations: all,
  };
}

async function main() {
  const chaptersDir =
    process.argv[2] || path.join(__dirname, "..", "public", "content", "chapters");
  const outputPath =
    process.argv[3] || path.join(__dirname, "..", "qa-report.json");
  const apiKey = process.env.GEMINI_API_KEY;

  if (!fs.existsSync(chaptersDir)) {
    console.error(`❌ Chapters directory not found: ${chaptersDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(chaptersDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  if (files.length === 0) {
    console.error(`⚠️ No markdown chapters found in ${chaptersDir}`);
    process.exit(0);
  }

  console.log(`🔍 Scanning ${files.length} chapter(s)...\n`);

  const reports: QAReport[] = [];

  for (const file of files) {
    const chapterId = path.basename(file, ".md");
    const content = fs.readFileSync(path.join(chaptersDir, file), "utf-8");

    const report = await runFullQA(chapterId, content, apiKey);
    reports.push(report);

    const status = report.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} ${chapterId} (${report.violations.length} violation(s))`);
    for (const v of report.violations) {
      const icon = v.severity === "error" ? "  🔴" : "  🟡";
      const lineInfo = v.line ? ` [L${v.line}]` : "";
      console.log(`${icon} [${v.type}]${lineInfo} ${v.message}`);
    }
    console.log();
  }

  fs.writeFileSync(outputPath, JSON.stringify(reports, null, 2), "utf-8");

  const passedCount = reports.filter((r) => r.passed).length;
  console.log(`✅ QA report written to ${outputPath}`);
  console.log(`   Total: ${reports.length} | Passed: ${passedCount} | Failed: ${reports.length - passedCount}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
