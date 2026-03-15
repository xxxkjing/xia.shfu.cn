import type { APIRoute } from "astro";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "$utils/admin-auth";

const COMMIT_MESSAGE = "feat(cms): update content via admin UI";

interface SavePayload {
	path?: string;
	content?: string;
}

const isSafeContentPath = (path: string) => path.startsWith("src/content/") && path.endsWith(".md") && !path.includes("..") && !path.startsWith("/");

export const POST: APIRoute = async ({ request, cookies, locals }) => {
	const runtimeEnv = (locals as { runtime?: { env?: Record<string, string | undefined> } }).runtime?.env;
	const env = runtimeEnv ?? process.env;

	const token = cookies.get(ADMIN_COOKIE_NAME)?.value;
	if (!verifyAdminSession(token, env)) {
		return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
	}

	const githubToken = env.GITHUB_TOKEN;
	const owner = env.GITHUB_OWNER;
	const repo = env.GITHUB_REPO;
	const branch = env.GITHUB_BRANCH || "main";

	if (!githubToken || !owner || !repo) {
		return new Response(JSON.stringify({ success: false, error: "Missing GitHub env vars: GITHUB_TOKEN/GITHUB_OWNER/GITHUB_REPO" }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}

	let payload: SavePayload;
	try {
		payload = await request.json();
	} catch {
		return new Response(JSON.stringify({ success: false, error: "Invalid JSON payload" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
	}

	const path = String(payload.path ?? "").trim();
	const content = String(payload.content ?? "");

	if (!path || !content) {
		return new Response(JSON.stringify({ success: false, error: "path and content are required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
	}

	if (!isSafeContentPath(path)) {
		return new Response(JSON.stringify({ success: false, error: "Invalid content path" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
	}

	const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
	const headers = {
		authorization: `Bearer ${githubToken}`,
		accept: "application/vnd.github+json",
		"content-type": "application/json"
	};

	let existingSha: string | undefined;
	const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, { headers });
	if (getRes.ok) {
		const getData = (await getRes.json()) as { sha?: string };
		existingSha = getData.sha;
	} else if (getRes.status !== 404) {
		const detail = await getRes.text();
		return new Response(JSON.stringify({ success: false, error: "Failed to check existing file", detail }), {
			status: 502,
			headers: { "Content-Type": "application/json" }
		});
	}

	const encoded = Buffer.from(content, "utf-8").toString("base64");
	const body = {
		message: COMMIT_MESSAGE,
		content: encoded,
		branch,
		...(existingSha ? { sha: existingSha } : {})
	};

	const putRes = await fetch(apiBase, {
		method: "PUT",
		headers,
		body: JSON.stringify(body)
	});

	if (!putRes.ok) {
		const detail = await putRes.text();
		return new Response(JSON.stringify({ success: false, error: "Failed to save file to GitHub", detail }), {
			status: 502,
			headers: { "Content-Type": "application/json" }
		});
	}

	const data = await putRes.json();
	return new Response(JSON.stringify({ success: true, data }), {
		status: 200,
		headers: { "Content-Type": "application/json" }
	});
};
