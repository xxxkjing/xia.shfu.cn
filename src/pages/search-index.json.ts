import type { APIRoute } from "astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { getCollection, render } from "astro:content";

interface SearchEntry {
	title: string;
	description?: string;
	url: string;
	type: "note" | "jotting";
	timestamp: string;
	tags?: string[];
	content: string;
}

/**
 * Strip HTML tags and collapse whitespace for indexing
 * @param html Raw HTML string from rendered Astro content
 * @returns Plain text suitable for full-text search
 */
function stripHtml(html: string): string {
	return html
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/&[a-z]+;|&#\d+;/gi, " ")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * GET endpoint that produces a static search index JSON file.
 * The file is generated at build time and shipped to `dist/search-index.json`,
 * allowing the client-side Search component to perform full-text search without
 * a backend. Only Chinese (zh-cn) notes and jottings are indexed, mirroring the
 * locale filter used elsewhere in the project.
 */
export const GET: APIRoute = async ({ site }) => {
	// Helper to load and project collection entries into SearchEntry records
	const project = async (type: "note" | "jotting", basePath: string) => {
		const collection = await getCollection(type, entry => {
			const published = !entry.data.draft;
			const localed = entry.id.split("/")[0] === "zh-cn";
			return published && localed;
		});

		// Render each entry through AstroContainer so we can extract plain text
		const container = await AstroContainer.create();
		return Promise.all(
			collection.map(async entry => {
				const id = entry.id.split("/").slice(1).join("/");
				const url = new URL(`/${basePath}/${id}`, site).toString();
				const rendered = await container.renderToString((await render(entry)).Content);
				return {
					title: entry.data.title,
					description: entry.data.description,
					url,
					type,
					timestamp: entry.data.timestamp.toISOString(),
					tags: entry.data.tags,
					content: stripHtml(rendered)
				} satisfies SearchEntry;
			})
		);
	};

	const entries = [...(await project("note", "note")), ...(await project("jotting", "jotting"))];

	return new Response(JSON.stringify(entries), {
		headers: {
			"Content-Type": "application/json; charset=utf-8"
		}
	});
};
