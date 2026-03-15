import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { APIRoute } from "astro";

function normalizePath(path: string) {
	return path.replace(/^\/+/, "");
}

function isAllowedPath(path: string) {
	return /^src\/content\/(note|jotting)\/[\w\-/]+\.md$/.test(path);
}

export const GET: APIRoute = async ({ url }) => {
	const rawPath = url.searchParams.get("path") || "";
	const path = normalizePath(rawPath);

	if (!path || !isAllowedPath(path)) {
		return new Response(JSON.stringify({ ok: false, message: "Invalid path" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
	}

	const filePath = resolve(process.cwd(), path);
	try {
		const content = await readFile(filePath, "utf-8");
		return new Response(JSON.stringify({ ok: true, content }), {
			status: 200,
			headers: { "Content-Type": "application/json" }
		});
	} catch {
		return new Response(JSON.stringify({ ok: false, message: "File not found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
	}
};
