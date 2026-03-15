import { defineMiddleware } from "astro:middleware";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "$utils/admin-auth";

const LOGIN_PATH = "/admin/login";

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;
	const needsAuth = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
	const isLoginRoute = pathname === LOGIN_PATH || pathname === "/api/admin/login";

	if (!needsAuth || isLoginRoute) return next();

	const username = import.meta.env.ADMIN_USERNAME;
	const password = import.meta.env.ADMIN_PASSWORD;
	const token = context.cookies.get(ADMIN_COOKIE_NAME)?.value;

	if (!username || !password || !token || !verifyAdminToken(token, username, password)) {
		if (pathname.startsWith("/api/admin")) {
			return new Response(JSON.stringify({ ok: false, message: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" }
			});
		}

		return context.redirect(LOGIN_PATH);
	}

	return next();
});
