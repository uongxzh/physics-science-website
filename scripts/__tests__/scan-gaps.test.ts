import { describe, it, expect } from "vitest";
import { scanGaps } from "../scan-gaps.ts";

function makeCurriculum(
  chapters: Array<{
    id: string;
    title: string;
    status: string;
    word_count: number;
    has_experiment: boolean;
    has_problems: boolean;
  }>
) {
  return {
    version: "1.0.0",
    last_updated: "2026-06-09",
    total_chapters: chapters.length,
    categories: [
      { id: "acoustics", name: "\u58f0\u5b66", icon: "\ud83d\udd0a", chapter_count: 0 },
    ],
    chapters: chapters.map((c) => ({
      ...c,
      description: "",
      category: "acoustics",
      order: 1,
      last_updated: null,
      tags: [],
    })),
  };
}

describe("scanGaps", () => {
  it("returns empty report for all-complete chapters", () => {
    const curriculum = makeCurriculum([
      {
        id: "ch-01",
        title: "Complete Chapter",
        status: "complete",
        word_count: 1200,
        has_experiment: true,
        has_problems: true,
      },
    ]);

    const report = scanGaps(curriculum);
    expect(report.total_chapters).toBe(1);
    expect(report.empty_chapters).toEqual([]);
    expect(report.incomplete_chapters).toEqual([]);
    expect(report.missing_experiments).toEqual([]);
    expect(report.missing_problems).toEqual([]);
  });

  it("detects empty chapters", () => {
    const curriculum = makeCurriculum([
      {
        id: "ch-01",
        title: "Empty Chapter",
        status: "empty",
        word_count: 0,
        has_experiment: false,
        has_problems: false,
      },
    ]);

    const report = scanGaps(curriculum);
    expect(report.empty_chapters).toEqual(["ch-01 \u2014 Empty Chapter"]);
    expect(report.incomplete_chapters).toEqual(["ch-01 \u2014 Empty Chapter"]);
    expect(report.missing_experiments).toEqual(["ch-01 \u2014 Empty Chapter"]);
    expect(report.missing_problems).toEqual(["ch-01 \u2014 Empty Chapter"]);
  });

  it("detects incomplete chapters (word_count < 500)", () => {
    const curriculum = makeCurriculum([
      {
        id: "ch-01",
        title: "Short Chapter",
        status: "incomplete",
        word_count: 300,
        has_experiment: true,
        has_problems: true,
      },
    ]);

    const report = scanGaps(curriculum);
    expect(report.empty_chapters).toEqual([]);
    expect(report.incomplete_chapters).toEqual(["ch-01 \u2014 Short Chapter"]);
    expect(report.missing_experiments).toEqual([]);
    expect(report.missing_problems).toEqual([]);
  });

  it("detects missing experiments", () => {
    const curriculum = makeCurriculum([
      {
        id: "ch-01",
        title: "No Experiment",
        status: "complete",
        word_count: 800,
        has_experiment: false,
        has_problems: true,
      },
    ]);

    const report = scanGaps(curriculum);
    expect(report.missing_experiments).toEqual(["ch-01 \u2014 No Experiment"]);
    expect(report.missing_problems).toEqual([]);
  });

  it("detects missing problems", () => {
    const curriculum = makeCurriculum([
      {
        id: "ch-01",
        title: "No Problems",
        status: "complete",
        word_count: 800,
        has_experiment: true,
        has_problems: false,
      },
    ]);

    const report = scanGaps(curriculum);
    expect(report.missing_problems).toEqual(["ch-01 \u2014 No Problems"]);
    expect(report.missing_experiments).toEqual([]);
  });

  it("handles multiple categories", () => {
    const curriculum = {
      version: "1.0.0",
      last_updated: "2026-06-09",
      total_chapters: 2,
      categories: [
        { id: "optics", name: "\u5149\u5b66", icon: "\ud83d\udd26", chapter_count: 1 },
        { id: "mechanics", name: "\u529b\u5b66", icon: "\u2699\ufe0f", chapter_count: 1 },
      ],
      chapters: [
        {
          id: "ch-01",
          title: "A",
          description: "",
          category: "optics",
          order: 1,
          status: "complete",
          word_count: 1000,
          has_experiment: true,
          has_problems: true,
          last_updated: null,
          tags: [],
        },
        {
          id: "ch-02",
          title: "B",
          description: "",
          category: "mechanics",
          order: 2,
          status: "empty",
          word_count: 0,
          has_experiment: false,
          has_problems: false,
          last_updated: null,
          tags: [],
        },
      ],
    };

    const report = scanGaps(curriculum);
    expect(report.total_chapters).toBe(2);
    expect(report.empty_chapters).toEqual(["ch-02 \u2014 B"]);
  });

  it("includes generated_at timestamp", () => {
    const curriculum = makeCurriculum([]);
    const report = scanGaps(curriculum);
    expect(report.generated_at).toBeDefined();
    expect(new Date(report.generated_at).getTime()).not.toBeNaN();
  });
});
