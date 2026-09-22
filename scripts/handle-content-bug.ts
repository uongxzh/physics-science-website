#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runFullQA, type QAViolation } from "./physics-qa.ts";
import { generateChapter } from "./generate-content.ts";
import type { CurriculumData } from "./scan-gaps.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO = process.env.GITHUB_REPOSITORY || "uongxzh/physics-science-website";

interface ContentBugResult {
  action: "close" | "comment";
  chapter_id: string;
  passed: boolean;
  comment: string;
}

function extractChapterId(body: string): string {
  const patterns = [
    /章节\s*ID[:：\s]*([A-Za-z0-9_-]+)/i,
    /chapter\s*id[:：\s]*([A-Za-z0-9_-]+)/i,
    /ID[:：\s]*([A-Za-z0-9_-]+)/i,
  ];
  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) return match[1];
  }
  return "";
}

function formatViolations(violations: QAViolation[]): string {
  if (violations.length === 0) return "未发现违规项。";
  return violations
    .map((v) => {
      const icon = v.severity === "error" ? "🔴" : "🟡";
      const line = v.line ? ` [L${v.line}]` : "";
      return `- ${icon} [${v.type}]${line} ${v.message}`;
    })
    .join("\n");
}

function readCurriculum(chaptersDir: string): CurriculumData | null {
  const curriculumPath = path.join(path.dirname(chaptersDir), "curriculum.json");
  try {
    return JSON.parse(fs.readFileSync(curriculumPath, "utf-8")) as CurriculumData;
  } catch {
    return null;
  }
}

async function main() {
  const issueBody = process.env.ISSUE_BODY || "";
  const chaptersDir =
    process.env.CHAPTERS_DIR || path.join(__dirname, "..", "public", "content", "chapters");
  const outputPath =
    process.env.RESULT_PATH || path.join(__dirname, "..", "content-bug-result.json");

  const chapterId = extractChapterId(issueBody);
  if (!chapterId) {
    const result: ContentBugResult = {
      action: "comment",
      chapter_id: "",
      passed: false,
      comment:
        "⚠️ 无法从 Issue 描述中解析出章节 ID，请按模板补充：`- ID: <章节ID>`。",
    };
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const chapterFile = path.join(chaptersDir, `${chapterId}.md`);
  if (!fs.existsSync(chapterFile)) {
    const result: ContentBugResult = {
      action: "comment",
      chapter_id: chapterId,
      passed: false,
      comment: `⚠️ 未找到章节文件 \`public/content/chapters/${chapterId}.md\`，请确认章节 ID 是否正确。`,
    };
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  let content = fs.readFileSync(chapterFile, "utf-8");
  let report = await runFullQA(chapterId, content, process.env.GEMINI_API_KEY);
  let passed = report.passed;

  // 如果存在物理错误，且配置了 LLM key，则尝试自动重新生成该章节。
  if (!passed && (process.env.GEMINI_API_KEY || process.env.LLM_API_KEY)) {
    const curriculum = readCurriculum(chaptersDir);
    const chapter = curriculum?.chapters.find((c) => c.id === chapterId);
    if (chapter) {
      console.log(`🔧 Attempting to auto-fix chapter: ${chapterId}`);
      const gen = await generateChapter(chapter, chaptersDir);
      if (gen.success) {
        content = fs.readFileSync(chapterFile, "utf-8");
        report = await runFullQA(chapterId, content, process.env.GEMINI_API_KEY);
        passed = report.passed;
      }
    }
  }

  const violations = report.violations;
  if (passed) {
    const result: ContentBugResult = {
      action: "close",
      chapter_id: chapterId,
      passed: true,
      comment: [
        `✅ 章节 \`${chapterId}\` 已通过物理质检。`,
        "",
        formatViolations(violations),
        "",
        "该反馈将自动关闭。感谢您的反馈！",
      ].join("\n"),
    };
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const errorCount = violations.filter((v) => v.severity === "error").length;
  const warningCount = violations.filter((v) => v.severity === "warning").length;
  const result: ContentBugResult = {
    action: "comment",
    chapter_id: chapterId,
    passed: false,
    comment: [
      `🔍 章节 \`${chapterId}\` 质检未通过（${errorCount} 个错误，${warningCount} 个警告）。`,
      "",
      formatViolations(violations),
      "",
      "请修正内容后重新触发，或在本地运行：",
      `\`\`\`bash`,
      `npx tsx scripts/physics-qa.ts public/content/chapters/${chapterId}.md qa-report.json`,
      `\`\`\``,
    ].join("\n"),
  };
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("\n❌ content-bug handler failed:", err.message);
  process.exit(1);
});
