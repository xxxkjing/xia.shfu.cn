import type { APIRoute } from "astro";

export const prerender = false;

const getGithubEnv = () => {
	const token = import.meta.env.GITHUB_TOKEN;
	const owner = import.meta.env.GITHUB_OWNER;
	const repo = import.meta.env.GITHUB_REPO;
	const branch = import.meta.env.GITHUB_BRANCH || "main";

	if (!token || !owner || !repo) {
		return null;
	}

	return { token, owner, repo, branch };
};

const buildApiUrl = (owner: string, repo: string, path: string) => `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

const sanitizePath = (filePath: string) => {
	if (!filePath || typeof filePath !== "string") return null;
	if (!filePath.startsWith("src/content/")) return null;
	if (!filePath.endsWith(".md")) return null;
	if (filePath.includes("..")) return null;
	return filePath.replace(/^\/+/, "");
};

const githubHeaders = (token: string) => ({
	Authorization: `Bearer ${token}`,
	Accept: "application/vnd.github+json",
	"X-GitHub-Api-Version": "2022-11-28"
});

export const POST: APIRoute = async ({ request }) => {
	const env = getGithubEnv();
	if (!env) {
		return new Response(JSON.stringify({ ok: false, error: "GitHub 环境变量缺失" }), {
			status: 500,
			headers: { "content-type": "application/json" }
		});
	}

	let payload: { path?: string; content?: string };
	try {
		payload = await request.json();
	} catch {
		return new Response(JSON.stringify({ ok: false, error: "无效的 JSON 请求体" }), {
			status: 400,
			headers: { "content-type": "application/json" }
		});
	}

	const path = sanitizePath(payload.path || "");
	const content = payload.content;
	if (!path || !content) {
		return new Response(JSON.stringify({ ok: false, error: "path 或 content 不合法" }), {
			status: 400,
			headers: { "content-type": "application/json" }
		});
	}

	const getUrl = `${buildApiUrl(env.owner, env.repo, path)}?ref=${encodeURIComponent(env.branch)}`;
	let sha: string | undefined;

	const getResponse = await fetch(getUrl, { headers: githubHeaders(env.token) });
	if (getResponse.ok) {
		const data = (await getResponse.json()) as { sha?: string };
		sha = data.sha;
	} else if (getResponse.status !== 404) {
		const errorBody = await getResponse.text();
		return new Response(JSON.stringify({ ok: false, error: "读取 GitHub 文件失败", detail: errorBody }), {
			status: 502,
			headers: { "content-type": "application/json" }
		});
	}

	const encodedContent = Buffer.from(content, "utf-8").toString("base64");
	const putResponse = await fetch(buildApiUrl(env.owner, env.repo, path), {
		method: "PUT",
		headers: {
			...githubHeaders(env.token),
			"content-type": "application/json"
		},
		body: JSON.stringify({
			message: "feat(cms): update content via admin UI",
			content: encodedContent,
			branch: env.branch,
			...(sha && { sha })
		})
	});

	if (!putResponse.ok) {
		const errorBody = await putResponse.text();
		return new Response(JSON.stringify({ ok: false, error: "写入 GitHub 失败", detail: errorBody }), {
			status: 502,
			headers: { "content-type": "application/json" }
		});
	}

	const result = (await putResponse.json()) as {
		content?: { html_url?: string; path?: string };
		commit?: { sha?: string };
	};

	return new Response(
		JSON.stringify({
			ok: true,
			path: result.content?.path || path,
			html_url: result.content?.html_url,
			commit: result.commit?.sha
		}),
		{ headers: { "content-type": "application/json" } }
	);
};
