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

export function runStructuredQA(chapterId: string, content: string): QAViolation[] {
  const violations: QAViolation[] = [];
  const lines = content.split("\n");

  // 1. 公式书写检查：$ 符号是否成对
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
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

  // 3. 禁止超纲内容检查（避免短词被长词包含导致重复误报）
  const contentLower = content.toLowerCase();
  const checkedRanges = new Set<number>();

  // 按长度降序排序，优先匹配长词
  const sortedKeywords = [...OUT_OF_SCOPE_KEYWORDS].sort(
    (a, b) => b.length - a.length
  );

  for (const keyword of sortedKeywords) {
    const keywordLower = keyword.toLowerCase();
    let idx = contentLower.indexOf(keywordLower);
    while (idx !== -1) {
      // 检查该位置是否已被更长关键词匹配
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
        const lineIdx = lines.findIndex((l) =>
          l.toLowerCase().includes(keywordLower)
        );
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

  // 4. 安全检查：如果包含实验相关描述，应有安全提示
  const hasExperiment =
    content.includes("实验") || content.includes("动手") || content.includes("操作");
  const hasSafetyWarning = SAFETY_KEYWORDS.some((k) =>
    content.includes(k)
  );
  // 仅在有危险操作关键词时提示，普通实验不强制要求
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

如果未发现任何问题，输出空数组 []。

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
      // 尝试从 markdown 代码块中提取
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
    process.argv[2] || path.join(__dirname, "..", "content", "chapters");
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
