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

function lineFor(lines: string[], regex: RegExp): number | undefined {
  const idx = lines.findIndex((line) => regex.test(line));
  return idx >= 0 ? idx + 1 : undefined;
}

const PHYSICS_RULES: PhysicsRule[] = [
  // ========== 力学 ==========
  {
    id: "mech-fma-accel",
    category: "mechanics",
    severity: "warning",
    type: "concept",
    message: "F=ma 应配合加速度说明，提醒学生力会改变物体运动状态",
    check: (content, lines) => {
      const hasFma = /F\s*=\s*m\s*a|F=ma/i.test(content);
      if (!hasFma || content.includes("加速度")) return [];
      return [{ line: lineFor(lines, /F\s*=\s*m\s*a|F=ma/i) }];
    },
  },
  {
    id: "mech-newton-first-law",
    category: "mechanics",
    severity: "warning",
    type: "concept",
    message:
      "牛顿第一定律应说明成立条件：物体不受外力（或所受合力为零）时，保持静止或匀速直线运动状态",
    check: (content, lines) => {
      if (!content.includes("牛顿第一定律")) return [];
      if (/(不受力|合力为零|合力为0|静止|匀速直线运动|惯性)/.test(content)) return [];
      return [{ line: lineFor(lines, /牛顿第一定律/) }];
    },
  },
  {
    id: "mech-newton-second-law",
    category: "mechanics",
    severity: "warning",
    type: "concept",
    message: "牛顿第二定律 F=ma 应说明 F 是物体所受合力，且适用于宏观、低速运动的物体",
    check: (content, lines) => {
      if (!content.includes("牛顿第二定律")) return [];
      if (/(合力|宏观|低速)/.test(content)) return [];
      return [{ line: lineFor(lines, /牛顿第二定律/) }];
    },
  },
  {
    id: "mech-newton-third-law",
    category: "mechanics",
    severity: "warning",
    type: "concept",
    message:
      "牛顿第三定律应说明作用力与反作用力大小相等、方向相反、作用在同一直线上，且分别作用在不同物体上",
    check: (content, lines) => {
      if (!content.includes("牛顿第三定律")) return [];
      if (/(大小相等|方向相反|同一直线|相互作用力|不同物体)/.test(content)) return [];
      return [{ line: lineFor(lines, /牛顿第三定律/) }];
    },
  },
  {
    id: "mech-buoyancy-direction",
    category: "mechanics",
    severity: "error",
    type: "concept",
    message: "浮力方向必须竖直向上，不能说成其他方向",
    check: (content, lines) => {
      if (!content.includes("浮力")) return [];
      const wrong = /浮力.{0,10}(水平|向下|斜向|向左|向右)/.test(content);
      if (!wrong) return [];
      return [{ line: lineFor(lines, /浮力.{0,10}(水平|向下|斜向|向左|向右)/) }];
    },
  },
  {
    id: "mech-pressure-liquid",
    category: "mechanics",
    severity: "warning",
    type: "concept",
    message: "p=ρgh 仅适用于液体压强（且液体静止），不适用于固体压强",
    check: (content, lines) => {
      const hasFormula = /p\s*=\s*ρ\s*g\s*h|p\s*=\s*ρgh|p=ρgh/i.test(content);
      if (!hasFormula) return [];
      if (/(液体|适用范围|只适用|仅适用)/.test(content)) return [];
      return [{ line: lineFor(lines, /p\s*=\s*ρ\s*g\s*h|p\s*=\s*ρgh|p=ρgh/i) }];
    },
  },

  // ========== 光学 ==========
  {
    id: "optics-reflection-law",
    category: "optics",
    severity: "error",
    type: "concept",
    message: "反射角必须等于入射角，不能写成反射角大于或小于入射角",
    check: (content, lines) => {
      if (!content.includes("反射角")) return [];
      const wrong =
        /反射角\s*(?:不等于|≠|[<>＜＞])\s*入射角/.test(content) ||
        /反射角\s*(?:大于|小于)\s*入射角/.test(content);
      if (!wrong) return [];
      return [{ line: lineFor(lines, /反射角/) }];
    },
  },
  {
    id: "optics-refraction-air-water",
    category: "optics",
    severity: "error",
    type: "concept",
    message: "光从空气斜射入水，折射角必须小于入射角",
    check: (content, lines) => {
      const context = content.includes("空气") && content.includes("水") && content.includes("折射");
      if (!context) return [];
      const wrong = /折射角\s*(?:大于|[>＞])\s*入射角/.test(content);
      if (!wrong) return [];
      return [{ line: lineFor(lines, /折射角/) }];
    },
  },
  {
    id: "optics-lens-u-gt-2f",
    category: "optics",
    severity: "error",
    type: "concept",
    message: "凸透镜 u>2f 时应成倒立缩小的实像，不能写成放大或正立",
    check: (content, lines) => {
      const hasUgt2f = /u\s*>\s*2f/.test(content);
      if (!content.includes("凸透镜") || !hasUgt2f) return [];
      const hasCorrect = /倒立[\s\S]{0,12}缩小[\s\S]{0,12}实像/.test(content);
      if (hasCorrect) return [];
      if (/(正立|放大|虚像)/.test(content)) {
        return [{ line: lineFor(lines, /u\s*>\s*2f/) }];
      }
      return [];
    },
  },

  // ========== 电学 ==========
  {
    id: "elec-short-circuit",
    category: "electricity",
    severity: "error",
    type: "safety",
    message: "严禁正面描述电源短路作为可行方法",
    check: (content, lines) => {
      if (!content.includes("短路")) return [];
      const dangerous =
        /(?:可以|应该|需要|建议|通过|用).{0,8}(?:电源)?短路/.test(content) ||
        /短路.{0,8}(?:可行|增大|提高|正确|安全)/.test(content);
      const safe = /(?:防止|避免|严禁|禁止|不能|不可|不要).{0,4}(?:电源)?短路/.test(content);
      if (dangerous && !safe) return [{ line: lineFor(lines, /短路/) }];
      return [];
    },
  },
  {
    id: "elec-ammeter-series",
    category: "electricity",
    severity: "error",
    type: "concept",
    message: "电流表必须与用电器串联，不能并联",
    check: (content, lines) => {
      if (!content.includes("电流表")) return [];
      const wrong = /电流表.{0,8}并联|并联.{0,8}电流表/.test(content);
      if (!wrong) return [];
      return [{ line: lineFor(lines, /电流表/) }];
    },
  },
  {
    id: "elec-voltmeter-parallel",
    category: "electricity",
    severity: "error",
    type: "concept",
    message: "电压表必须与用电器并联，不能串联",
    check: (content, lines) => {
      if (!content.includes("电压表")) return [];
      const wrong = /电压表.{0,8}串联|串联.{0,8}电压表/.test(content);
      if (!wrong) return [];
      return [{ line: lineFor(lines, /电压表/) }];
    },
  },
  {
    id: "elec-ohms-law-units",
    category: "electricity",
    severity: "warning",
    type: "formula",
    message: "I=U/R 使用时应注意单位统一（I 用安培 A，U 用伏特 V，R 用欧姆 Ω）",
    check: (content, lines) => {
      const hasFormula = /I\s*=\s*U\s*\/\s*R|I=U\/R/i.test(content);
      if (!hasFormula) return [];
      if (/(单位|安培|伏特|欧姆|\bA\b|\bV\b|Ω)/.test(content)) return [];
      return [{ line: lineFor(lines, /I\s*=\s*U\s*\/\s*R|I=U\/R/i) }];
    },
  },

  // ========== 热学 ==========
  {
    id: "thermal-heat-formula-units",
    category: "thermal",
    severity: "warning",
    type: "formula",
    message: "Q=cmΔt 应说明 Δt 的温度单位；温差用 °C 或 K 表示均可（数值等价），需与比热容 c 的单位配套",
    check: (content, lines) => {
      const hasFormula = /Q\s*=\s*c\s*m\s*Δ\s*t|Q=cmΔt/i.test(content);
      if (!hasFormula) return [];
      if (/(℃|°C|摄氏|开尔文|\bK\b|温度|单位)/.test(content)) return [];
      return [{ line: lineFor(lines, /Q\s*=\s*c\s*m\s*Δ\s*t|Q=cmΔt/i) }];
    },
  },
  {
    id: "thermal-specific-heat-definition",
    category: "thermal",
    severity: "warning",
    type: "concept",
    message: "比热容是物质的一种特性，与质量、体积无关；吸放热多少才与质量有关",
    check: (content, lines) => {
      if (!content.includes("比热容")) return [];
      const wrong = /(?:比热容|比热).{0,12}(?:与|随|取决于).{0,10}(?:质量|体积|多少)/.test(content);
      if (!wrong) return [];
      return [{ line: lineFor(lines, /比热容/) }];
    },
  },

  // ========== 声学 ==========
  {
    id: "acoustics-pitch-frequency",
    category: "acoustics",
    severity: "error",
    type: "concept",
    message: "音调与频率成正比，不能写成反比",
    check: (content, lines) => {
      if (!content.includes("音调") || !content.includes("频率")) return [];
      const wrong =
        /音调.{0,10}频率.{0,10}反比/.test(content) ||
        /频率.{0,10}音调.{0,10}反比/.test(content);
      if (!wrong) return [];
      return [{ line: lineFor(lines, /音调|频率/) }];
    },
  },
  {
    id: "acoustics-speed-of-sound",
    category: "acoustics",
    severity: "warning",
    type: "concept",
    message: "声速在空气中约 340m/s，若写成其他数值需说明条件",
    check: (content, lines) => {
      if (!content.includes("声速")) return [];
      const hasNumber = /声速.{0,12}\d{3,}/.test(content);
      if (!hasNumber) return [];
      if (/340|15\s*°?C|15\s*℃/.test(content)) return [];
      return [{ line: lineFor(lines, /声速/) }];
    },
  },
];

