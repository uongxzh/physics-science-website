#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QAViolation {
  severity: "error" | "warning";
  type: "concept" | "formula" | "scope" | "safety";
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

interface HistoryEntry {
  generated_at: string;
  total: number;
  passed: number;
  failed: number;
  pass_rate: number;
  errors: number;
  warnings: number;
}

const root = path.join(__dirname, "..");
const qaPath = process.argv[2] || path.join(root, "qa-report.json");
const gapsPath = process.argv[3] || path.join(root, "gaps-report.json");
const historyPath = process.argv[4] || path.join(root, "quality-history.json");
const outputPath = process.argv[5] || path.join(root, "quality-dashboard.md");

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch (err) {
    console.warn(`⚠️ Failed to parse ${filePath}: ${(err as Error).message}`);
    return fallback;
  }
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function typeLabel(type: QAViolation["type"]): string {
  const labels: Record<QAViolation["type"], string> = {
    concept: "概念错误",
    formula: "公式错误",
    scope: "超纲内容",
    safety: "安全问题",
  };
  return labels[type] || type;
}

function main() {
  const reports = readJson<QAReport[]>(qaPath, []);
  const gaps = readJson<GapReport | null>(gapsPath, null);
  const generatedAt = new Date().toISOString();

  const allViolations = reports.flatMap((r) => r.violations);
  const errors = allViolations.filter((v) => v.severity === "error");
  const warnings = allViolations.filter((v) => v.severity === "warning");
  const passed = reports.filter((r) => r.passed).length;
  const failed = reports.length - passed;
  const passRate = reports.length > 0 ? passed / reports.length : 0;

  const typeCounts = new Map<string, number>();
  for (const v of allViolations) {
    typeCounts.set(v.type, (typeCounts.get(v.type) || 0) + 1);
  }

  const history = readJson<HistoryEntry[]>(historyPath, []);
  if (reports.length > 0) {
    const entry: HistoryEntry = {
      generated_at: generatedAt,
      total: reports.length,
      passed,
      failed,
      pass_rate: Number(passRate.toFixed(4)),
      errors: errors.length,
      warnings: warnings.length,
    };
    history.push(entry);
    fs.writeFileSync(historyPath, JSON.stringify(history.slice(-30), null, 2), "utf-8");
  }
  const trimmedHistory = history.slice(-30);

  const lines: string[] = [];
  lines.push("# 物理内容质量报告", "");
  lines.push(`> 自动生成于 ${generatedAt}。数据来源：\`qa-report.json\` 与 \`gaps-report.json\`。`, "");

  lines.push("## 一、总体通过率", "");
  lines.push("| 指标 | 数值 |", "| --- | --- |");
  lines.push(`| 章节总数 | ${reports.length} |`);
  lines.push(`| 通过章节 | ${passed} |`);
  lines.push(`| 未通过章节 | ${failed} |`);
  lines.push(`| 通过率 | ${percent(passRate)} |`);
  lines.push(`| 错误（error） | ${errors.length} |`);
  lines.push(`| 警告（warning） | ${warnings.length} |`, "");

  if (reports.length === 0) {
    lines.push("> 暂无 QA 数据。请先运行 `npm run physics-qa` 生成 `qa-report.json`。", "");
  }

  lines.push("## 二、常见错误类型", "");
  if (typeCounts.size === 0) {
    lines.push("暂无违规记录。", "");
  } else {
    lines.push("| 错误类型 | 数量 |", "| --- | --- |");
    for (const [type, count] of [...typeCounts.entries()].sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${typeLabel(type as QAViolation["type"])} | ${count} |`);
    }
    lines.push("");
  }

  if (gaps) {
    lines.push("## 三、内容缺口", "");
    lines.push("| 缺口类型 | 数量 |", "| --- | --- |");
    lines.push(`| 空章节 | ${gaps.empty_chapters.length} |`);
    lines.push(`| 字数不足（<500） | ${gaps.incomplete_chapters.length} |`);
    lines.push(`| 缺少实验 | ${gaps.missing_experiments.length} |`);
    lines.push(`| 缺少习题 | ${gaps.missing_problems.length} |`, "");
  } else {
    lines.push("## 三、内容缺口", "");
    lines.push("暂无 gap 数据。请先运行 `npm run scan-gaps` 生成 `gaps-report.json`。", "");
  }

  lines.push("## 四、进度趋势", "");
  if (trimmedHistory.length === 0) {
    lines.push("暂无历史记录。", "");
  } else {
    lines.push("| 时间 | 章节数 | 通过 | 未通过 | 通过率 | 错误 | 警告 |", "| --- | --- | --- | --- | --- | --- | --- |");
    for (const h of trimmedHistory) {
      lines.push(
        `| ${h.generated_at} | ${h.total} | ${h.passed} | ${h.failed} | ${percent(h.pass_rate)} | ${h.errors} | ${h.warnings} |`
      );
    }
    lines.push("");
  }

  lines.push("## 五、待处理违规", "");
  if (errors.length === 0 && warnings.length === 0) {
    lines.push("✅ 未发现违规。", "");
  } else {
    lines.push("| 章节 | 严重度 | 类型 | 问题 |", "| --- | --- | --- | --- |");
    for (const report of reports) {
      for (const v of report.violations) {
        lines.push(
          `| ${report.chapter_id} | ${v.severity} | ${typeLabel(v.type)} | ${v.message.replace(/\|/g, "\|")} |`
        );
      }
    }
    lines.push("");
  }

  fs.writeFileSync(outputPath, lines.join("\n"), "utf-8");
  console.log(`✅ Quality dashboard written to ${outputPath}`);
  console.log(`   Chapters: ${reports.length} | Pass rate: ${percent(passRate)}`);
}

main();
