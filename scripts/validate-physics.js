const fs = require('fs');

function validateProblem(filePath) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const issues = [];

  const requiredFields = ['title', 'question', 'answer', 'explanation'];
  for (const field of requiredFields) {
    if (!content[field]) {
      issues.push(`缺少必要字段: ${field}`);
    }
  }

  const questionDollarCount = (content.question?.match(/\$/g) || []).length;
  if (questionDollarCount % 2 !== 0) {
    issues.push('题目中 LaTeX 公式 $ 符号不成对');
  }

  const numbers = content.question?.match(/\d+(\.\d+)?/g)?.map(Number) || [];
  const unreasonableNumbers = numbers.filter(n => n > 1000000 || (n > 1000 && n < 1));
  if (unreasonableNumbers.length > 0) {
    issues.push(`包含可能不合理的数值: ${unreasonableNumbers.join(', ')}`);
  }

  if (content.options && Array.isArray(content.options)) {
    const validOptions = ['A', 'B', 'C', 'D'];
    if (!validOptions.includes(content.answer?.toUpperCase())) {
      issues.push('选择题答案不是 A/B/C/D');
    }
  }

  if (content.difficulty < 1 || content.difficulty > 5) {
    issues.push('难度星级应在 1-5 之间');
  }

  return {
    valid: issues.length === 0,
    issues,
    file: filePath,
  };
}

function validateKnowledge(filePath) {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const issues = [];

  const requiredFields = ['concept', 'formula', 'unit', 'example'];
  for (const field of requiredFields) {
    if (!content[field]) {
      issues.push(`缺少必要字段: ${field}`);
    }
  }

  const formulaDollarCount = (content.formula?.match(/\$/g) || []).length;
  if (formulaDollarCount % 2 !== 0) {
    issues.push('公式中 LaTeX $ 符号不成对');
  }

  return {
    valid: issues.length === 0,
    issues,
    file: filePath,
  };
}

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node validate-physics.js <file-path>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const isKnowledge = filePath.includes('knowledge');
  const result = isKnowledge ? validateKnowledge(filePath) : validateProblem(filePath);

  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exit(1);
}

main();
