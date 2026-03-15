import { defineMiddleware } from "astro:middleware";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "$utils/admin-auth";

const isProtectedPath = (pathname: string) => pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

const isPublicAdminPath = (pathname: string) => pathname === "/admin/login" || pathname === "/api/admin/login";

export const onRequest = defineMiddleware((context, next) => {
	const { pathname, search } = context.url;

	if (!isProtectedPath(pathname) || isPublicAdminPath(pathname)) {
		return next();
	}

	const token = context.cookies.get(ADMIN_COOKIE_NAME)?.value;
	if (verifySessionToken(token)) {
		return next();
	}

	if (pathname.startsWith("/api/admin")) {
		return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
			status: 401,
			headers: { "content-type": "application/json" }
		});
	}

	const redirectTo = new URL(`/admin/login?next=${encodeURIComponent(`${pathname}${search}`)}`, context.url);
	return context.redirect(redirectTo.toString());
});
