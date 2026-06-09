import { describe, it, expect } from "vitest";
import { scanGaps, type GapReport } from "../scan-gaps.ts";

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
    grade: "test",
    semesters: [
      {
        id: "sem-1",
        name: "Test Semester",
        chapters,
      },
    ],
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
    expect(report.empty_chapters).toEqual(["ch-01 — Empty Chapter"]);
    expect(report.incomplete_chapters).toEqual(["ch-01 — Empty Chapter"]);
    expect(report.missing_experiments).toEqual(["ch-01 — Empty Chapter"]);
    expect(report.missing_problems).toEqual(["ch-01 — Empty Chapter"]);
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
    expect(report.incomplete_chapters).toEqual(["ch-01 — Short Chapter"]);
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
    expect(report.missing_experiments).toEqual(["ch-01 — No Experiment"]);
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
    expect(report.missing_problems).toEqual(["ch-01 — No Problems"]);
    expect(report.missing_experiments).toEqual([]);
  });

  it("handles multiple semesters", () => {
    const curriculum = {
      version: "1.0.0",
      grade: "test",
      semesters: [
        {
          id: "sem-1",
          name: "Semester 1",
          chapters: [
            {
              id: "ch-01",
              title: "A",
              status: "complete",
              word_count: 1000,
              has_experiment: true,
              has_problems: true,
            },
          ],
        },
        {
          id: "sem-2",
          name: "Semester 2",
          chapters: [
            {
              id: "ch-02",
              title: "B",
              status: "empty",
              word_count: 0,
              has_experiment: false,
              has_problems: false,
            },
          ],
        },
      ],
    };

    const report = scanGaps(curriculum);
    expect(report.total_chapters).toBe(2);
    expect(report.empty_chapters).toEqual(["ch-02 — B"]);
  });

  it("includes generated_at timestamp", () => {
    const curriculum = makeCurriculum([]);
    const report = scanGaps(curriculum);
    expect(report.generated_at).toBeDefined();
    expect(new Date(report.generated_at).getTime()).not.toBeNaN();
  });
});
