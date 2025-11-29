# SEO 优化文档

## 概述

本项目已集成 `@astrojs/sitemap` 和 `astro-seo` 两个库,实现了完整的 SEO 优化方案。

## 已实施的优化

### 1. 核心 SEO 组件

#### 安装的依赖
- `@astrojs/sitemap` - 自动生成 XML sitemap
- `astro-seo` - 统一管理 SEO meta 标签

#### 核心文件
- [`src/utils/seo.ts`](../src/utils/seo.ts) - SEO 工具函数和类型定义
- [`src/layouts/App.astro`](../src/layouts/App.astro) - 集成 SEO 组件
- [`src/layouts/Base.astro`](../src/layouts/Base.astro) - 传递 SEO 配置

### 2. SEO 功能特性

#### A. Meta 标签管理
使用 `astro-seo` 的 `<SEO>` 组件统一管理:
- 页面标题和描述
- Open Graph 标签(用于社交媒体分享)
- Canonical URL(规范链接)
- robots 指令(noindex/nofollow)

#### B. Open Graph 配置
为所有页面配置了 Open Graph 标签:
- **基础信息**: title, type, image, url
- **可选信息**: description, locale(zh_CN), siteName
- **文章信息**: publishedTime, section, tags, authors

**图片设置**: 使用 `/favicon-96x96.png` 作为默认 OG 图片

#### C. JSON-LD 结构化数据

**网站信息** (首页):
```json
{
  "@type": "WebSite",
  "name": "站点名称",
  "url": "站点URL",
  "description": "站点描述",
  "inLanguage": "zh-CN",
  "author": {...}
}
```

**文章信息** (文章页):
```json
{
  "@type": "BlogPosting",
  "headline": "文章标题",
  "datePublished": "发布时间",
  "author": {...},
  "keywords": "标签",
  "articleSection": "分类"
}
```

**面包屑导航** (文章页):
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [...]
}
```

### 3. 页面级 SEO 优化

#### 首页 ([`src/pages/index.astro`](../src/pages/index.astro))
- 使用 `getHomeSEO()` 生成 SEO 配置
- 包含网站级 JSON-LD 结构化数据
- 标题格式: `站点名称 - Prologue`

#### 笔记列表页 ([`src/pages/note/index.astro`](../src/pages/note/index.astro))
- 使用 `getListSEO()` 生成列表页 SEO
- 标题格式: `笔记 | 站点名称`
- 描述: `站点名称的笔记列表`

#### 笔记详情页 ([`src/pages/note/[...id].astro`](../src/pages/note/[...id].astro))
- 使用 `getArticleSEO()` 生成文章 SEO
- 包含文章 JSON-LD 和面包屑 JSON-LD
- 标题格式: `文章标题 | 站点名称`
- 使用文章描述或默认站点描述

#### 随笔列表页 ([`src/pages/jotting/index.astro`](../src/pages/jotting/index.astro))
- 使用 `getListSEO()` 生成列表页 SEO
- 标题格式: `随笔 | 站点名称`
- 描述: `站点名称的随笔列表`

#### 随笔详情页 ([`src/pages/jotting/[...id].astro`](../src/pages/jotting/[...id].astro))
- 使用 `getArticleSEO()` 生成文章 SEO
- 包含文章 JSON-LD 和面包屑 JSON-LD
- 标题格式: `文章标题 | 站点名称`

### 4. Sitemap 配置

配置位置: [`astro.config.ts`](../astro.config.ts#L113)

```typescript
integrations: [
  sitemap(),
  // ...
]
```

**特性**:
- 自动生成 `sitemap-index.xml`
- 包含所有公开页面
- 自动排除 404 和 500 页面
- 在 [`robots.txt`](../src/pages/robots.txt.ts) 中引用

### 5. Robots.txt 配置

配置位置: [`src/pages/robots.txt.ts`](../src/pages/robots.txt.ts)

**当前策略**:
- 允许的爬虫: Googlebot, Bingbot, DuckDuckBot, archive.org_bot
- 禁止目录: `/cdn-cgi`
- 其他爬虫: 完全禁止
- Sitemap 引用: `/sitemap-index.xml`

## SEO 工具函数

### 可用函数

#### `getDefaultSEO(site, pathname)`
生成默认 SEO 配置,适用于简单页面。

#### `getHomeSEO(site)`
为首页生成专门的 SEO 配置。

#### `getArticleSEO(site, pathname, article)`
为文章页面生成 SEO 配置,包含完整的 Open Graph article 信息。

#### `getListSEO(site, pathname, subtitle)`
为列表页面生成 SEO 配置。

#### `getWebSiteSchema(site)`
生成网站级 JSON-LD 结构化数据。

#### `getArticleSchema(site, pathname, article)`
生成文章 JSON-LD 结构化数据。

#### `getBreadcrumbSchema(site, items)`
生成面包屑导航 JSON-LD 结构化数据。

## 使用示例

### 在新页面中使用 SEO

```astro
---
import Base from "$layouts/Base.astro";
import { getDefaultSEO } from "$utils/seo";

