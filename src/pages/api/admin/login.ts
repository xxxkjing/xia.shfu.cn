import type { APIRoute } from "astro";
import { ADMIN_COOKIE_NAME, createSessionToken, verifyCredentials } from "$utils/admin-auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const { username, password } = await request.json();
		if (!verifyCredentials(username, password)) {
			return new Response(JSON.stringify({ ok: false, error: "账号或密码错误" }), {
				status: 401,
				headers: { "content-type": "application/json" }
			});
		}

		const token = createSessionToken();
		if (!token) {
			return new Response(JSON.stringify({ ok: false, error: "服务端未配置管理员账号" }), {
				status: 500,
				headers: { "content-type": "application/json" }
			});
		}

		cookies.set(ADMIN_COOKIE_NAME, token, {
			httpOnly: true,
			secure: import.meta.env.PROD,
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60 * 24 * 7
		});

		return new Response(JSON.stringify({ ok: true }), {
			headers: { "content-type": "application/json" }
		});
	} catch {
		return new Response(JSON.stringify({ ok: false, error: "请求格式错误" }), {
			status: 400,
			headers: { "content-type": "application/json" }
		});
	}
};