function inferCategory(chapterId: string, content: string): string {
  const idToCategory: Record<string, string> = {
    sound: "acoustics",
    noise: "acoustics",
    ultrasound: "acoustics",
    light: "optics",
    lens: "optics",
    mirror: "optics",
    dispersion: "optics",
    refraction: "optics",
    reflection: "optics",
    temperature: "thermal",
    melting: "thermal",
    freezing: "thermal",
    vaporization: "thermal",
    liquefaction: "thermal",
    sublimation: "thermal",
    deposition: "thermal",
    heat: "thermal",
    specific: "thermal",
    motion: "mechanics",
    velocity: "mechanics",
    force: "mechanics",
    gravity: "mechanics",
    elastic: "mechanics",
    friction: "mechanics",
    newton: "mechanics",
    pressure: "mechanics",
    buoyancy: "mechanics",
    machine: "mechanics",
    efficiency: "mechanics",
    work: "mechanics",
    power: "mechanics",
    mechanical: "mechanics",
    electric: "electricity",
    circuit: "electricity",
    current: "electricity",
    voltage: "electricity",
    resistance: "electricity",
    ohm: "electricity",
    magnetism: "electricity",
  };

  for (const [key, cat] of Object.entries(idToCategory)) {
    if (chapterId.toLowerCase().includes(key)) return cat;
  }

  // Fallback: read YAML frontmatter category
  const categoryMatch = content.match(/category:\s*(\w+)/);
  if (categoryMatch) return categoryMatch[1];

  return "";
}

