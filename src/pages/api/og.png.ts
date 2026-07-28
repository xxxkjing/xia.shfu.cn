import type { APIRoute } from "astro";
import { generateOGImage } from "$utils/og";

/**
 * OG 图片生成 API
 *
 * 动态生成 Open Graph 图片（1200×630 PNG），用于社交媒体分享预览。
 *
 * 使用方法：
 *   <meta property="og:image" content="https://example.com/api/og.png?title=文章标题&type=note&date=2025-07-28" />
 *
 * @query title  - 文章标题（必填）
 * @query type   - 内容类型：note | jotting（默认 note）
 * @query date   - 日期字符串，YYYY-MM-DD 格式（可选）
 */
export const GET: APIRoute = async ({ url }) => {
	const title = url.searchParams.get("title");
	const type = url.searchParams.get("type") || "note";
	const date = url.searchParams.get("date") || "";

	// 参数校验
	if (!title) {
		return new Response("Missing required parameter: title", { status: 400 });
	}

	if (title.length > 200) {
		return new Response("Title too long (max 200 characters)", { status: 400 });
	}

	try {
		const png = await generateOGImage({ title, type, date });

		return new Response(png, {
			headers: {
				"Content-Type": "image/png",
				// 1 年强缓存——因为 URL 由内容参数构成，内容变化 URL 也会变
				"Cache-Control": "public, max-age=31536000, immutable",
				// 告知爬虫这是一张图片
				"Content-Disposition": 'inline; filename="og-image.png"'
			}
		});
	} catch (err) {
		console.error("[OG API] Failed to generate image:", err);

		// 降级：返回一个简单的纯色背景 SVG（爬虫通常也能识别）
		const fallbackSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
			<rect width="100%" height="100%" fill="#fffffd" />
		</svg>`;

		return new Response(fallbackSvg, {
			status: 200,
			headers: {
				"Content-Type": "image/svg+xml",
				"Cache-Control": "no-cache"
			}
		});
	}
};
