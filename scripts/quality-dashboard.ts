#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QAViolation {
  severity: string;
  type: string;
  message: string;
  line?: number;
}

interface QAReport {
  chapter_id: string;
  passed: boolean;
  violations: QAViolation[];
}

interface GapReport {
  total_chapters: number;
  empty_chapters: string[];
  incomplete_chapters: string[];
  missing_experiments: string[];
  missing_problems: string[];
  generated_at: string;
}

interface CurriculumChapter {
  id: string;
  status: string;
  word_count: number;
  has_experiment: boolean;
  has_problems: boolean;
}

interface CurriculumData {
  total_chapters: number;
  last_updated: string;
  chapters: CurriculumChapter[];
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function main() {
  const qaPath = process.argv[2] || path.join(__dirname, "..", "qa-report.json");
  const gapsPath = process.argv[3] || path.join(__dirname, "..", "gaps-report.json");
  const curriculumPath =
    process.argv[4] || path.join(__dirname, "..", "public", "content", "curriculum.json");
  const outPath = process.argv[5] || path.join(__dirname, "..", "quality-dashboard.md");

  const qaReports = readJson<QAReport[]>(qaPath, []);
  const gaps = readJson<GapReport | null>(gapsPath, null);
  const curriculum = readJson<CurriculumData | null>(curriculumPath, null);

  const lines: string[] = [];
  lines.push("# 物理内容质量报告", "");
  lines.push(`> 生成时间：${new Date().toISOString()}`, "");

  // 总体质量
  lines.push("## 总体质量", "");
  const total = qaReports.length;
  const passed = qaReports.filter((r) => r.passed).length;
  const failed = total - passed;
  const passRate = total ? `${((passed / total) * 100).toFixed(1)}%` : "暂无数据";
  lines.push("| 指标 | 数值 |", "| --- | --- |");
  lines.push(`| QA 章节数 | ${total} |`);
  lines.push(`| 通过 | ${passed} |`);
  lines.push(`| 未通过 | ${failed} |`);
  lines.push(`| 通过率 | ${passRate} |`);
  lines.push("");

  // 常见错误类型
  lines.push("## 常见错误类型", "");
  const typeCount = new Map<string, number>();
  for (const report of qaReports) {
    for (const violation of report.violations) {
      const key = `${violation.severity}/${violation.type}`;
      typeCount.set(key, (typeCount.get(key) || 0) + 1);
    }
  }
  if (typeCount.size === 0) {
    lines.push("暂无质检违规数据。", "");
  } else {
    lines.push("| 类型 | 严重度 | 次数 |", "| --- | --- | --- |");
    const sorted = [...typeCount.entries()].sort((a, b) => b[1] - a[1]);
    for (const [key, count] of sorted) {
      const [severity, type] = key.split("/");
      lines.push(`| ${type} | ${severity} | ${count} |`);
    }
    lines.push("");
  }

  // 内容缺口进度
  lines.push("## 内容缺口进度", "");
  if (gaps) {
    lines.push("| 指标 | 数量 |", "| --- | --- |");
    lines.push(`| 章节总数 | ${gaps.total_chapters} |`);
    lines.push(`| 空白章节 | ${gaps.empty_chapters.length} |`);
    lines.push(`| 不完整章节(<500字) | ${gaps.incomplete_chapters.length} |`);
    lines.push(`| 缺少实验 | ${gaps.missing_experiments.length} |`);
    lines.push(`| 缺少习题 | ${gaps.missing_problems.length} |`);
    lines.push("");
  } else {
    lines.push("暂无缺口报告。", "");
  }

  // 进度趋势
  lines.push("## 进度趋势", "");
  if (curriculum && Array.isArray(curriculum.chapters)) {
    const chapters = curriculum.chapters;
    const complete = chapters.filter((c) => c.status === "complete").length;
    const draft = chapters.filter((c) => c.status === "draft").length;
    const empty = chapters.filter((c) => c.status === "empty").length;
    lines.push(`- 课程章节总数：${chapters.length}`);
    lines.push(`- 已完成：${complete}`);
    lines.push(`- 草稿：${draft}`);
    lines.push(`- 待填充：${empty}`);
    lines.push("");
  } else {
    lines.push("暂无课程数据。", "");
  }

  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
  console.log(`✅ Quality dashboard written to ${outPath}`);
}

main();
