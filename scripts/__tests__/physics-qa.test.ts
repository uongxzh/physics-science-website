import { describe, it, expect, vi } from "vitest";
import {
  runStructuredQA,
  runLLMQA,
  runFullQA,
  type QAViolation,
} from "../physics-qa.ts";

describe("runStructuredQA", () => {
  it("passes clean markdown with no violations", () => {
    const content = `
# 机械运动

## 学习目标
- 理解机械运动

## 核心概念
速度公式：$v = \\frac{s}{t}$

## 例题
一辆汽车行驶 100 m，速度 20 m/s，求时间。

解：$t = \\frac{s}{v} = 5\\,\\text{s}$

## 注意事项
注意单位统一。
`;
    const violations = runStructuredQA("ch-clean", content);
    expect(violations.length).toBe(0);
  });

  it("detects unpaired $ in single line", () => {
    const content = `公式：$F = ma`;
    const violations = runStructuredQA("ch-01", content);
    expect(violations.some((v) => v.type === "formula" && v.line === 1)).toBe(
      true
    );
  });

  it("detects unpaired $$ blocks", () => {
    const content = `$$\\frac{1}{u} + \\frac{1}{v} = \\frac{1}{f}$$`;
    const violations = runStructuredQA("ch-01", content);
    // This is actually paired $$ so should be fine
    expect(violations.filter((v) => v.type === "formula").length).toBe(0);
  });

  it("detects unpaired $$ blocks when odd count", () => {
    const content = `$$\\frac{1}{u}$$ some text $$\\frac{1}{v}`;
    const violations = runStructuredQA("ch-01", content);
    expect(violations.some((v) => v.type === "formula" && v.message.includes("$$"))).toBe(true);
  });

  it("detects out-of-scope keywords", () => {
    const content = `相对论是爱因斯坦提出的理论。`;
    const violations = runStructuredQA("ch-01", content);
    expect(violations.some((v) => v.type === "scope")).toBe(true);
  });

  it("detects missing safety warnings for dangerous ops", () => {
    const content = `高压电实验操作步骤：1. 打开高压电源`;
    const violations = runStructuredQA("ch-01", content);
    expect(violations.some((v) => v.type === "safety")).toBe(true);
  });

  it("does not flag safety for safe content", () => {
    const content = `弹簧测力计实验：测量物体重力。`;
    const violations = runStructuredQA("ch-01", content);
    expect(violations.some((v) => v.type === "safety")).toBe(false);
  });

  it("warns when learning goals exist but no examples", () => {
    const content = `## 学习目标\n- 理解概念\n\n## 核心概念\n这是概念。`;
    const violations = runStructuredQA("ch-01", content);
    expect(violations.some((v) => v.type === "concept" && v.message.includes("例题"))).toBe(true);
  });

  it("does not warn about missing examples when there is an example section", () => {
    const content = `## 学习目标\n- 理解概念\n\n## 例题\n1+1=2`;
    const violations = runStructuredQA("ch-01", content);
    expect(violations.some((v) => v.message.includes("例题"))).toBe(false);
  });
});

describe("runLLMQA", () => {
  it("returns warning when GEMINI_API_KEY is not set", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const violations = await runLLMQA("ch-01", "一些内容");

    if (originalKey) {
      process.env.GEMINI_API_KEY = originalKey;
    }

    expect(
      violations.some((v) => v.message.includes("GEMINI_API_KEY 未设置"))
    ).toBe(true);
  });

  it("gracefully handles API errors", async () => {
    const violations = await runLLMQA("ch-01", "test", "invalid-key-12345");
    expect(violations.some((v) => v.message.includes("LLM 质检调用失败"))).toBe(
      true
    );
  });
});

describe("runFullQA", () => {
  it("combines structured and LLM results", async () => {
    const content = `$E = mc^2$ 是相对论公式。`;
    const report = await runFullQA("ch-01", content, undefined);
    expect(report.chapter_id).toBe("ch-01");
    expect(report.passed).toBe(false);
    expect(report.violations.some((v) => v.type === "scope")).toBe(true);
    expect(report.violations.some((v) => v.message.includes("GEMINI_API_KEY"))).toBe(true);
  });
});
