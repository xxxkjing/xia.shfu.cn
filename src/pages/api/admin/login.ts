import type { APIRoute } from "astro";
import { createSessionToken, getAdminEnv, getSessionCookieName, getSessionMaxAge } from "$utils/admin-auth";

export const POST: APIRoute = async ({ request, cookies }) => {
	const env = getAdminEnv();
	if (!env) {
		return new Response(JSON.stringify({ success: false, message: "Missing ADMIN_USERNAME / ADMIN_PASSWORD" }), {
			status: 500,
			headers: { "content-type": "application/json; charset=utf-8" }
		});
	}

	const contentType = request.headers.get("content-type") ?? "";
	let username = "";
	let password = "";

	if (contentType.includes("application/json")) {
		const payload = await request.json().catch(() => ({}));
		username = String(payload.username ?? "");
		password = String(payload.password ?? "");
	} else {
		const form = await request.formData();
		username = String(form.get("username") ?? "");
		password = String(form.get("password") ?? "");
	}

	if (username !== env.username || password !== env.password) {
		return new Response(JSON.stringify({ success: false, message: "用户名或密码错误" }), {
			status: 401,
			headers: { "content-type": "application/json; charset=utf-8" }
		});
	}

	const token = await createSessionToken(username, env.password);
	cookies.set(getSessionCookieName(), token, {
		httpOnly: true,
		secure: !import.meta.env.DEV,
		sameSite: "strict",
		path: "/",
		maxAge: getSessionMaxAge()
	});

	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: { "content-type": "application/json; charset=utf-8" }
	});
};
