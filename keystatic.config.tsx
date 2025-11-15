import { collection, config, fields } from "@keystatic/core";

export default config({
	ui: {
		brand: {
			name: "MetaIllusion的博客"
		}
	},
	storage: {
		kind: "local"
	},
	collections: {
		note: collection({
			label: "笔记 (Notes)",
			slugField: "title",
			path: "src/content/note/zh-cn/**/*",
			format: { data: "yaml", contentField: "content" },
			schema: {
				title: fields.slug({
					name: {
						label: "标题",
						description: "文章标题"
					}
				}),
				content: fields.document({
					label: "内容",
					description: "文章内容",
					formatting: true,
					dividers: true,
					links: true,
					images: {
						directory: "src/content/note/zh-cn/images",
						publicPath: "/src/content/note/zh-cn/images/"
					}
				}),
				timestamp: fields.datetime({
					label: "发布时间",
					description: "文章发布日期和时间"
				}),
				series: fields.text({
					label: "系列",
					description: "文章所属系列名称"
				}),
				tags: fields.array(
					fields.text({
						label: "标签"
					}),
					{
						label: "标签列表",
						description: "文章标签",
						itemLabel: props => props.value
					}
				),
				description: fields.text({
					label: "描述",
					description: "文章简短描述/摘要",
					multiline: true
				}),
				sensitive: fields.checkbox({
					label: "敏感内容",
					description: "标记此内容是否为敏感内容"
				}),
				toc: fields.checkbox({
					label: "显示目录",
					description: "是否显示文章目录"
				}),
				top: fields.integer({
					label: "优先级",
					description: "文章排序优先级（数字越大优先级越高）",
					defaultValue: 0
				}),
				draft: fields.checkbox({
					label: "草稿",
					description: "是否为草稿（不显示在公开列表中）"
				})
			}
		}),

		jotting: collection({
			label: "随笔 (Jottings)",
			slugField: "title",
			path: "src/content/jotting/zh-cn/**/*",
			format: { data: "yaml", contentField: "content" },
			schema: {
				title: fields.slug({
					name: {
						label: "标题",
						description: "随笔标题"
					}
				}),
				content: fields.document({
					label: "内容",
					description: "随笔内容",
					formatting: true,
					dividers: true,
					links: true,
					images: {
						directory: "src/content/jotting/zh-cn/images",
						publicPath: "/src/content/jotting/zh-cn/images/"
					}
				}),
				timestamp: fields.datetime({
					label: "发布时间",
					description: "随笔发布日期和时间"
				}),
				tags: fields.array(
					fields.text({
						label: "标签"
					}),
					{
						label: "标签列表",
						description: "随笔标签",
						itemLabel: props => props.value
					}
				),
				description: fields.text({
					label: "描述",
					description: "随笔简短描述",
					multiline: true
				}),
				sensitive: fields.checkbox({
					label: "敏感内容",
					description: "标记此内容是否为敏感内容"
				}),
				top: fields.integer({
					label: "优先级",
					description: "随笔排序优先级（数字越大优先级越高）",
					defaultValue: 0
				}),
				draft: fields.checkbox({
					label: "草稿",
					description: "是否为草稿"
				})
			}
		}),

		preface: collection({
			label: "序言 (Preface)",
			slugField: "slug",
			path: "src/content/preface/zh-cn/**/*",
			format: { data: "yaml", contentField: "content" },
			schema: {
				slug: fields.slug({
					name: {
						label: "标识符",
						description: "序言的唯一标识符"
					}
				}),
				content: fields.document({
					label: "内容",
					description: "序言内容",
					formatting: true,
					dividers: true,
					links: true,
					images: {
						directory: "src/content/preface/zh-cn/images",
						publicPath: "/src/content/preface/zh-cn/images/"
					}
				}),
				timestamp: fields.datetime({
					label: "创建时间",
					description: "序言创建日期和时间"
				})
			}
		}),

		information: collection({
			label: "信息 (Information)",
			slugField: "slug",
			path: "src/content/information/zh-cn/**/*",
			format: { data: "yaml", contentField: "content" },
			schema: {
				slug: fields.slug({
					name: {
						label: "标识符",
						description: "信息页面的唯一标识符"
					}
				}),
				content: fields.document({
					label: "内容",
					description: "信息页面内容",
					formatting: true,
					dividers: true,
					links: true,
					images: {
						directory: "src/content/information/zh-cn/images",
						publicPath: "/src/content/information/zh-cn/images/"
					}
				}),
				title: fields.text({
					label: "页面标题",
					description: "信息页面的标题"
				})
			}
		})
	}
});
