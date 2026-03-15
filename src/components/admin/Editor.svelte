<script lang="ts">
import { marked } from "marked";
import { stringify as toYAML } from "yaml";

type CollectionType = "note" | "jotting";

interface EditorMeta {
	title: string;
	timestamp: string;
	tags: string[];
	description: string;
	draft: boolean;
	sensitive: boolean;
	top: number;
	series?: string;
	toc?: boolean;
}

let {
	collectionType,
	entryId = "",
	initialPath,
	initialBody = "",
	initialMeta
}: {
	collectionType: CollectionType;
	entryId?: string;
	initialPath: string;
	initialBody?: string;
	initialMeta: Partial<EditorMeta>;
} = $props();

const toDatetimeLocal = (value?: string) => {
	if (!value) return new Date().toISOString().slice(0, 16);
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 16);
	return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

let filePath = $state(initialPath);
let title = $state(initialMeta.title || "");
let timestamp = $state(toDatetimeLocal(initialMeta.timestamp));
let tagsText = $state((initialMeta.tags || []).join(", "));
let description = $state(initialMeta.description || "");
let draft = $state(Boolean(initialMeta.draft));
let sensitive = $state(Boolean(initialMeta.sensitive));
let top = $state(Number(initialMeta.top ?? 0));
let series = $state(initialMeta.series || "");
let toc = $state(Boolean(initialMeta.toc));
let body = $state(initialBody);

let previewHtml = $state("");
let loading = $state(false);
let message = $state("");
let error = $state("");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const parseTags = () =>
	tagsText
		.split(",")
		.map(tag => tag.trim())
		.filter(Boolean);

const frontmatterObject = $derived.by(() => {
	const result: Record<string, unknown> = {
		title,
		timestamp: new Date(timestamp).toISOString(),
		tags: parseTags().length > 0 ? parseTags() : undefined,
		description: description || undefined,
		sensitive,
		top: Number.isFinite(top) ? top : 0,
		draft
	};

	if (collectionType === "note") {
		result.series = series || undefined;
		result.toc = toc;
	}

	Object.keys(result).forEach(key => {
		if (result[key] === undefined) delete result[key];
	});
	return result;
});

const markdownWithFrontmatter = $derived.by(() => `---\n${toYAML(frontmatterObject).trim()}\n---\n\n${body}`);

$effect(() => {
	const source = body;
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(async () => {
		previewHtml = await marked.parse(source, { breaks: true, gfm: true });
	}, 150);
	return () => {
		if (debounceTimer) clearTimeout(debounceTimer);
	};
});

async function save() {
	error = "";
	message = "";
	loading = true;

	try {
		const response = await fetch("/api/admin/save", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ path: filePath, content: markdownWithFrontmatter })
		});
		const result = await response.json();
		if (!response.ok || !result.success) {
			throw new Error(result.error || "保存失败");
		}
		message = "保存成功，已提交到 GitHub。";
	} catch (err) {
		error = err instanceof Error ? err.message : "保存失败";
	} finally {
		loading = false;
	}
}
</script>

<div class="admin-editor grid gap-4 lg:grid-cols-2">
	<section class="flex flex-col gap-3">
		<h2 class="text-xl font-bold">编辑器</h2>
		<div class="grid gap-2 sm:grid-cols-2">
			<label class="field sm:col-span-2">
				<span>文件路径</span>
				<input bind:value={filePath} />
			</label>
			<label class="field sm:col-span-2">
				<span>标题</span>
				<input bind:value={title} placeholder="请输入文章标题" />
			</label>
			<label class="field">
				<span>时间</span>
				<input type="datetime-local" bind:value={timestamp} />
			</label>
			<label class="field">
				<span>置顶权重</span>
				<input type="number" min="0" bind:value={top} />
			</label>
			<label class="field sm:col-span-2">
				<span>标签（逗号分隔）</span>
				<input bind:value={tagsText} placeholder="Astro, Svelte" />
			</label>
			<label class="field sm:col-span-2">
				<span>描述</span>
				<textarea rows="2" bind:value={description}></textarea>
			</label>
			{#if collectionType === "note"}
				<label class="field sm:col-span-2">
					<span>系列</span>
					<input bind:value={series} placeholder="可选" />
				</label>
			{/if}
			<div class="sm:col-span-2 flex gap-4 text-sm">
				<label class="inline-flex items-center gap-1"><input type="checkbox" bind:checked={draft} />草稿</label>
				<label class="inline-flex items-center gap-1"><input type="checkbox" bind:checked={sensitive} />敏感</label>
				{#if collectionType === "note"}
					<label class="inline-flex items-center gap-1"><input type="checkbox" bind:checked={toc} />目录</label>
				{/if}
			</div>
		</div>

		<label class="field">
			<span>Markdown 正文</span>
			<textarea rows="18" bind:value={body} class="font-mono" placeholder="开始写作..."></textarea>
		</label>

		<div class="flex items-center gap-3">
			<button type="button" disabled={loading} onclick={save} class="save-btn">{loading ? "保存中..." : "保存并发布"}</button>
			{#if message}<span class="text-sm c-secondary">{message}</span>{/if}
			{#if error}<span class="text-sm text-red-500">{error}</span>{/if}
		</div>

		<details>
			<summary class="cursor-pointer text-sm c-secondary">查看生成 Frontmatter</summary>
			<pre class="mt-2 p-2 bg-block overflow-auto text-xs">{markdownWithFrontmatter.split("\n\n")[0]}</pre>
		</details>
	</section>

	<section class="preview-pane flex flex-col gap-3">
		<h2 class="text-xl font-bold">实时预览（接近线上排版）</h2>
		<article class="flex flex-col gap-4">
			<header class="flex flex-col gap-2">
				<h1 class="text-3xl">{title || "未命名文章"}</h1>
				<div class="text-sm c-secondary flex gap-2 flex-wrap">
					<span>{new Date(timestamp).toLocaleString()}</span>
					{#if parseTags().length > 0}<span>#{parseTags().join(" #")}</span>{/if}
				</div>
				<hr class="b-b b-b-solid b-weak" />
			</header>
			<section class="markdown" id="admin-preview-content">
				{@html previewHtml}
			</section>
		</article>
	</section>
</div>

<style lang="less">
	.admin-editor {
		.field {
			display: flex;
			flex-direction: column;
			gap: 0.2rem;

			input,
			textarea {
				border: 1px solid var(--weak-color);
				border-radius: 0.35rem;
				padding: 0.45rem 0.6rem;
				background: transparent;
			}
		}

		.save-btn {
			padding: 0.45rem 0.9rem;
			border: 1px solid var(--secondary-color);
			border-radius: 0.35rem;
			transition: all 0.12s ease-in-out;
			&:hover:not(:disabled) {
				background-color: var(--primary-color);
				color: var(--background-color);
			}
		}

		.preview-pane {
			border: 1px solid var(--weak-color);
			border-radius: 0.5rem;
			padding: 0.9rem;
			min-height: 70vh;
			overflow: auto;
		}
	}
</style>
