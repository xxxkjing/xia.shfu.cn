# Keystatic CMS 集成指南

本项目已集成 **Keystatic**，一个现代的无头 CMS（Headless CMS）系统，提供可视化的内容管理界面。

## 什么是 Keystatic？

Keystatic 是一个开源的无头 CMS，专门为 Git 驱动的工作流程设计。它允许你：

- 通过直观的网页界面编辑内容
- 将所有内容存储在 Git 仓库中
- 支持 Markdown 和结构化数据
- 与现有的静态网站生成器无缝集成

官方文档：https://keystatic.com/docs/

## 快速开始

### 1. 启动开发服务器

使用以下命令启动 Keystatic CMS 界面：

```bash
pnpm cms
```

或者使用标准开发命令后，访问 `http://localhost:3000/keystatic`：

```bash
pnpm dev
```

### 2. 访问 CMS 界面

打开浏览器，访问：
- **开发环境**: http://localhost:3000/keystatic
- **本地 CMS 编辑**: 在 `/keystatic` 页面编辑内容

### 3. 编辑内容

CMS 提供了四个主要内容集合的管理界面：

#### 笔记 (Notes)
- **路径**: `src/content/note/zh-cn/`
- **用途**: 长篇文章、深度分析、研究文章
- **字段**:
  - 标题 (必填)
  - 发布时间 (必填)
  - 内容 (必填)
  - 系列 (可选)
  - 标签 (可选)
  - 描述 (可选)
  - 敏感内容 (复选框)
  - 显示目录 (复选框)
  - 优先级 (数字，用于排序)
  - 草稿 (复选框)

#### 随笔 (Jottings)
- **路径**: `src/content/jotting/zh-cn/`
- **用途**: 短文章、随想、日常笔记
- **字段**:
  - 标题 (必填)
  - 发布时间 (必填)
  - 内容 (必填)
  - 标签 (可选)
  - 描述 (可选)
  - 敏感内容 (复选框)
  - 优先级 (数字)
  - 草稿 (复选框)

#### 序言 (Preface)
- **路径**: `src/content/preface/zh-cn/`
- **用途**: 首页公告、更新说明
- **字段**:
  - 标识符 (必填，自动生成)
  - 创建时间 (必填)
  - 内容 (必填)

#### 信息 (Information)
- **路径**: `src/content/information/zh-cn/`
- **用途**: 静态页面、关于页面、政策
- **字段**:
  - 标识符 (必填)
  - 页面标题 (必填)
  - 内容 (必填)

## 文件格式

Keystatic 为所有集合使用 **YAML frontmatter + Markdown 内容** 的格式：

```yaml
---
title: 文章标题
timestamp: 2025-01-15 10:30:00+08:00
tags: [标签1, 标签2]
description: 文章简短描述
series: 系列名称
toc: true
draft: false
---

# 你的 Markdown 内容
文章正文...
```

## 图片管理

在 CMS 编辑器中上传的图片会自动保存到对应的集合目录：

- 笔记图片: `src/content/note/zh-cn/images/`
- 随笔图片: `src/content/jotting/zh-cn/images/`
- 序言图片: `src/content/preface/zh-cn/images/`
- 信息图片: `src/content/information/zh-cn/images/`

在 Markdown 中引用图片：

```markdown
![图片描述](./images/photo.png)
```

## 工作流程

### 编辑新内容

1. 启动 CMS: `pnpm cms`
2. 选择对应的集合
3. 点击 "新建" 创建新条目
4. 填写字段和内容
5. 点击 "保存" 提交更改
6. 更改自动保存到 Git 仓库

### 发布内容

- 设置 `draft: false` 来发布内容
- 设置 `draft: true` 来保存为草稿
- 通过 CMS 界面直接更新 `timestamp` 来控制发布日期

### 使用现有 Markdown 文件

CMS 会自动识别和管理现有的 Markdown 文件。你可以：
- 在 CMS 中编辑它们
- 直接编辑 Markdown 文件（Git 同步）
- 两者混合使用

## Astro Content Collections 配置

项目中的 `src/content/config.ts` 定义了所有集合的验证规则。Keystatic 与 Astro 的 Content Collections 完全兼容，确保数据一致性。

## 常见问题

### Q: 如何删除内容？
A: 在 CMS 界面中，选择要删除的条目，点击删除按钮。该条目的 Markdown 文件会从仓库中移除。

### Q: 能否在多个地方编辑？
A: 可以。你可以同时在 CMS 界面和直接编辑 Markdown 文件。所有更改都会通过 Git 同步。

### Q: 如何恢复删除的内容？
A: 由于所有内容都在 Git 中，你可以使用 Git 历史恢复已删除的文件。

### Q: 如何添加新的内容集合？
A: 编辑 `keystatic.config.ts` 和 `src/content/config.ts` 来添加新的集合定义。

### Q: 图片存储在哪里？
A: 图片存储在每个集合对应的 `images/` 目录中，与内容一起版本控制。

## 环境变量

Keystatic 使用本地存储（local storage），所有文件直接保存到磁盘。在生产环境中，你可以配置其他存储后端。

## 构建和部署

构建过程自动包含 Keystatic：

```bash
pnpm build
```

CMS 界面只在开发环境中可用。生产构建包含所有静态内容。

## 更多信息

- [Keystatic 官方文档](https://keystatic.com/docs/)
- [Keystatic GitHub](https://github.com/Thinkmill/keystatic)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
