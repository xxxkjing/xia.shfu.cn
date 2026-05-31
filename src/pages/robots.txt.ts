import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
	const sitemap = new URL("sitemap-index.xml", site).toString();

	const text = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /cdn-cgi

Sitemap: ${sitemap}
`;

	return new Response(text, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8"
		}
	});
};