// 生成 SEO 配置
const seoConfig = getDefaultSEO(Astro.site!, Astro.url.pathname);

// 或自定义配置
const customSEO = {
  title: "自定义标题",
  description: "自定义描述",
  canonical: new URL(Astro.url.pathname, Astro.site).toString(),
  openGraph: {
    basic: {
      title: "自定义标题",
      type: "website",
      image: new URL("/custom-image.png", Astro.site).toString(),
      url: new URL(Astro.url.pathname, Astro.site).toString()
    }
  }
};
---

<Base title="页面标题" seoConfig={seoConfig}>
  <!-- 页面内容 -->
</Base>
```

### 添加 JSON-LD 结构化数据

```astro
---
import { getWebSiteSchema } from "$utils/seo";

const websiteSchema = getWebSiteSchema(Astro.site!);
---

<Base title="页面标题">
  <script type="application/ld+json" set:html={JSON.stringify(websiteSchema)} />
  <!-- 页面内容 -->
</Base>
```

## 语言支持

- 默认语言: 简体中文 (zh-CN)
- Open Graph locale: zh_CN
- HTML lang 属性: zh-cn
- JSON-LD inLanguage: zh-CN

## 注意事项

1. **不包含 Twitter Card**: 根据项目需求,未配置 Twitter Card 相关标签

2. **图片优化**: 当前使用 favicon 作为 OG 图片,建议后续:
   - 为首页准备专门的 OG 图片 (推荐 1200x630px)
   - 为文章页支持自定义特色图片

3. **Sitemap**: 使用默认配置,自动包含所有公开页面

4. **Robots.txt**: 当前限制了爬虫访问,如需更开放的策略可修改配置

## 验证和测试

### 推荐的 SEO 检查工具

1. **Google Search Console** - 检查 sitemap 和索引状态
2. **Facebook Sharing Debugger** - 验证 Open Graph 标签
3. **Google Rich Results Test** - 验证结构化数据
4. **Lighthouse** - 综合 SEO 评分

### 本地测试

```bash
# 构建项目
pnpm build

# 预览构建结果
pnpm preview

# 检查生成的 sitemap
访问: http://localhost:4321/sitemap-index.xml

# 检查 robots.txt
访问: http://localhost:4321/robots.txt
```

## 后续优化建议

1. **自定义 OG 图片**: 为首页和重要页面添加专门的社交媒体分享图片

2. **图片 SEO**: 为 markdown 中的图片添加 alt 属性

3. **性能优化**: 
   - 图片懒加载
   - 关键 CSS 内联
   - 字体优化

4. **更多结构化数据**:
   - FAQ schema (如有问答内容)
   - HowTo schema (如有教程内容)

5. **多语言支持**: 如需支持其他语言,可扩展 SEO 工具函数

## 相关资源

- [Astro SEO 文档](https://github.com/jonasmerlin/astro-seo)
- [Astro Sitemap 文档](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [Schema.org 文档](https://schema.org/)
- [Open Graph 协议](https://ogp.me/)
- [Google Search Central](https://developers.google.com/search)