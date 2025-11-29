import type { CollectionEntry } from "astro:content";
import config from "$config";

export interface SEOConfig {
	title: string;
	description: string;
	canonical?: string;
	noindex?: boolean;
	nofollow?: boolean;
	openGraph?: {
		basic: {
			title: string;
			type: "website" | "article";
			image: string;
			url: string;
		};
		optional?: {
			description?: string;
			locale?: string;
			siteName?: string;
		};
		article?: {
			publishedTime?: string;
			modifiedTime?: string;
			section?: string;
			tags?: string[];
			authors?: string[];
		};
	};
}

/**
 * 生成默认的 SEO 配置
 */
export function getDefaultSEO(site: URL, pathname: string): SEOConfig {
	return {
		title: config.title,
		description: config.description,
		canonical: new URL(pathname, site).toString(),
		openGraph: {
			basic: {
				title: config.title,
				type: "website",
				image: new URL("/favicon-96x96.png", site).toString(),
				url: new URL(pathname, site).toString()
			},
			optional: {
				description: config.description,
				locale: "zh_CN",
				siteName: config.title
			}
		}
	};
}

/**
 * 为首页生成 SEO 配置
 */
export function getHomeSEO(site: URL): SEOConfig {
	return {
		...getDefaultSEO(site, "/"),
		title: `${config.title} - ${config.prologue}`,
		description: config.description
	};
}

/**
 * 为文章页面生成 SEO 配置
 */
export function getArticleSEO(
	site: URL,
	pathname: string,
	article: CollectionEntry<"note"> | CollectionEntry<"jotting">
): SEOConfig {
	const fullTitle = `${article.data.title} | ${config.title}`;
	const description = article.data.description || config.description;
	const imageUrl = new URL("/favicon-96x96.png", site).toString();

	return {
		title: fullTitle,
		description,
		canonical: new URL(pathname, site).toString(),
		openGraph: {
			basic: {
				title: article.data.title,
				type: "article",
				image: imageUrl,
				url: new URL(pathname, site).toString()
			},
			optional: {
				description,
				locale: "zh_CN",
				siteName: config.title
			},
			article: {
				publishedTime: article.data.timestamp.toISOString(),
				section: article.data.series,
				tags: article.data.tags,
				authors: [config.author.name]
			}
		}
	};
}

/**
 * 为列表页面生成 SEO 配置
 */
export function getListSEO(site: URL, pathname: string, subtitle: string): SEOConfig {
	return {
		...getDefaultSEO(site, pathname),
		title: `${subtitle} | ${config.title}`,
		description: `${config.title}的${subtitle}列表`
	};
}

/**
 * 生成 JSON-LD 结构化数据 - 网站信息
 */
export function getWebSiteSchema(site: URL) {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: config.title,
		url: site.toString(),
		description: config.description,
		inLanguage: "zh-CN",
		author: {
			"@type": "Person",
			name: config.author.name,
			email: config.author.email,
			url: config.author.link
		}
	};
}

/**
 * 生成 JSON-LD 结构化数据 - 文章
 */
export function getArticleSchema(
	site: URL,
	pathname: string,
	article: CollectionEntry<"note"> | CollectionEntry<"jotting">
) {
	return {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: article.data.title,
		description: article.data.description || config.description,
		datePublished: article.data.timestamp.toISOString(),
		dateModified: article.data.updated?.toISOString() || article.data.timestamp.toISOString(),
		author: {
			"@type": "Person",
			name: config.author.name,
			email: config.author.email,
			url: config.author.link
		},
		publisher: {
			"@type": "Organization",
			name: config.title,
			logo: {
				"@type": "ImageObject",
				url: new URL("/favicon-96x96.png", site).toString()
			}
		},
		url: new URL(pathname, site).toString(),
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": new URL(pathname, site).toString()
		},
		...(article.data.tags && { keywords: article.data.tags.join(", ") }),
		...(article.data.series && { articleSection: article.data.series }),
		inLanguage: "zh-CN"
	};
}

/**
 * 生成面包屑导航 JSON-LD
 */
export function getBreadcrumbSchema(site: URL, items: { name: string; url: string }[]) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, index) => ({
			"@type": "ListItem",
			position: index + 1,
			name: item.name,
			item: new URL(item.url, site).toString()
		}))
	};
}