import type { APIRoute } from "astro";

const COMMIT_MESSAGE = "feat(cms): update content via admin UI";

function normalizePath(path: string) {
	return path.replace(/^\/+/, "");
}

function isAllowedPath(path: string) {
	return /^src\/content\/(note|jotting)\/[\w\-/]+\.md$/.test(path);
}

async function githubFetch(url: string, token: string, init?: RequestInit) {
	return fetch(url, {
		...init,
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github+json",
			"Content-Type": "application/json",
			"X-GitHub-Api-Version": "2022-11-28",
			...(init?.headers || {})
		}
	});
}

export const POST: APIRoute = async ({ request }) => {
	const token = import.meta.env.GITHUB_TOKEN;
	const owner = import.meta.env.GITHUB_OWNER;
	const repo = import.meta.env.GITHUB_REPO;
	const branch = import.meta.env.GITHUB_BRANCH || "main";

	if (!token || !owner || !repo) {
		return new Response(JSON.stringify({ ok: false, message: "Missing GitHub env vars" }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}

	let payload: { path?: string; content?: string };
	try {
		payload = await request.json();
	} catch {
		return new Response(JSON.stringify({ ok: false, message: "Invalid JSON body" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
	}

	const path = normalizePath(payload.path || "");
	const content = payload.content || "";

	if (!path || !content) {
		return new Response(JSON.stringify({ ok: false, message: "path and content are required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
	}

	if (!isAllowedPath(path)) {
		return new Response(JSON.stringify({ ok: false, message: "Invalid path" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
	}

	const encodedPath = encodeURIComponent(path);
	const contentUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;

	let sha: string | undefined;
	const getRes = await githubFetch(contentUrl, token, { method: "GET" });
	if (getRes.status === 200) {
		const getJson = (await getRes.json()) as { sha?: string };
		sha = getJson.sha;
	} else if (getRes.status !== 404) {
		const message = await getRes.text();
		return new Response(JSON.stringify({ ok: false, message: `GitHub GET failed: ${message}` }), {
			status: 502,
			headers: { "Content-Type": "application/json" }
		});
	}

	const body = {
		message: COMMIT_MESSAGE,
		content: Buffer.from(content, "utf-8").toString("base64"),
		branch,
		...(sha ? { sha } : {})
	};

	const putRes = await githubFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`, token, {
		method: "PUT",
		body: JSON.stringify(body)
	});

	if (!putRes.ok) {
		const message = await putRes.text();
		return new Response(JSON.stringify({ ok: false, message: `GitHub PUT failed: ${message}` }), {
			status: 502,
			headers: { "Content-Type": "application/json" }
		});
	}

	const result = await putRes.json();
	return new Response(JSON.stringify({ ok: true, message: "Saved to GitHub", result }), {
		status: 200,
		headers: { "Content-Type": "application/json" }
	});
};
