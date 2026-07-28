/**
 * OG 图片自动生成工具
 *
 * 使用 Satori（JSX→SVG）+ @resvg/resvg-js（SVG→PNG）在服务端动态生成 Open Graph 图片。
 *
 * 设计风格：
 *   - 背景色 #fffffd（与网站 light theme 背景一致）
 *   - 字体 Noto Serif SC（与网站文章字体一致）
 *   - 简洁居中布局：左上角站点名 → 中央大标题 → 底部类型+日期
 */

import satori, { h } from "satori";
import { Resvg } from "@resvg/resvg-js";

// ── 设计常量 ──────────────────────────────────────

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

const COLORS = {
	background: "#fffffd",
	primary: "#2a2a28",
	secondary: "#757575",
	separator: "#e0e0e0"
};

const FONT_NAME = "Noto Serif SC";

/** Google Fonts CSS 端点，用于获取最新版字体文件 URL */
const GF_CSS_URL_BOLD = "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap";

// ── 字体加载（带缓存） ──────────────────────────────

const fontCache = new Map<string, ArrayBuffer>();

/**
 * 从 Google Fonts 动态获取 Noto Serif SC Bold 字体文件
 * 结果缓存在模块级 Map 中，冷启动后只请求一次
 */
async function loadFont(weight: 400 | 700 = 700): Promise<ArrayBuffer> {
	const cacheKey = `${FONT_NAME}:${weight}`;
	const cached = fontCache.get(cacheKey);
	if (cached) return cached;

	// 从 Google Fonts CSS 中解析出真实字体文件 URL
	const cssUrl = weight === 700 ? GF_CSS_URL_BOLD : "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400&display=swap";

	const cssResp = await fetch(cssUrl);
	if (!cssResp.ok) {
		throw new Error(`Failed to fetch Google Fonts CSS: ${cssResp.status}`);
	}

	const cssText = await cssResp.text();

	// 解析 CSS 中的 src: url(...) 获取字体文件地址
	const urlMatch = cssText.match(/src:\s*url\(([^)]+)\)/);
	if (!urlMatch) {
		throw new Error("Could not parse font URL from Google Fonts CSS");
	}

	const fontUrl = urlMatch[1];
	const fontResp = await fetch(fontUrl);
	if (!fontResp.ok) {
		throw new Error(`Failed to fetch font file: ${fontResp.status}`);
	}

	const buffer = await fontResp.arrayBuffer();
	fontCache.set(cacheKey, buffer);
	return buffer;
}

// ── 日期格式化 ─────────────────────────────────────

function formatDate(dateStr: string): string {
	if (!dateStr) return "";

	// 如果已经是 YYYY-MM-DD 格式，直接返回
	if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

	try {
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return dateStr;
		return date.toISOString().slice(0, 10);
	} catch {
		return dateStr;
	}
}

// ── 类型标签 ──────────────────────────────────────

function typeLabel(type: string): string {
	switch (type) {
		case "note":
			return "笔记";
		case "jotting":
			return "随笔";
		default:
			return type;
	}
}

// ── 纯色备用背景图（当字体加载失败时使用） ──────────

/**
 * 生成纯色背景的 SVG（无文字），作为字体加载失败时的 fallback
 */
function fallbackSVG(): string {
	return `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
		<rect width="100%" height="100%" fill="${COLORS.background}" />
	</svg>`;
}

// ── 主生成函数 ─────────────────────────────────────

export interface OGImageOptions {
	title: string;
	type?: "note" | "jotting" | string;
	date?: string;
}

/**
 * 生成 OG 图片（PNG 格式）
 *
 * @example
 * const png = await generateOGImage({ title: "我的文章", type: "note", date: "2025-07-28" });
 */
export async function generateOGImage(options: OGImageOptions): Promise<Uint8Array> {
	const { title, type = "note", date = "" } = options;

	// 1. 加载字体
	let boldFont: ArrayBuffer;
	try {
		boldFont = await loadFont(700);
	} catch (err) {
		console.error("[OG] Font loading failed, returning fallback:", err);
		// 字体加载失败时，生成一个包含基本文字的 SVG（使用后备字体）
		const fallbackSvg = `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
			<rect width="100%" height="100%" fill="${COLORS.background}" />
			<text x="600" y="315" text-anchor="middle" font-family="serif" font-size="48" fill="${COLORS.primary}">${escapeXml(title)}</text>
		</svg>`;
		const resvg = new Resvg(fallbackSvg, { fitTo: { mode: "width", value: OG_WIDTH } });
		return resvg.render().asPng();
	}

	// 2. 使用 Satori 渲染为 SVG
	const svg = await satori(
		h("div", { style: ogContainerStyle }, [
			// ── 顶栏：站点名 + 域名 ──
			h("div", { style: topBarStyle }, [h("span", { style: siteNameStyle }, "xkjing"), h("span", { style: domainStyle }, "xia.shfu.cn")]),

			// ── 弹性空间 ──
			h("div", { style: { flex: 1 } }),

			// ── 标题 ──
			h("div", { style: titleContainerStyle }, h("span", { style: titleStyle }, title)),

			// ── 弹性空间 ──
			h("div", { style: { flex: 1 } }),

			// ── 分隔线 ──
			h("div", { style: separatorStyle }),

			// ── 底部：类型 + 日期 ──
			h(
				"div",
				{ style: bottomBarStyle },
				[h("span", { style: metaStyle }, typeLabel(type)), date ? h("span", { style: metaStyle }, formatDate(date)) : null].filter(Boolean)
			)
		]),
		{
			width: OG_WIDTH,
			height: OG_HEIGHT,
			fonts: [
				{
					name: FONT_NAME,
					data: boldFont,
					weight: 700 as const,
					style: "normal" as const
				}
			]
		}
	);

	// 3. 使用 resvg 将 SVG 转为 PNG
	const resvg = new Resvg(svg, {
		fitTo: { mode: "width", value: OG_WIDTH },
		background: COLORS.background
	});

	return resvg.render().asPng();
}

// ── Satori 样式对象 ────────────────────────────────

const ogContainerStyle: Record<string, string | number> = {
	width: "100%",
	height: "100%",
	display: "flex",
	flexDirection: "column",
	backgroundColor: COLORS.background,
	padding: "60px 80px",
	fontFamily: FONT_NAME
};

const topBarStyle: Record<string, string | number> = {
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center"
};

const siteNameStyle: Record<string, string | number> = {
	fontSize: 22,
	color: COLORS.secondary,
	fontWeight: 700,
	letterSpacing: "0.02em"
};

const domainStyle: Record<string, string | number> = {
	fontSize: 16,
	color: "#9f9f9c",
	fontWeight: 400
};

const titleContainerStyle: Record<string, string | number> = {
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	padding: "0 20px"
};

const titleStyle: Record<string, string | number> = {
	fontSize: 56,
	fontWeight: 700,
	lineHeight: 1.35,
	color: COLORS.primary,
	textAlign: "center",
	wordBreak: "break-word",
	overflowWrap: "break-word",
	maxHeight: "3 * 1.35 * 56px" // 最多 3 行
};

const separatorStyle: Record<string, string | number> = {
	width: "60%",
	height: 0,
	borderTop: `1px solid ${COLORS.separator}`,
	margin: "0 auto 24px auto"
};

const bottomBarStyle: Record<string, string | number> = {
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	padding: "0 20px"
};

const metaStyle: Record<string, string | number> = {
	fontSize: 18,
	color: COLORS.secondary,
	fontWeight: 700
};

// ── 工具函数 ───────────────────────────────────────

/** XML 转义（用于 fallback SVG） */
function escapeXml(str: string): string {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
