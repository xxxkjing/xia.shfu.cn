import type { APIRoute } from "astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { getCollection, render } from "astro:content";
import { Feed } from "feed";
import config from "$config";

/**
 * GET endpoint for generating feeds
 * Supports filtering by language, series, and tags
 */
export const GET: APIRoute = async ({ site }) => {
	// Initialize feed with site metadata and configuration
	const feed = new Feed({
		title: config.title,
		description: config.description,
		author: config.author,
		// Handle copyright based on license type - CC0 has special formatting
		copyright:
			config.copyright.type === "CC0 1.0"
				? "CC0 1.0 – No Rights Reserved"
				: `${config.copyright.type} © ${config.copyright.year} ${config.author.name}`,
		image: new URL("favicon-96x96.png", site).toString(), // Feed image/logo
		favicon: new URL("favicon.ico", site).toString(), // Feed favicon
		id: site!.toString(), // Unique feed identifier
		link: site!.toString() // Feed's associated website
	});

	// Aggregate items from specified sections
	let items = [];

	// Determine which sections to include
	const sections = config.feed?.section || "*";

	if (sections === "*" || sections.includes("note")) {
		const notes = await getCollection("note", note => {
			// Apply filtering criteria
			const published = !note.data.draft; // Exclude draft posts
			const localed = note.id.split("/")[0] === "zh-cn"; // Language filter

			// Include note only if it passes all filters
			return published && localed;
		});

		// Attach locale and link for each note
		notes.forEach(note => {
			const id = note.id.split("/").slice(1).join("/");
			Reflect.set(note, "link", new URL(`/note/${id}`, site).toString());
		});

		items.push(...notes);
	}

	if (sections === "*" || sections.includes("jotting")) {
		const jottings = await getCollection("jotting", jotting => {
			// Apply filtering criteria
			const published = !jotting.data.draft; // Exclude draft posts
			const localed = jotting.id.split("/")[0] === "zh-cn"; // Language filter

			// Include jotting only if it passes all filters
			return published && localed;
		});

		// Attach locale and link for each jotting
		jottings.forEach(jotting => {
			const id = jotting.id.split("/").slice(1).join("/");
			Reflect.set(jotting, "link", new URL(`/jotting/${id}`, site).toString());
		});

		items.push(...jottings);
	}

	// Sort all items by timestamp and limit to configured number
	items = items
		.sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime()) // Sort by newest first
		.slice(0, config.feed?.limit || items.length); // Limit to number of items

	// Create an Astro container for rendering content
	const container = await AstroContainer.create();
	await Promise.all(
		items.map(async item => {
			if (item.rendered) {
				// Render content for each item
				const content = await container.renderToString((await render(item)).Content);

				// Rewrite relative paths to absolute URLs for media assets
				item.rendered.html = content.replace(/(?<=src=")\/(?!\/)([^"]+)/g, `${site?.origin}/$1`);
			}
		})
	);

	// Add each filtered note as a feed item
	items.forEach(item => {
		feed.addItem({
			id: item.id, // Unique item identifier
			title: item.data.title, // Post title
			link: (<any>item).link, // URL to the post
			date: item.data.timestamp, // Publication date
			content: item.data.sensitive ? `本内容被标记为敏感，请<a href="${(<any>item).link}">点此查看</a>` : item.rendered?.html, // Rendered content
			description: item.data.description, // Summary of the post
			category: item.data.tags?.map((tag: any) => ({ term: tag })) // Tags as categories
		});
	});

	// Append stylesheet declaration to the feed
	const xml = feed.atom1().replace(/(<\?xml version="1\.0" encoding="utf-8".*\?>)/, '$1\n<?xml-stylesheet type="text/xsl" href="feed.xsl"?>');

	return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};
