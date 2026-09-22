/**
 * Cloudflare Pages Function - Content bug feedback
 *
 * POST /api/report-content-bug
 * Body: { chapterId: string, chapterTitle: string, description: string }
 *
 * Creates a GitHub Issue with the `content-bug` label using the GitHub REST API.
 * Required secret (bind as an environment variable in Cloudflare Pages):
 *   GITHUB_TOKEN or CONTENT_BUG_TOKEN
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  const token = env.GITHUB_TOKEN || env.CONTENT_BUG_TOKEN;
  if (!token) {
    return json({ error: "GitHub token is not configured on the server" }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const chapterId = String(payload.chapterId || "").slice(0, 128).trim();
  const chapterTitle = String(payload.chapterTitle || "").slice(0, 256).trim();
  const description = String(payload.description || "").slice(0, 4000).trim();

  if (!chapterId || !description) {
    return json({ error: "chapterId and description are required" }, 400);
  }

  const repo = env.GITHUB_REPO || "uongxzh/physics-science-website";
  const title = `[content-bug] ${chapterTitle || chapterId} (${chapterId})`;
  const body = [
    "## 章节",
    `- ID: ${chapterId}`,
    `- 标题: ${chapterTitle || chapterId}`,
    "",
    "## 错误描述",
    description,
    "",
    "## 来源",
    "网页报告错误按钮",
  ].join("\n");

  const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "physics-science-website-content-bug",
    },
    body: JSON.stringify({
      title,
      body,
      labels: ["content-bug"],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json({ error: data.message || `GitHub API error: ${response.status}` }, 502);
  }

  return json({ html_url: data.html_url, number: data.number }, 201);
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
