import { describe, it, expect, vi } from "vitest";
import {
  runStructuredQA,
  runLLMQA,
  runFullQA,
} from "../physics-qa.ts";

describe("runStructuredQA", () => {
  it("passes clean markdown with no violations", () => {
    const content = `
# \u673a\u68b0\u8fd0\u52a8

## \u5b66\u4e60\u76ee\u6807
- \u7406\u89e3\u673a\u68b0\u8fd0\u52a8

## \u6838\u5fc3\u6982\u5ff5
\u901f\u5ea6\u516c\u5f0f\uff1a$v = \\frac{s}{t}$

## \u5178\u578b\u4f8b\u9898
\u4e00\u8f86\u6c7d\u8f66\u884c\u9a76 100 m\uff0c\u901f\u5ea6 20 m/s\uff0c\u6c42\u65f6\u95f4\u3002

\u89e3\uff1a$t = \\frac{s}{v} = 5\\,\\text{s}$

## \u6ce8\u610f\u4e8b\u9879
\u6ce8\u610f\u5355\u4f4d\u7edf\u4e00\u3002
`;
    const violations = runStructuredQA("motion-description", content);
    expect(violations.length).toBe(0);
  });

  it("detects unpaired $ in single line", () => {
    const content = `\u516c\u5f0f\uff1a$F = ma`;
    const violations = runStructuredQA("force-concept", content);
    expect(violations.some((v) => v.type === "formula" && v.line === 1)).toBe(
      true
    );
  });

  it("detects unpaired $$ blocks when odd count", () => {
    const content = `$$\\frac{1}{u}$$ some text $$\\frac{1}{v}`;
    const violations = runStructuredQA("lens", content);
    expect(violations.some((v) => v.type === "formula" && v.message.includes("$$"))).toBe(true);
  });

  it("detects out-of-scope keywords", () => {
    const content = `\u76f8\u5bf9\u8bba\u662f\u7231\u56e0\u65af\u5766\u63d0\u51fa\u7684\u7406\u8bba\u3002`;
    const violations = runStructuredQA("motion-description", content);
    expect(violations.some((v) => v.type === "scope")).toBe(true);
  });

  it("detects missing safety warnings for dangerous ops", () => {
    const content = `\u9ad8\u538b\u7535\u5b9e\u9a8c\u64cd\u4f5c\u6b65\u9aa4\uff1a1. \u6253\u5f00\u9ad8\u538b\u7535\u6e90`;
    const violations = runStructuredQA("home-circuit", content);
    expect(violations.some((v) => v.type === "safety")).toBe(true);
  });

  it("does not flag safety for safe content", () => {
    const content = `\u5f39\u7c27\u6d4b\u529b\u8ba1\u5b9e\u9a8c\uff1a\u6d4b\u91cf\u7269\u4f53\u91cd\u529b\u3002`;
    const violations = runStructuredQA("gravity-elastic-friction", content);
    expect(violations.some((v) => v.type === "safety")).toBe(false);
  });

  it("warns when learning goals exist but no examples", () => {
    const content = `## \u5b66\u4e60\u76ee\u6807\n- \u7406\u89e3\u6982\u5ff5\n\n## \u6838\u5fc3\u6982\u5ff5\n\u8fd9\u662f\u6982\u5ff5\u3002`;
    const violations = runStructuredQA("sound-basics", content);
    expect(violations.some((v) => v.type === "concept" && v.message.includes("\u4f8b\u9898"))).toBe(true);
  });

  it("does not warn about missing examples when there is an example section", () => {
    const content = `## \u5b66\u4e60\u76ee\u6807\n- \u7406\u89e3\u6982\u5ff5\n\n## \u5178\u578b\u4f8b\u9898\n1+1=2`;
    const violations = runStructuredQA("sound-basics", content);
    expect(violations.some((v) => v.message.includes("\u4f8b\u9898"))).toBe(false);
  });

  // ========== \u7269\u7406\u89c4\u5f8b\u6027\u4e13\u9879\u68c0\u67e5 ==========
  it("detects wrong buoyancy direction", () => {
    const content = `\u6d6e\u529b\u65b9\u5411\u662f\u6c34\u5e73\u5411\u5de6\u7684\u3002`;
    const violations = runStructuredQA("buoyancy", content);
    expect(violations.some((v) => v.message.includes("\u6d6e\u529b\u65b9\u5411"))).toBe(true);
  });

  it("detects wrong pitch-frequency relationship", () => {
    const content = `\u97f3\u8c03\u4e0e\u9891\u7387\u6210\u53cd\u6bd4\u3002`;
    const violations = runStructuredQA("sound-properties", content);
    expect(violations.some((v) => v.message.includes("\u97f3\u8c03") && v.message.includes("\u9891\u7387"))).toBe(true);
  });

  it("detects wrong reflection law", () => {
    const content = `\u53cd\u5c04\u89d2 > \u5165\u5c04\u89d2`;
    const violations = runStructuredQA("light-reflection", content);
    expect(violations.some((v) => v.type === "concept" && v.message.includes("\u53cd\u5c04\u89d2"))).toBe(true);
  });

  it("detects ammeter parallel connection error", () => {
    const content = `\u7535\u6d41\u8868\u5e94\u8be5\u5e76\u8054\u5728\u7535\u8def\u4e2d\u3002`;
    const violations = runStructuredQA("current-voltage", content);
    expect(violations.some((v) => v.message.includes("\u7535\u6d41\u8868") && v.message.includes("\u4e32\u8054"))).toBe(true);
  });

  it("detects voltmeter series connection error", () => {
    const content = `\u7535\u538b\u8868\u5e94\u8be5\u4e32\u8054\u5728\u7535\u8def\u4e2d\u3002`;
    const violations = runStructuredQA("current-voltage", content);
    expect(violations.some((v) => v.message.includes("\u7535\u538b\u8868") && v.message.includes("\u5e76\u8054"))).toBe(true);
  });

  it("detects short circuit description", () => {
    const content = `\u53ef\u4ee5\u901a\u8fc7\u7535\u6e90\u77ed\u8def\u6765\u589e\u5927\u7535\u6d41\u3002`;
    const violations = runStructuredQA("electric-circuit", content);
    expect(violations.some((v) => v.type === "safety" && v.message.includes("\u77ed\u8def"))).toBe(true);
  });
});

describe("runLLMQA", () => {
  it("returns warning when GEMINI_API_KEY is not set", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const violations = await runLLMQA("ch-01", "\u4e00\u4e9b\u5185\u5bb9");

    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey;
    }

    expect(
      violations.some((v) => v.message.includes("GEMINI_API_KEY \u672a\u8bbe\u7f6e"))
    ).toBe(true);
  });

  it("gracefully handles API errors", async () => {
    const violations = await runLLMQA("ch-01", "test", "invalid-key-12345");
    expect(violations.some((v) => v.message.includes("LLM \u8d28\u68c0\u8c03\u7528\u5931\u8d25"))).toBe(
      true
    );
  });
});

describe("runFullQA", () => {
  it("combines structured and LLM results", async () => {
    const content = `$E = mc^2$ \u662f\u76f8\u5bf9\u8bba\u516c\u5f0f\u3002`;
    const report = await runFullQA("ch-01", content, undefined);
    expect(report.chapter_id).toBe("ch-01");
    expect(report.passed).toBe(false);
    expect(report.violations.some((v) => v.type === "scope")).toBe(true);
    expect(report.violations.some((v) => v.message.includes("GEMINI_API_KEY"))).toBe(true);
  });
});
