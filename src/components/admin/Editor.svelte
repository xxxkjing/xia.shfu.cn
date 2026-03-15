<script lang="ts">
import { tick } from "svelte";
import { marked } from "marked";

type CollectionType = "note" | "jotting";
type EditorInitialData = {
	title: string;
	timestamp: string;
	tags: string[];
	description: string;
	sensitive: boolean;
	top: number;
	draft: boolean;
	series?: string;
	toc?: boolean;
	body: string;
	slug: string;
};

type MarkdownTool = {
	key: string;
	name: string;
	desc: string;
	snippet: string;
};

const markdownTools: MarkdownTool[] = [
	{ key: "h2", name: "标题", desc: "二级标题", snippet: "## 标题\n" },
	{ key: "link", name: "链接", desc: "插入超链接", snippet: "[链接文本](https://example.com)" },
	{ key: "img", name: "图片", desc: "插入图片", snippet: "![图片描述](/assets/image.webp)" },
	{ key: "code", name: "代码块", desc: "``` fenced code ```", snippet: "```ts\nconsole.log('Hello ThoughtLite')\n```" },
	{ key: "math", name: "数学公式", desc: "KaTeX 行内/块级", snippet: "$$\nE = mc^2\n$$" },
	{ key: "table", name: "表格", desc: "GFM 表格", snippet: "| 列1 | 列2 |\n| --- | --- |\n| 内容 | 内容 |" },
	{ key: "spoiler", name: "剧透块", desc: "remark-spoiler 指令", snippet: ":::spoiler 提示标题\n这里写隐藏内容\n:::" },
	{ key: "alert", name: "提示块", desc: "GitHub Alert 语法", snippet: "> [!NOTE]\n> 这里是提示内容" },
	{ key: "ruby", name: "注音", desc: "Ruby 指令", snippet: ":ruby[漢字]{rt=かんじ}" },
	{ key: "footnote", name: "脚注", desc: "Footnote 语法", snippet: "这是一个脚注示例[^1]\n\n[^1]: 这里是脚注内容" }
];

let {
	collectionType,
	initialData
}: {
	collectionType: CollectionType;
	initialData: EditorInitialData;
} = $props();

let title = $state(initialData.title || "");
let timestamp = $state(initialData.timestamp || new Date().toISOString().slice(0, 16));
let tagsInput = $state((initialData.tags || []).join(", "));
let description = $state(initialData.description || "");
let sensitive = $state(initialData.sensitive || false);
let top = $state(initialData.top || 0);
let draft = $state(initialData.draft || false);
let series = $state(initialData.series || "");
let toc = $state(initialData.toc || false);
let body = $state(initialData.body || "");
let slug = $state(initialData.slug || "");

let loading = $state(false);
let message = $state("");
let error = $state("");

let bodyTextarea: HTMLTextAreaElement | undefined;
let slashQuery = $state("");
let slashStart = $state<number | null>(null);
let activeToolIndex = $state(0);

const parsedTags = $derived(
	tagsInput
		.split(",")
		.map(tag => tag.trim())
		.filter(Boolean)
);
const previewHtml = $derived(String(marked.parse(body || "", { async: false })));

const filteredTools = $derived(
	markdownTools.filter(tool => `${tool.key} ${tool.name} ${tool.desc}`.toLowerCase().includes(slashQuery.toLowerCase()))
);
const slashVisible = $derived(slashStart !== null && filteredTools.length > 0);

const yamlEscape = (value: string) => value.replaceAll('"', '\\"');
const frontmatter = $derived.by(() => {
	const lines: string[] = [
		"---",
		`title: "${yamlEscape(title || "未命名文章")}"`,
		`timestamp: "${new Date(timestamp || Date.now()).toISOString()}"`
	];
	if (collectionType === "note" && series.trim()) lines.push(`series: "${yamlEscape(series.trim())}"`);
	if (parsedTags.length > 0) lines.push(`tags: [${parsedTags.map(tag => `"${yamlEscape(tag)}"`).join(", ")}]`);
	if (description.trim()) lines.push(`description: "${yamlEscape(description.trim())}"`);
	lines.push(`sensitive: ${sensitive ? "true" : "false"}`);
	if (collectionType === "note") lines.push(`toc: ${toc ? "true" : "false"}`);
	lines.push(`top: ${Number.isFinite(top) ? Math.max(0, Math.floor(top)) : 0}`);
	lines.push(`draft: ${draft ? "true" : "false"}`);
	lines.push("---");
	return lines.join("\n");
});

