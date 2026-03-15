import type { APIRoute } from "astro";
import { ADMIN_COOKIE_NAME, createAdminToken } from "$utils/admin-auth";

export const POST: APIRoute = async ({ request, cookies }) => {
	const username = import.meta.env.ADMIN_USERNAME;
	const password = import.meta.env.ADMIN_PASSWORD;

	if (!username || !password) {
		return new Response(JSON.stringify({ ok: false, message: "Admin credentials are not configured" }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}

	let payload: { username?: string; password?: string };
	try {
		payload = await request.json();
	} catch {
		return new Response(JSON.stringify({ ok: false, message: "Invalid JSON body" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
	}

	if (payload.username !== username || payload.password !== password) {
		return new Response(JSON.stringify({ ok: false, message: "用户名或密码错误" }), {
			status: 401,
			headers: { "Content-Type": "application/json" }
		});
	}

	cookies.set(ADMIN_COOKIE_NAME, createAdminToken(username, password), {
		httpOnly: true,
		path: "/",
		secure: import.meta.env.PROD,
		sameSite: "lax",
		maxAge: 60 * 60 * 8
	});

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" }
	});
};
