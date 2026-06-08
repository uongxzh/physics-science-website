const fs = require('fs');
const path = require('path');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/chat/completions';

const PROMPTS = {
  dailyProblem: (topic, grade) => `
你是一位资深初中物理教师，熟悉人教版初中物理教材。请生成一道符合${grade}学生水平的物理例题。

要求：
1. 主题：${topic}
2. 难度：中等
3. 联系生活实际
4. 输出格式为JSON，包含以下字段：
   - title: 题目标题
   - question: 题目内容（LaTeX公式用$包裹）
   - options: 如果是选择题则提供4个选项，否则为null
   - answer: 正确答案
   - explanation: 详细解答过程
   - keyPoint: 考点分析
   - mistake: 易错点提示
   - difficulty: 难度星级（1-5）
   - chapter: 所属章节

请只输出JSON，不要其他说明。`,

  knowledgePoint: (topic, grade) => `
请以JSON格式生成初中物理"${topic}"知识点，要求：
- 适用年级：${grade}
- 包含：concept（概念定义）、formula（公式，LaTeX格式）、unit（单位）、example（生活实例）、misconception（常见误区）
- 语言风格：生动有趣，适合${grade}学生理解
- 字数：800-1200字

请只输出JSON。`,
};

async function callDeepSeek(prompt) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一位资深初中物理教师，擅长生成结构化的教学内容。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function extractJson(text) {
  const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
  return match ? match[1] || match[0] : text;
}

async function generateDailyProblem() {
  const topics = ['浮力与阿基米德原理', '欧姆定律', '光的折射', '功和功率', '简单机械', '杠杆原理', '压强与液体压强', '电路分析'];
  const grades = ['初二', '初三'];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const grade = grades[Math.floor(Math.random() * grades.length)];

  console.log(`Generating problem: ${topic} for ${grade}`);

  const prompt = PROMPTS.dailyProblem(topic, grade);
  const content = await callDeepSeek(prompt);
  const jsonStr = extractJson(content);
  const problem = JSON.parse(jsonStr);

  const date = new Date().toISOString().split('T')[0];
  const filename = path.join('content', 'problems', `${date}-${topic.replace(/\s+/g, '-')}.json`);

  fs.mkdirSync(path.dirname(filename), { recursive: true });

  const output = {
    ...problem,
    meta: {
      generatedAt: new Date().toISOString(),
      topic,
      grade,
      source: 'deepseek-ai',
    },
  };

  fs.writeFileSync(filename, JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅ Saved to ${filename}`);
  return filename;
}

async function generateKnowledgePoint() {
  const topics = ['牛顿第一定律', '光的反射', '电功率', '比热容', '密度'];
  const grades = ['初二', '初三'];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const grade = grades[Math.floor(Math.random() * grades.length)];

  console.log(`Generating knowledge: ${topic} for ${grade}`);

  const prompt = PROMPTS.knowledgePoint(topic, grade);
  const content = await callDeepSeek(prompt);
  const jsonStr = extractJson(content);
  const knowledge = JSON.parse(jsonStr);

  const filename = path.join('content', 'knowledge', `${topic.replace(/\s+/g, '-')}.json`);
  fs.mkdirSync(path.dirname(filename), { recursive: true });

  const output = {
    ...knowledge,
    meta: {
      generatedAt: new Date().toISOString(),
      topic,
      grade,
      source: 'deepseek-ai',
    },
  };

  fs.writeFileSync(filename, JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅ Saved to ${filename}`);
  return filename;
}

async function main() {
  if (!DEEPSEEK_API_KEY) {
    console.error('❌ Error: DEEPSEEK_API_KEY environment variable is required');
    console.error('   Set it with: $env:DEEPSEEK_API_KEY="your-key"');
    process.exit(1);
  }

  try {
    await generateDailyProblem();
    await generateKnowledgePoint();
    console.log('\n🎉 All content generated successfully!');
  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);
    process.exit(1);
  }
}

main();
