<script lang="ts">
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

const parsedTags = $derived(
	tagsInput
		.split(",")
		.map(tag => tag.trim())
		.filter(Boolean)
);

const previewHtml = $derived(String(marked.parse(body || "", { async: false })));

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
			<p>Frontmatter 可视化 + Markdown 正文</p>
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
			<div class="grid gap-2">
				<label class="text-sm c-secondary" for="editor-body">Markdown 正文</label>
				<textarea id="editor-body" bind:value={body} rows="15" class="input font-mono"></textarea>
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
