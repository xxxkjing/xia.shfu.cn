import crypto from "node:crypto";
import path from "node:path";
import type { APIRoute } from "astro";

export const prerender = false;

const imageExtByMime: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/webp": "webp",
	"image/gif": "gif",
	"image/avif": "avif",
	"image/svg+xml": "svg"
};

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

const getExtension = (file: File) => {
	const byMime = imageExtByMime[file.type];
	if (byMime) return byMime;
	const ext = path
		.extname(file.name || "")
		.replace(".", "")
		.toLowerCase();
	return ext || "png";
};

export const POST: APIRoute = async ({ request }) => {
	const env = getGithubEnv();
	if (!env) {
		return new Response(JSON.stringify({ ok: false, error: "GitHub 环境变量缺失" }), {
			status: 500,
			headers: { "content-type": "application/json" }
		});
	}

	const formData = await request.formData();
	const file = formData.get("file");
	if (!(file instanceof File)) {
		return new Response(JSON.stringify({ ok: false, error: "未找到上传文件" }), {
			status: 400,
			headers: { "content-type": "application/json" }
		});
	}

	if (!file.type.startsWith("image/")) {
		return new Response(JSON.stringify({ ok: false, error: "仅支持图片上传" }), {
			status: 400,
			headers: { "content-type": "application/json" }
		});
	}

	const ext = getExtension(file);
	const randomName = `${crypto.randomUUID().replaceAll("-", "")}.${ext}`;
	const uploadPath = `public/uploads/${randomName}`;

	const arrayBuffer = await file.arrayBuffer();
	const encodedContent = Buffer.from(arrayBuffer).toString("base64");

	const putResponse = await fetch(`https://api.github.com/repos/${env.owner}/${env.repo}/contents/${uploadPath}`, {
		method: "PUT",
		headers: {
			...githubHeaders(env.token),
			"content-type": "application/json"
		},
		body: JSON.stringify({
			message: "feat(cms): update content via admin UI",
			content: encodedContent,
			branch: env.branch
		})
	});

	if (!putResponse.ok) {
		const detail = await putResponse.text();
		return new Response(JSON.stringify({ ok: false, error: "上传失败", detail }), {
			status: 502,
			headers: { "content-type": "application/json" }
		});
	}

	const publicUrl = `/uploads/${randomName}`;
	const markdown = `![${randomName}](${publicUrl})`;

	return new Response(
		JSON.stringify({
			ok: true,
			name: randomName,
			path: uploadPath,
			url: publicUrl,
			markdown
		}),
		{ headers: { "content-type": "application/json" } }
	);
};
