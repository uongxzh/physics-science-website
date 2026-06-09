#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { CurriculumData, CurriculumChapter } from "./scan-gaps.ts";
import { runFullQA, type QAViolation } from "./physics-qa.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENERATION_MARK = "<!-- ai-generated -->";
const MAX_RETRIES = 3;
const BATCH_SIZE = Number(process.env.BATCH_SIZE || "2");
const LLM_PROVIDER = process.env.LLM_PROVIDER || "gemini";
const LLM_API_KEY = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.GEMINI_API_KEY || "";
const LLM_MODEL = process.env.LLM_MODEL || "gemini-2.0-flash";

interface GenerateResult {
  chapter: CurriculumChapter;
  success: boolean;
  wordCount: number;
  violations: QAViolation[];
  passedQA: boolean;
  error?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function estimateWordCount(text: string): number {
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const en = (text.match(/[a-zA-Z0-9_]+/g) || []).length;
  return cjk + en;
}

function buildPrompt(chapter: CurriculumChapter): string {
  return `
你是一位资深初中物理教师，熟悉人教版初中物理教材与中考考纲。请为以下章节生成教学 Markdown 内容。

要求：
1. 严格限定在初中物理范围，禁止涉及微积分、相对论、量子力学、麦克斯韦方程组、理想气体状态方程（PV=nRT）、熵增、热力学第二定律等高中/大学内容。
2. 语言生动有趣，适合初中生理解；公式用 LaTeX（$...$ 行内，$$...$$ 行间）。
3. 必须包含以下小节：
   - 学习目标（3-5 条，用无序列表）
   - 核心概念（清晰解释，配 1-2 个生活实例）
   - 公式总结（列出本章核心公式，注明每个符号含义）
   - 典型例题（1 道完整例题 + 详细解答过程）
   - 实验引用（描述 1 个课堂可操作的简易实验或虚拟仿真实验）
   - 知识检测题（2-3 道选择题/填空题，附答案与解析）
4. 总字数控制在 1000-1800 中文字之间。
5. 输出格式为 YAML frontmatter + Markdown 正文。不要输出代码块包裹，直接输出 Markdown。

章节信息：
- ID: ${chapter.id}
- 标题: ${chapter.title}
- 学科: ${chapter.category}
- 描述: ${chapter.description}

YAML frontmatter 请使用以下格式：
---
id: ${chapter.id}
title: ${chapter.title}
category: ${chapter.category}
order: ${chapter.order}
status: draft
word_count: <自动估算>
has_experiment: true
has_problems: true
last_updated: ${new Date().toISOString()}
tags: [初中物理, ${chapter.category}]
---

请在正文末尾追加一行：${GENERATION_MARK}
`;
}

async function callGemini(prompt: string): Promise<string> {
  if (!LLM_API_KEY) throw new Error("LLM_API_KEY / GEMINI_API_KEY is not set");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${LLM_MODEL}:generateContent?key=${LLM_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 8192 },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) throw new Error("Gemini returned empty content");
  return text;
}

