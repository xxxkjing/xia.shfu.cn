import { config, fields, collection } from "@keystatic/core";

export default config({
	storage: {
		kind: "github",
		repo: "tuyuritio/astro-theme-thought-lite"
	},
	collections: {
		jotting: collection({
			label: "Jotting",
			slugField: "title",
			path: "src/content/jotting/zh-cn/*",
			format: { contentField: "content" },
			schema: {
				title: fields.slug({ name: { label: "Title" } }),
				timestamp: fields.datetime({
					label: "Timestamp",
					defaultValue: new Date().toISOString()
				}),
				series: fields.text({ label: "Series" }),
				tags: fields.array(fields.text({ label: "Tag" }), {
					label: "Tags",
					itemLabel: props => props.value
				}),
				description: fields.text({ label: "Description" }),
				content: fields.document({
					label: "Content",
					formatting: true,
					dividers: true,
					links: true,
					images: true
				})
			}
		}),
		notes: collection({
			label: "Notes",
			slugField: "title",
			path: "src/content/note/zh-cn/*",
			format: { contentField: "content" },
			schema: {
				title: fields.slug({ name: { label: "Title" } }),
				timestamp: fields.datetime({
					label: "Timestamp",
					defaultValue: new Date().toISOString()
				}),
				tags: fields.array(fields.text({ label: "Tag" }), {
					label: "Tags",
					itemLabel: props => props.value
				}),
				description: fields.text({ label: "Description" }),
				content: fields.document({
					label: "Content",
					formatting: true,
					dividers: true,
					links: true,
					images: true
				})
			}
		}),
		preface: collection({
			label: "Preface",
			slugField: "timestamp",
			path: "src/content/preface/zh-cn/*",
			format: { contentField: "content" },
			schema: {
				timestamp: fields.slug({
					name: {
						label: "Timestamp"
					},
					slug: {
						generate: () => new Date().toISOString()
					}
				}),
				content: fields.document({
					label: "Content",
					formatting: true,
					dividers: true,
					links: true,
					images: true
				})
			}
		})
	}
});
