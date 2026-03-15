import { defineMiddleware } from "astro:middleware";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "$utils/admin-auth";

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname } = context.url;
	if (!pathname.startsWith("/admin")) return next();
	if (pathname === "/admin/login") return next();

	const token = context.cookies.get(ADMIN_COOKIE_NAME)?.value;
	const runtimeEnv = (context.locals as { runtime?: { env?: Record<string, string | undefined> } }).runtime?.env;
	const valid = verifyAdminSession(token, runtimeEnv ?? process.env);
	if (valid) return next();

	return context.redirect("/admin/login");
});
