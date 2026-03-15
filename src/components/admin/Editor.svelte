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

<div class="grid gap-4 lg:grid-cols-[430px,1fr] h-[calc(100vh-8rem)]">
	<section class="b b-solid b-weak rd-2 p-4 overflow-y-auto flex flex-col gap-3">
		<h2 class="font-bold text-lg">编辑器</h2>
		<div class="grid gap-2">
			<label class="text-sm c-secondary">文章类型</label>
			<input value={collectionType} disabled class="b b-solid b-weak rd-1 px-2 py-1 bg-block c-secondary" />
		</div>
		<div class="grid gap-2">
			<label class="text-sm c-secondary">文件名（slug）</label>
			<input bind:value={slug} placeholder="例如：2026-01-01-my-post" class="b b-solid b-weak rd-1 px-2 py-1 bg-transparent" />
		</div>
		<div class="grid gap-2">
			<label class="text-sm c-secondary">标题</label>
			<input bind:value={title} class="b b-solid b-weak rd-1 px-2 py-1 bg-transparent" />
		</div>
		<div class="grid gap-2">
			<label class="text-sm c-secondary">发布时间</label>
			<input bind:value={timestamp} type="datetime-local" class="b b-solid b-weak rd-1 px-2 py-1 bg-transparent" />
		</div>
		{#if collectionType === "note"}
			<div class="grid gap-2">
				<label class="text-sm c-secondary">系列（series）</label>
				<input bind:value={series} class="b b-solid b-weak rd-1 px-2 py-1 bg-transparent" />
			</div>
		{/if}
		<div class="grid gap-2">
			<label class="text-sm c-secondary">标签（逗号分隔）</label>
			<input bind:value={tagsInput} class="b b-solid b-weak rd-1 px-2 py-1 bg-transparent" />
		</div>
		<div class="grid gap-2">
			<label class="text-sm c-secondary">描述</label>
			<textarea bind:value={description} rows="3" class="b b-solid b-weak rd-1 px-2 py-1 bg-transparent"></textarea>
		</div>
		<div class="grid grid-cols-2 gap-2">
			<label class="flex items-center gap-2"><input bind:checked={sensitive} type="checkbox" class="switch" /> 敏感</label>
			<label class="flex items-center gap-2"><input bind:checked={draft} type="checkbox" class="switch" /> 草稿</label>
			{#if collectionType === "note"}
				<label class="flex items-center gap-2"><input bind:checked={toc} type="checkbox" class="switch" /> 目录</label>
			{/if}
		</div>
		<div class="grid gap-2">
			<label class="text-sm c-secondary">置顶权重（top）</label>
			<input bind:value={top} type="number" min="0" class="b b-solid b-weak rd-1 px-2 py-1 bg-transparent" />
		</div>
		<div class="grid gap-2">
			<label class="text-sm c-secondary">Markdown 正文</label>
			<textarea bind:value={body} rows="14" class="b b-solid b-weak rd-1 px-2 py-2 bg-transparent font-mono"></textarea>
		</div>
		<button onclick={saveContent} class="justify-center py-2 rd-1 bg-primary c-background font-bold" disabled={loading}>
			{loading ? "保存中..." : "保存并发布"}
		</button>
		{#if message}<p class="text-sm c-green-6">{message}</p>{/if}
		{#if error}<p class="text-sm c-red-6">{error}</p>{/if}
		<p class="text-xs c-remark">目标路径：{filePath}</p>
	</section>

	<section class="b b-solid b-weak rd-2 p-4 overflow-y-auto flex flex-col gap-4">
		<header class="flex flex-col gap-2">
			<h1 class="text-3xl">{title || "未命名文章"}</h1>
			<p class="text-sm c-secondary">沉浸式预览（尽量贴合线上样式）</p>
			<hr class="b-b b-b-solid b-weak" />
		</header>
		<article class="markdown">{@html previewHtml}</article>
	</section>
</div>
