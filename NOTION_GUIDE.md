# Notion CMS 集成指南

本文档将指导您如何配置和使用 Notion 作为 Astro 博客的 CMS。

## 1. Notion 设置

### 1.1 创建 Notion 集成

1.  访问 [Notion 集成页面](https://www.notion.so/my-integrations)。
2.  点击 **"New integration"**。
3.  填写集成名称（例如 "Astro Blog"），并关联到您的工作区。
4.  提交后，您将获得一个 **Internal Integration Token**，即 `NOTION_API_KEY`。请妥善保管此密钥。

### 1.2 创建数据库

为了简化配置，我们提供了预设的数据库模板。请复制以下模板到您的 Notion 工作区：

-   [**Note Database Template**](https://www.notion.so/notion/note-database-template-55c961a939874c7b84f3a15b6b8f6e0b)
-   [**Jotting Database Template**](https://www.notion.so/notion/jotting-database-template-56f8c7b8a7c24a6a9b4d8d1e2e1c3e3a)

复制后，您将得到两个新的数据库页面。

### 1.3 关联集成到数据库

1.  打开您刚刚创建的 `note` 数据库页面。
2.  点击右上角的 **"..."** 图标，选择 **"Add connections"**。
3.  在列表中找到并选择您在步骤 1.1 中创建的集成。
4.  对 `jotting` 数据库重复以上步骤。

### 1.4 获取数据库 ID

1.  打开 `note` 数据库页面。
2.  在浏览器地址栏中，URL 格式为 `https://www.notion.so/YOUR_WORKSPACE/DATABASE_ID?v=...`。
3.  `DATABASE_ID` 是 `YOUR_WORKSPACE/` 之后、`?v=` 之前的一长串字符。
4.  复制此 ID，并对 `jotting` 数据库重复操作。

## 2. 项目配置

### 2.1 配置环境变量

1.  在项目根目录中，找到 `.env` 文件。
2.  将以下变量替换为您自己的值：
    -   `NOTION_API_KEY`: 替换为您的 Internal Integration Token。
    -   `NOTION_NOTE_DATABASE_ID`: 替换为您的 `note` 数据库 ID。
    -   `NOTION_JOTTING_DATABASE_ID`: 替换为您的 `jotting` 数据库 ID。

### 2.2 自定义 `notion.config.ts`

如果您需要修改数据库属性，请在 `notion.config.ts` 文件中进行相应调整。

-   **`name`**: 必须与 Notion 数据库的属性名称完全匹配。
-   **`type`**: 必须与 Notion 数据库的属性类型匹配。

确保 `propertyMap` 中的配置与您的 Notion 数据库结构一致。

## 3. 运行项目

完成以上配置后，您可以正常运行项目。内容将从 Notion 自动加载。

```bash
pnpm dev
```
