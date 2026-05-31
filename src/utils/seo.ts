import type { CollectionEntry } from "astro:content";
import config from "$config";

const siteImagePath = "/favicon-96x96.png";

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

function canonicalUrl(site: URL, pathname: string) {
	const url = new URL(pathname, site);
	url.hash = "";
	url.search = "";
	return url.toString();
}

function siteImage(site: URL) {
	return new URL(siteImagePath, site).toString();
}

function articleDescription(article: CollectionEntry<"note"> | CollectionEntry<"jotting">) {
	if (article.data.description) return article.data.description;
	const parts = [article.data.series, article.data.tags?.join("、")].filter(Boolean);
	return parts.length ? `${article.data.title}，${parts.join("，")}。${config.description}` : `${article.data.title}。${config.description}`;
}

/**
 * 生成默认的 SEO 配置
 */
export function getDefaultSEO(site: URL, pathname: string): SEOConfig {
	const url = canonicalUrl(site, pathname);
	const image = siteImage(site);

	return {
		title: config.title,
		description: config.description,
		canonical: url,
		openGraph: {
			basic: {
				title: config.title,
				type: "website",
				image,
				url
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
	const url = canonicalUrl(site, "/");
	const image = siteImage(site);
	const title = `${config.title} - ${config.prologue}`;

	return {
		title,
		description: config.description,
		canonical: url,
		openGraph: {
			basic: {
				title,
				type: "website",
				image,
				url
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
 * 为文章页面生成 SEO 配置
 */
export function getArticleSEO(
	site: URL,
	pathname: string,
	article: CollectionEntry<"note"> | CollectionEntry<"jotting">
): SEOConfig {
	const fullTitle = `${article.data.title} | ${config.title}`;
	const description = articleDescription(article);
	const url = canonicalUrl(site, pathname);
	const image = siteImage(site);

	return {
		title: fullTitle,
		description,
		canonical: url,
		openGraph: {
			basic: {
				title: article.data.title,
				type: "article",
				image,
				url
			},
			optional: {
				description,
				locale: "zh_CN",
				siteName: config.title
			},
			article: {
				publishedTime: article.data.timestamp.toISOString(),
				modifiedTime: article.data.timestamp.toISOString(),
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
export function getListSEO(site: URL, pathname: string, subtitle: string, description?: string): SEOConfig {
	const url = canonicalUrl(site, pathname);
	const image = siteImage(site);
	const title = `${subtitle} | ${config.title}`;
	const pageDescription = description || `${config.title} 的${subtitle}列表，收录${config.author.name}发布的${subtitle}内容。`;

	return {
		title,
		description: pageDescription,
		canonical: url,
		openGraph: {
			basic: {
				title,
				type: "website",
				image,
				url
			},
			optional: {
				description: pageDescription,
				locale: "zh_CN",
				siteName: config.title
			}
		}
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
		alternateName: config.prologue,
		url: site.toString(),
		description: config.description,
		inLanguage: "zh-CN",
		author: {
			"@type": "Person",
			name: config.author.name,
			email: config.author.email,
			url: config.author.link
		},
		publisher: {
			"@type": "Person",
			name: config.author.name,
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
	const url = canonicalUrl(site, pathname);
	const image = siteImage(site);

	return {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: article.data.title,
		description: articleDescription(article),
		image,
		datePublished: article.data.timestamp.toISOString(),
		dateModified: article.data.timestamp.toISOString(),
		author: {
			"@type": "Person",
			name: config.author.name,
			email: config.author.email,
			url: config.author.link
		},
		publisher: {
			"@type": "Person",
			name: config.author.name,
			url: config.author.link
		},
		url,
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": url
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
			item: canonicalUrl(site, item.url)
		}))
	};
}