const fullMarkdown = $derived(`${frontmatter}\n\n${body}`.trim());
const filePath = $derived(`src/content/${collectionType}/zh-cn/${(slug || "untitled").trim()}.md`);

function resetSlashMenu() {
	slashStart = null;
	slashQuery = "";
	activeToolIndex = 0;
}

function updateSlashMenu() {
	if (!bodyTextarea) return;
	const cursor = bodyTextarea.selectionStart;
	const before = body.slice(0, cursor);
	const line = before.split("\n").pop() || "";
	const match = line.match(/(^|\s)\/(\w*)$/);
	if (!match) return resetSlashMenu();

	slashQuery = match[2] || "";
	slashStart = cursor - slashQuery.length - 1;
	activeToolIndex = 0;
}

async function insertTool(tool: MarkdownTool) {
	if (!bodyTextarea || slashStart === null) return;
	const cursor = bodyTextarea.selectionStart;
	body = `${body.slice(0, slashStart)}${tool.snippet}${body.slice(cursor)}`;
	resetSlashMenu();
	await tick();
	bodyTextarea.focus();
}

function handleBodyKeydown(event: KeyboardEvent) {
	if (!slashVisible) return;
	if (event.key === "ArrowDown") {
		event.preventDefault();
		activeToolIndex = (activeToolIndex + 1) % filteredTools.length;
	}
	if (event.key === "ArrowUp") {
		event.preventDefault();
		activeToolIndex = (activeToolIndex - 1 + filteredTools.length) % filteredTools.length;
	}
	if (event.key === "Enter") {
		event.preventDefault();
		insertTool(filteredTools[activeToolIndex]);
	}
	if (event.key === "Escape") {
		event.preventDefault();
		resetSlashMenu();
	}
}

async function saveContent() {
	error = "";
	message = "";
	if (!slug.trim()) {
		error = "请先填写文件名（slug）";
		return;
	}

	loading = true;
	try {
		const response = await fetch("/api/admin/save", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ path: filePath, content: fullMarkdown })
		});
		const result = await response.json().catch(() => ({ ok: false, error: "保存失败" }));
		if (!response.ok || !result.ok) {
			error = result.error || "保存失败";
			return;
		}
		message = `保存成功：${result.path}`;
	} catch {
		error = "网络错误，请稍后重试";
	} finally {
		loading = false;
	}
}
</script>

