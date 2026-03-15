import type { APIRoute } from "astro";
import { ADMIN_COOKIE_NAME } from "$utils/admin-auth";

export const POST: APIRoute = async ({ cookies, redirect }) => {
	cookies.delete(ADMIN_COOKIE_NAME, { path: "/" });
	return redirect("/admin/login");
};
