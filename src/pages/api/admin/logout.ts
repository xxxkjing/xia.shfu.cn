import type { APIRoute } from "astro";
import { ADMIN_COOKIE_NAME } from "$utils/admin-auth";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
	cookies.delete(ADMIN_COOKIE_NAME, { path: "/" });

	return new Response(JSON.stringify({ ok: true }), {
		headers: { "content-type": "application/json" }
	});
};
