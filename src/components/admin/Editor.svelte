<script lang="ts">
import { marked } from "marked";

type CollectionType = "note" | "jotting";
type Metadata = {
	title: string;
	timestamp: string;
	tags: string[];
	description: string;
	draft: boolean;
	top: number;
	sensitive: boolean;
	series?: string;
	toc?: boolean;
};

let {
	collection,
	initialPath,
	initialBody = "",
	initialMetadata
}: {
	collection: CollectionType;
	initialPath: string;
	initialBody?: string;
	initialMetadata: Metadata;
} = $props();

let meta = $state<Metadata>(initialMetadata);
let path = $state(initialPath);
let body = $state(initialBody);
let saving = $state(false);
let message = $state("");
let htmlPreview = $state("");
let timer: ReturnType<typeof setTimeout> | undefined;

const formatTags = (tags: string[]) => `[${tags.map(tag => `"${tag}"`).join(", ")}]`;

const buildFrontmatter = () => {
	const rows = [
		`title: "${meta.title.replaceAll('"', '\\"')}"`,
		`timestamp: "${meta.timestamp}"`,
		`tags: ${formatTags(meta.tags)}`,
		`description: "${meta.description.replaceAll('"', '\\"')}"`,
		`sensitive: ${meta.sensitive}`,
		`top: ${Math.max(0, Number(meta.top) || 0)}`,
		`draft: ${meta.draft}`
	];
	if (collection === "note") {
		rows.splice(2, 0, `series: "${(meta.series ?? "").replaceAll('"', '\\"')}"`);
		rows.splice(6, 0, `toc: ${Boolean(meta.toc)}`);
	}
	return `---\n${rows.join("\n")}\n---\n\n`;
};

const updatePreview = () => {
	const frontmatter = buildFrontmatter();
	htmlPreview = marked.parse(`${frontmatter}${body}`) as string;
};

$effect(() => {
	clearTimeout(timer);
	timer = setTimeout(updatePreview, 120);
	return () => clearTimeout(timer);
});

function onTagChange(value: string) {
	meta.tags = value
		.split(",")
		.map(item => item.trim())
		.filter(Boolean);
}

async function save() {
	saving = true;
	message = "正在保存...";
	try {
		const content = `${buildFrontmatter()}${body}`;
		const response = await fetch("/api/admin/save", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ path, content })
		});
		const result = await response.json();
		if (!response.ok || !result.success) {
			throw new Error(result.message ?? "保存失败");
		}
		message = "保存成功，已提交到 GitHub。";
	} catch (error) {
		message = error instanceof Error ? error.message : "未知错误";
	} finally {
		saving = false;
	}
}
</script>

<div class="admin-editor">
	<section class="panel form-panel">
		<h2>元数据</h2>
		<div class="grid-form">
			<label><span>标题</span><input bind:value={meta.title} /></label>
			<label><span>发布时间</span><input type="datetime-local" bind:value={meta.timestamp} /></label>
			<label><span>标签（英文逗号分隔）</span><input value={meta.tags.join(", ")} oninput={e => onTagChange((e.target as HTMLInputElement).value)} /></label>
			<label><span>描述</span><textarea rows="2" bind:value={meta.description}></textarea></label>
			{#if collection === "note"}
				<label><span>系列</span><input bind:value={meta.series} /></label>
				<label class="switch"><input type="checkbox" bind:checked={meta.toc} />显示目录（toc）</label>
			{/if}
			<label><span>置顶权重（top）</span><input type="number" min="0" bind:value={meta.top} /></label>
			<label class="switch"><input type="checkbox" bind:checked={meta.draft} />草稿（draft）</label>
			<label class="switch"><input type="checkbox" bind:checked={meta.sensitive} />敏感内容（sensitive）</label>
			<label><span>文件路径</span><input bind:value={path} /></label>
		</div>
		<h2>Markdown 正文</h2>
		<textarea class="editor" bind:value={body} placeholder="在这里输入正文..."></textarea>
		<button disabled={saving} onclick={save}>{saving ? "保存中..." : "保存并发布"}</button>
		<p class="message">{message}</p>
	</section>

	<section class="panel preview-panel">
		<h2>实时预览（发布样式）</h2>
		<article class="markdown" class:empty={!htmlPreview}>
			{@html htmlPreview}
		</article>
	</section>
</div>

<style lang="less">
	.admin-editor {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		@media (min-width: 1100px) {
			grid-template-columns: 1fr 1fr;
		}
	}
	.panel {
		border: 1px solid var(--weak-color);
		border-radius: 0.5rem;
		padding: 1rem;
		background: var(--background-color);
	}
	.form-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.preview-panel {
		position: sticky;
		top: 1rem;
		height: fit-content;
		max-height: calc(100vh - 2rem);
		overflow: auto;
	}
	.grid-form {
		display: grid;
		gap: 0.6rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	label.switch {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
	}
	input,
	textarea {
		border: 1px solid var(--weak-color);
		background: var(--background-color);
		padding: 0.45rem 0.6rem;
		border-radius: 0.35rem;
	}
	textarea.editor {
		min-height: 45vh;
		font-family: var(--font-monospace);
	}
	button {
		justify-content: center;
		border: 1px solid var(--primary-color);
		padding: 0.5rem 0.8rem;
		border-radius: 0.35rem;
	}
	button:hover:not(:disabled) {
		color: var(--background-color);
		background: var(--primary-color);
	}
	.message {
		font-size: 0.9rem;
		color: var(--secondary-color);
	}
	.markdown.empty {
		opacity: 0.65;
	}
</style>
