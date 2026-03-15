import { defineMiddleware } from "astro/middleware";
import { getAdminEnv, getSessionCookieName, verifySessionToken } from "$utils/admin-auth";

const LOGIN_PATH = "/admin/login";

export const onRequest = defineMiddleware(async (context, next) => {
	const pathname = context.url.pathname;
	const isAdminPage = pathname.startsWith("/admin");
	const isAdminApi = pathname.startsWith("/api/admin");
	const isPublicAdminRoute = pathname === LOGIN_PATH || pathname === "/api/admin/login";

	if (!isAdminPage && !isAdminApi) return next();
	if (isPublicAdminRoute) return next();

	const env = getAdminEnv();
	if (!env) {
		return new Response(JSON.stringify({ success: false, message: "Admin auth env missing." }), {
			status: 500,
			headers: { "content-type": "application/json; charset=utf-8" }
		});
	}

	const token = context.cookies.get(getSessionCookieName())?.value;
	const ok = token ? await verifySessionToken(token, env.password) : false;
	if (ok) return next();

	if (isAdminApi) {
		return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
			status: 401,
			headers: { "content-type": "application/json; charset=utf-8" }
		});
	}

	return context.redirect(LOGIN_PATH);
});
