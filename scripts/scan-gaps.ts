#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CurriculumChapter {
  id: string;
  title: string;
  status: string;
  word_count: number;
  has_experiment: boolean;
  has_problems: boolean;
}

interface CurriculumSemester {
  id: string;
  name: string;
  chapters: CurriculumChapter[];
}

interface CurriculumData {
  version: string;
  grade: string;
  semesters: CurriculumSemester[];
}

export interface GapReport {
  total_chapters: number;
  empty_chapters: string[];
  incomplete_chapters: string[];
  missing_experiments: string[];
  missing_problems: string[];
  generated_at: string;
}

export function scanGaps(curriculum: CurriculumData): GapReport {
  const report: GapReport = {
    total_chapters: 0,
    empty_chapters: [],
    incomplete_chapters: [],
    missing_experiments: [],
    missing_problems: [],
    generated_at: new Date().toISOString(),
  };

  for (const semester of curriculum.semesters) {
    for (const chapter of semester.chapters) {
      report.total_chapters++;

      const label = `${chapter.id} — ${chapter.title}`;

      if (chapter.status === "empty") {
        report.empty_chapters.push(label);
      }

      if (chapter.word_count < 500) {
        report.incomplete_chapters.push(label);
      }

      if (chapter.has_experiment === false) {
        report.missing_experiments.push(label);
      }

      if (chapter.has_problems === false) {
        report.missing_problems.push(label);
      }
    }
  }

  return report;
}

function main() {
  const inputPath =
    process.argv[2] || path.join(__dirname, "..", "public", "content", "curriculum.json");
  const outputPath =
    process.argv[3] || path.join(__dirname, "..", "gaps-report.json");

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Curriculum file not found: ${inputPath}`);
    process.exit(1);
  }

  let curriculum: CurriculumData;
  try {
    const raw = fs.readFileSync(inputPath, "utf-8");
    curriculum = JSON.parse(raw) as CurriculumData;
  } catch (err) {
    console.error(`❌ Failed to parse curriculum JSON: ${(err as Error).message}`);
    process.exit(1);
  }

  const report = scanGaps(curriculum);

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");

  console.log(`✅ Gap report written to ${outputPath}`);
  console.log(`   Total chapters: ${report.total_chapters}`);
  console.log(`   Empty: ${report.empty_chapters.length}`);
  console.log(`   Incomplete (<500 words): ${report.incomplete_chapters.length}`);
  console.log(`   Missing experiments: ${report.missing_experiments.length}`);
  console.log(`   Missing problems: ${report.missing_problems.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