async function callDeepSeek(prompt: string): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not set");
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: LLM_MODEL || "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "你是一位资深初中物理教师，擅长生成结构化的教学内容。请只输出 Markdown 文本，不要代码块包裹。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
    }),
  });
  if (!res.ok) {
    throw new Error(`DeepSeek API error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}

async function callAnthropic(prompt: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
  if (!key) throw new Error("ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN is not set");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: LLM_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system:
        "你是一位资深初中物理教师，擅长生成结构化的教学内容。请只输出 Markdown 文本，不要代码块包裹。",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((c) => c.type === "text")?.text || "";
  if (!text) throw new Error("Anthropic returned empty content");
  return text;
}

async function callLLM(prompt: string): Promise<string> {
  if (LLM_PROVIDER === "deepseek") return callDeepSeek(prompt);
  if (LLM_PROVIDER === "anthropic" || LLM_PROVIDER === "claude") return callAnthropic(prompt);
  return callGemini(prompt);
}

function updateFrontmatter(md: string, updates: Record<string, unknown>): string {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return md;
  const lines = match[1].split("\n");
  const map = new Map<string, string>();
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    map.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
  }
  for (const [k, v] of Object.entries(updates)) {
    if (Array.isArray(v)) map.set(k, `[${v.join(", ")}]`);
    else if (typeof v === "string") map.set(k, v);
    else map.set(k, String(v));
  }
  const yaml = Array.from(map.entries())
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return md.replace(/^---\n[\s\S]*?\n---/, `---\n${yaml}\n---`);
}

async function generateChapter(
  chapter: CurriculumChapter,
  chaptersDir: string
): Promise<GenerateResult> {
  console.log(`\n📝 Generating: ${chapter.id} — ${chapter.title}`);
  let finalContent = "";
  let violations: QAViolation[] = [];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      let prompt = buildPrompt(chapter);
      if (attempt > 1 && violations.length > 0) {
        const errorMessages = violations
          .filter((v) => v.severity === "error")
          .map((v) => `- [${v.type}] ${v.message}`)
          .join("\n");
        prompt += `

上一次生成的内容存在以下问题，请修改后重新输出整章内容：
${errorMessages}
`;
      }
      const raw = await callLLM(prompt);
      finalContent = raw.trim();

      // Ensure frontmatter exists
      if (!finalContent.startsWith("---")) {
        const header = `---\nid: ${chapter.id}\ntitle: ${chapter.title}\ncategory: ${chapter.category}\norder: ${chapter.order}\nstatus: draft\nword_count: 0\nhas_experiment: true\nhas_problems: true\nlast_updated: ${new Date().toISOString()}\ntags: [初中物理, ${chapter.category}]\n---\n\n`;
        finalContent = header + finalContent;
      }

      // Ensure generation mark
      if (!finalContent.includes(GENERATION_MARK)) {
        finalContent += `\n\n${GENERATION_MARK}`;
      }

      const wordCount = estimateWordCount(finalContent);
      finalContent = updateFrontmatter(finalContent, {
        word_count: wordCount,
        status: wordCount >= 500 ? "draft" : "empty",
        last_updated: new Date().toISOString(),
      });

      // QA
      const qaReport = await runFullQA(chapter.id, finalContent, LLM_API_KEY);
      violations = qaReport.violations;

      if (qaReport.passed) {
        finalContent = updateFrontmatter(finalContent, { status: "complete" });
      }

      const errors = violations.filter((v) => v.severity === "error").length;
      console.log(
        `   Attempt ${attempt}/${MAX_RETRIES}: wordCount=${wordCount}, errors=${errors}, warnings=${violations.length - errors}`
      );

      if (qaReport.passed) {
        fs.writeFileSync(path.join(chaptersDir, `${chapter.id}.md`), finalContent, "utf-8");
        return {
          chapter,
          success: true,
          wordCount,
          violations,
          passedQA: true,
        };
      }

      if (attempt < MAX_RETRIES) await sleep(1000);
    } catch (err) {
      const msg = (err as Error).message;
      console.log(`   Attempt ${attempt}/${MAX_RETRIES} failed: ${msg}`);
      if (attempt === MAX_RETRIES) {
        return {
          chapter,
          success: false,
          wordCount: estimateWordCount(finalContent),
          violations,
          passedQA: false,
          error: msg,
        };
      }
      await sleep(2000);
    }
  }

  // Save best effort even if QA did not pass
  if (finalContent) {
    fs.writeFileSync(path.join(chaptersDir, `${chapter.id}.md`), finalContent, "utf-8");
  }

  return {
    chapter,
    success: !!finalContent,
    wordCount: estimateWordCount(finalContent),
    violations,
    passedQA: !violations.some((v) => v.severity === "error"),
  };
}

async function main() {
  const curriculumPath =
    process.argv[2] || path.join(__dirname, "..", "public", "content", "curriculum.json");
  const chaptersDir =
    process.argv[3] || path.join(__dirname, "..", "public", "content", "chapters");

  if (!fs.existsSync(curriculumPath)) {
    console.error(`❌ Curriculum not found: ${curriculumPath}`);
    process.exit(1);
  }

  if (!LLM_API_KEY) {
    console.error("❌ LLM_API_KEY / GEMINI_API_KEY environment variable is required");
    process.exit(1);
  }

  const curriculum: CurriculumData = JSON.parse(fs.readFileSync(curriculumPath, "utf-8"));

  const candidates = curriculum.chapters.filter(
    (ch) => ch.status === "empty" || ch.word_count < 500
  );
  const maxToGenerate = Number(process.env.MAX_GENERATE || candidates.length);
  const toGenerate = candidates.slice(0, maxToGenerate);

  console.log(`\n🔧 Provider: ${LLM_PROVIDER}`);
  console.log(`🔧 Model: ${LLM_MODEL}`);
  console.log(
    `📚 Candidates: ${candidates.length} | Batch size: ${BATCH_SIZE} | Will generate: ${toGenerate.length}`
  );

  fs.mkdirSync(chaptersDir, { recursive: true });
  const results: GenerateResult[] = [];

  for (let i = 0; i < toGenerate.length; i += BATCH_SIZE) {
    const batch = toGenerate.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((ch) => generateChapter(ch, chaptersDir))
    );
    results.push(...batchResults);
  }

  // Update curriculum.json statuses based on generated files
  for (const r of results) {
    if (!r.success) continue;
    const idx = curriculum.chapters.findIndex((c) => c.id === r.chapter.id);
    if (idx >= 0) {
      curriculum.chapters[idx].status = r.passedQA ? "complete" : "draft";
      curriculum.chapters[idx].word_count = r.wordCount;
      curriculum.chapters[idx].has_experiment = true;
      curriculum.chapters[idx].has_problems = true;
      curriculum.chapters[idx].last_updated = new Date().toISOString();
    }
  }

  curriculum.last_updated = new Date().toISOString();
  fs.writeFileSync(curriculumPath, JSON.stringify(curriculum, null, 2), "utf-8");

  // Summary
  const passed = results.filter((r) => r.success && r.passedQA).length;
  const partial = results.filter((r) => r.success && !r.passedQA).length;
  const failed = results.filter((r) => !r.success).length;

  console.log("\n========== Generation Summary ==========");
  console.log(`Total attempted : ${results.length}`);
  console.log(`✅ Passed QA    : ${passed}`);
  console.log(`⚠️  Saved (failed QA): ${partial}`);
  console.log(`❌ Failed       : ${failed}`);

  for (const r of results) {
    const icon = r.success && r.passedQA ? "✅" : r.success ? "⚠️" : "❌";
    const detail = r.error ? ` (${r.error})` : "";
    console.log(`${icon} ${r.chapter.id}: ${r.wordCount} words${detail}`);
  }

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("\n❌ Generation pipeline failed:", err.message);
  process.exit(1);
});
