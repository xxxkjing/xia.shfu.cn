import type { APIRoute } from "astro";
import { getSessionCookieName } from "$utils/admin-auth";

export const POST: APIRoute = async ({ cookies }) => {
	cookies.delete(getSessionCookieName(), { path: "/" });
	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: { "content-type": "application/json; charset=utf-8" }
	});
};
