import type { APIRoute } from "astro";

interface SavePayload {
	path: string;
	content: string;
}

function getGitHubEnv() {
	const token = import.meta.env.GITHUB_TOKEN;
	const owner = import.meta.env.GITHUB_OWNER;
	const repo = import.meta.env.GITHUB_REPO;
	const branch = import.meta.env.GITHUB_BRANCH || "main";
	if (!token || !owner || !repo) return null;
	return { token, owner, repo, branch };
}

function isSafePath(path: string): boolean {
	return /^src\/content\/(note|jotting)\/zh-cn\/[a-zA-Z0-9-_./]+\.md$/.test(path) && !path.includes("..");
}

async function githubGetFileSha(env: NonNullable<ReturnType<typeof getGitHubEnv>>, path: string) {
	const url = `https://api.github.com/repos/${env.owner}/${env.repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(env.branch)}`;
	const res = await fetch(url, {
		headers: {
			Authorization: `Bearer ${env.token}`,
			Accept: "application/vnd.github+json",
			"User-Agent": "thoughtlite-admin-cms"
		}
	});
	if (res.status === 404) return { exists: false as const, sha: undefined };
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`GitHub GET contents failed: ${res.status} ${text}`);
	}
	const data = (await res.json()) as { sha?: string };
	return { exists: true as const, sha: data.sha };
}

async function githubPutFile(env: NonNullable<ReturnType<typeof getGitHubEnv>>, payload: SavePayload, sha?: string) {
	const url = `https://api.github.com/repos/${env.owner}/${env.repo}/contents/${encodeURIComponent(payload.path)}`;
	const body = {
		message: "feat(cms): update content via admin UI",
		content: Buffer.from(payload.content, "utf-8").toString("base64"),
		branch: env.branch,
		...(sha ? { sha } : {})
	};
	const res = await fetch(url, {
		method: "PUT",
		headers: {
			Authorization: `Bearer ${env.token}`,
			Accept: "application/vnd.github+json",
			"Content-Type": "application/json",
			"User-Agent": "thoughtlite-admin-cms"
		},
		body: JSON.stringify(body)
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`GitHub PUT contents failed: ${res.status} ${text}`);
	}

	return res.json();
}

export const POST: APIRoute = async ({ request }) => {
	try {
		const env = getGitHubEnv();
		if (!env) {
			return new Response(JSON.stringify({ success: false, message: "Missing GitHub environment variables." }), {
				status: 500,
				headers: { "content-type": "application/json; charset=utf-8" }
			});
		}

		const payload = (await request.json()) as Partial<SavePayload>;
		const path = String(payload.path ?? "").trim();
		const content = String(payload.content ?? "");

		if (!path || !content) {
			return new Response(JSON.stringify({ success: false, message: "path and content are required" }), {
				status: 400,
				headers: { "content-type": "application/json; charset=utf-8" }
			});
		}

		if (!isSafePath(path)) {
			return new Response(JSON.stringify({ success: false, message: "Invalid file path" }), {
				status: 400,
				headers: { "content-type": "application/json; charset=utf-8" }
			});
		}

		const file = await githubGetFileSha(env, path);
		const result = await githubPutFile(env, { path, content }, file.sha);

		return new Response(
			JSON.stringify({
				success: true,
				message: file.exists ? "File updated" : "File created",
				data: result
			}),
			{
				status: 200,
				headers: { "content-type": "application/json; charset=utf-8" }
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				success: false,
				message: error instanceof Error ? error.message : "Unknown save error"
			}),
			{
				status: 500,
				headers: { "content-type": "application/json; charset=utf-8" }
			}
		);
	}
};
