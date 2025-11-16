import type { NotionLoader } from "notion-astro-loader";

const notionLoader = new NotionLoader({
	apiKey: process.env.NOTION_API_KEY,
	databases: [
		{
			id: process.env.NOTION_NOTE_DATABASE_ID,
			name: "note",
			propertyMap: {
				title: { name: "title", type: "title" },
				timestamp: { name: "timestamp", type: "date" },
				tags: { name: "tags", type: "multi_select" },
				description: { name: "description", type: "rich_text" },
				series: { name: "series", type: "select" },
				draft: { name: "draft", type: "checkbox" },
				sensitive: { name: "sensitive", type: "checkbox" },
				toc: { name: "toc", type: "checkbox" },
				top: { name: "top", type: "checkbox" }
			}
		},
		{
			id: process.env.NOTION_JOTTING_DATABASE_ID,
			name: "jotting",
			propertyMap: {
				title: { name: "title", type: "title" },
				timestamp: { name: "timestamp", type: "date" },
				tags: { name: "tags", type: "multi_select" },
				description: { name: "description", type: "rich_text" },
				draft: { name: "draft", type: "checkbox" },
				sensitive: { name: "sensitive", type: "checkbox" },
				top: { name: "top", type: "checkbox" }
			}
		}
	]
});

export default notionLoader;
