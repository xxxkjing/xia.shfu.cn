import type { APIRoute } from "astro";

export const prerender = false;

const getGithubEnv = () => {
	const token = import.meta.env.GITHUB_TOKEN;
	const owner = import.meta.env.GITHUB_OWNER;
	const repo = import.meta.env.GITHUB_REPO;
	const branch = import.meta.env.GITHUB_BRANCH || "main";
	if (!token || !owner || !repo) return null;
	return { token, owner, repo, branch };
};

const githubHeaders = (token: string) => ({
	authorization: `Bearer ${token}`,
	accept: "application/vnd.github+json",
	"X-GitHub-Api-Version": "2022-11-28"
});

const isAllowedMediaPath = (filePath: string) => filePath.startsWith("public/uploads/") && !filePath.includes("..");

export const GET: APIRoute = async () => {
	const env = getGithubEnv();
	if (!env) {
		return new Response(JSON.stringify({ ok: false, error: "GitHub 环境变量缺失" }), {
			status: 500,
			headers: { "content-type": "application/json" }
		});
	}

	const listResponse = await fetch(
		`https://api.github.com/repos/${env.owner}/${env.repo}/contents/public/uploads?ref=${encodeURIComponent(env.branch)}`,
		{
			headers: githubHeaders(env.token)
		}
	);

	if (listResponse.status === 404) {
		return new Response(JSON.stringify({ ok: true, items: [] }), {
			headers: { "content-type": "application/json" }
		});
	}

	if (!listResponse.ok) {
		const detail = await listResponse.text();
		return new Response(JSON.stringify({ ok: false, error: "读取媒体列表失败", detail }), {
			status: 502,
			headers: { "content-type": "application/json" }
		});
	}

	const raw = await listResponse.json();
	const items = Array.isArray(raw)
		? raw
				.filter(item => item.type === "file")
				.map(item => ({
					name: item.name,
					path: item.path,
					size: item.size,
					url: `/uploads/${item.name}`,
					markdown: `![${item.name}](/uploads/${item.name})`
				}))
		: [];

	return new Response(JSON.stringify({ ok: true, items }), {
		headers: { "content-type": "application/json" }
	});
};

export const DELETE: APIRoute = async ({ request }) => {
	const env = getGithubEnv();
	if (!env) {
		return new Response(JSON.stringify({ ok: false, error: "GitHub 环境变量缺失" }), {
			status: 500,
			headers: { "content-type": "application/json" }
		});
	}

	const { path } = await request.json().catch(() => ({ path: "" }));
	if (typeof path !== "string" || !isAllowedMediaPath(path)) {
		return new Response(JSON.stringify({ ok: false, error: "非法路径" }), {
			status: 400,
			headers: { "content-type": "application/json" }
		});
	}

	const getResponse = await fetch(`https://api.github.com/repos/${env.owner}/${env.repo}/contents/${path}?ref=${encodeURIComponent(env.branch)}`, {
		headers: githubHeaders(env.token)
	});

	if (!getResponse.ok) {
		const detail = await getResponse.text();
		return new Response(JSON.stringify({ ok: false, error: "获取媒体 SHA 失败", detail }), {
			status: 502,
			headers: { "content-type": "application/json" }
		});
	}

	const fileData = (await getResponse.json()) as { sha?: string };
	if (!fileData.sha) {
		return new Response(JSON.stringify({ ok: false, error: "缺少文件 SHA" }), {
			status: 500,
			headers: { "content-type": "application/json" }
		});
	}

	const deleteResponse = await fetch(`https://api.github.com/repos/${env.owner}/${env.repo}/contents/${path}`, {
		method: "DELETE",
		headers: {
			...githubHeaders(env.token),
			"content-type": "application/json"
		},
		body: JSON.stringify({
			message: "feat(cms): update content via admin UI",
			sha: fileData.sha,
			branch: env.branch
		})
	});

	if (!deleteResponse.ok) {
		const detail = await deleteResponse.text();
		return new Response(JSON.stringify({ ok: false, error: "删除媒体失败", detail }), {
			status: 502,
			headers: { "content-type": "application/json" }
		});
	}

	return new Response(JSON.stringify({ ok: true }), {
		headers: { "content-type": "application/json" }
	});
};