<div class="editor-shell">
	<section class="pane pane-editor">
		<header class="pane-head">
			<h2>编辑区</h2>
			<p>Frontmatter 可视化 + Markdown 正文（输入 / 可呼出工具）</p>
		</header>

		<div class="pane-body">
			<div class="grid gap-2">
				<label class="text-sm c-secondary" for="editor-type">文章类型</label>
				<input id="editor-type" value={collectionType} disabled class="input bg-block c-secondary" />
			</div>
			<div class="grid gap-2">
				<label class="text-sm c-secondary" for="editor-slug">文件名（slug）</label>
				<input id="editor-slug" bind:value={slug} placeholder="例如：2026-01-01-my-post" class="input" />
			</div>
			<div class="grid gap-2">
				<label class="text-sm c-secondary" for="editor-title">标题</label>
				<input id="editor-title" bind:value={title} class="input" />
			</div>
			<div class="grid gap-2">
				<label class="text-sm c-secondary" for="editor-timestamp">发布时间</label>
				<input id="editor-timestamp" bind:value={timestamp} type="datetime-local" class="input" />
			</div>
			{#if collectionType === "note"}
				<div class="grid gap-2">
					<label class="text-sm c-secondary" for="editor-series">系列（series）</label>
					<input id="editor-series" bind:value={series} class="input" />
				</div>
			{/if}
			<div class="grid gap-2">
				<label class="text-sm c-secondary" for="editor-tags">标签（逗号分隔）</label>
				<input id="editor-tags" bind:value={tagsInput} class="input" />
			</div>
			<div class="grid gap-2">
				<label class="text-sm c-secondary" for="editor-description">描述</label>
				<textarea id="editor-description" bind:value={description} rows="3" class="input"></textarea>
			</div>

			<div class="flex flex-wrap gap-3 text-sm">
				<label class="flex items-center gap-2"><input bind:checked={sensitive} type="checkbox" class="switch" /> 敏感</label>
				<label class="flex items-center gap-2"><input bind:checked={draft} type="checkbox" class="switch" /> 草稿</label>
				{#if collectionType === "note"}
					<label class="flex items-center gap-2"><input bind:checked={toc} type="checkbox" class="switch" /> 显示目录</label>
				{/if}
			</div>

			<div class="grid gap-2">
				<label class="text-sm c-secondary" for="editor-top">置顶权重（top）</label>
				<input id="editor-top" bind:value={top} type="number" min="0" class="input" />
			</div>
			<div class="grid gap-2 relative">
				<label class="text-sm c-secondary" for="editor-body">Markdown 正文</label>
				<textarea
					id="editor-body"
					bind:this={bodyTextarea}
					bind:value={body}
					oninput={updateSlashMenu}
					onclick={updateSlashMenu}
					onkeydown={handleBodyKeydown}
					rows="15"
					class="input font-mono"></textarea>
				<p class="text-xs c-remark">输入 <code>/</code> 呼出 Markdown 工具（标题、代码块、表格、剧透、数学公式等）</p>

				{#if slashVisible}
					<ul class="slash-menu">
						{#each filteredTools as tool, index}
							<li>
								<button
									type="button"
									class:active={index === activeToolIndex}
									onclick={() => insertTool(tool)}>
									<strong>/{tool.key} · {tool.name}</strong>
									<span>{tool.desc}</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<div class="action-row">
				<button onclick={saveContent} class="save-btn" disabled={loading}>{loading ? "保存中..." : "保存并发布"}</button>
				<span class="text-xs c-remark">{filePath}</span>
			</div>
			{#if message}<p class="text-sm c-green-6">{message}</p>{/if}
			{#if error}<p class="text-sm c-red-6">{error}</p>{/if}
		</div>
	</section>

	<section class="pane pane-preview">
		<header class="pane-head">
			<h2>实时预览</h2>
			<p>排版尽量贴合站点正文样式</p>
		</header>

		<div class="pane-body">
			<article class="preview markdown">
				<h1>{title || "未命名文章"}</h1>
				<hr class="b-b b-b-solid b-weak" />
				{@html previewHtml}
			</article>
		</div>
	</section>
</div>

<style lang="less">
	.editor-shell {
		display: grid;
		gap: 0.9rem;
		grid-template-columns: 1fr;
		height: calc(100vh - 8rem);

		@media (min-width: 1024px) {
			grid-template-columns: minmax(380px, 460px) minmax(0, 1fr);
		}
	}

	.pane {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--weak-color);
		border-radius: 0.55rem;
		overflow: hidden;
		background: color-mix(in oklab, var(--background-color) 92%, var(--block-color));
	}

	.pane-head {
		padding: 0.8rem 1rem;
		border-bottom: 1px solid var(--weak-color);
		background: var(--background-color);

		h2 {
			font-size: 1rem;
			font-weight: 700;
		}

		p {
			font-size: 0.8rem;
			color: var(--remark-color);
		}
	}

	.pane-body {
		padding: 0.85rem 1rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}

	.input {
		border: 1px solid var(--weak-color);
		border-radius: 0.35rem;
		padding: 0.45rem 0.55rem;
		background: transparent;
	}

	.slash-menu {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 2.2rem;
		z-index: 15;
		padding: 0.3rem;
		border: 1px solid var(--weak-color);
		border-radius: 0.45rem;
		background: var(--background-color);
		display: grid;
		gap: 0.2rem;
		max-height: 220px;
		overflow-y: auto;

		button {
			width: 100%;
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			padding: 0.35rem 0.45rem;
			border-radius: 0.35rem;

			span {
				font-size: 0.78rem;
				color: var(--remark-color);
			}

			&.active,
			&:hover {
				background: var(--block-color);
			}
		}
	}

	.action-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.55rem;
	}

	.save-btn {
		display: flex;
		justify-content: center;
		padding: 0.5rem 1rem;
		border-radius: 0.4rem;
		background: var(--primary-color);
		color: var(--background-color);
		font-weight: 700;
	}

	.preview {
		max-width: 800px;
	}
</style>