export function runStructuredQA(chapterId: string, content: string): QAViolation[] {
  const violations: QAViolation[] = [];
  const lines = content.split("\n");
  const category = inferCategory(chapterId, content);

  // 1. 公式书写检查：$ 符号是否成对（跳过 YAML frontmatter）
  let inFrontmatter = false;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (i === 0 && trimmed === "---") {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (trimmed === "---") inFrontmatter = false;
      continue;
    }

    const dollarCount = (lines[i].match(/\$/g) || []).length;
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
  const inputPath =
    process.argv[2] || path.join(__dirname, "..", "public", "content", "chapters");
  const outputPath =
    process.argv[3] || path.join(__dirname, "..", "qa-report.json");
  const apiKey = process.env.GEMINI_API_KEY;

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Chapters directory or markdown file not found: ${inputPath}`);
    process.exit(1);
  }

  const isSingleFile = fs.statSync(inputPath).isFile();
  const files = isSingleFile
    ? [inputPath]
    : fs
        .readdirSync(inputPath)
        .filter((f) => f.endsWith(".md"))
        .sort();

  if (files.length === 0) {
    console.error(`⚠️ No markdown chapters found in ${inputPath}`);
    process.exit(0);
  }

  console.log(`🔍 Scanning ${files.length} chapter(s)...\n`);

  const reports: QAReport[] = [];

  for (const file of files) {
    const filePath = isSingleFile ? file : path.join(inputPath, file);
    const chapterId = path.basename(file, ".md");
    const content = fs.readFileSync(filePath, "utf-8");

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
  main().catch((err) => {
    console.error("\n❌ QA pipeline failed:", err.message);
    process.exit(1);
  });
}
