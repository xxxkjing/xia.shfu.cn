<script lang="ts">
import { marked } from "marked";

type CollectionType = "note" | "jotting";

interface EditorProps {
	collection?: CollectionType;
	initialPath?: string;
	initialContent?: string;
}

let { collection = "note", initialPath = "", initialContent = "" }: EditorProps = $props();

let filePath = $state(initialPath || `src/content/${collection}/zh-cn/${new Date().toISOString().slice(0, 10)}-new-post.md`);
let body = $state("");
let previewHtml = $state("");
let saving = $state(false);
let loading = $state(false);
let message = $state("");

let form = $state({
	title: "",
	timestamp: new Date().toISOString().slice(0, 16),
	tags: "",
	description: "",
	draft: false,
	sensitive: false,
	top: 0,
	toc: false,
	series: ""
});

function parseFrontmatter(raw: string) {
	if (!raw.startsWith("---\n")) {
		body = raw;
		return;
	}
	const end = raw.indexOf("\n---\n", 4);
	if (end < 0) {
		body = raw;
		return;
	}
	const yaml = raw.slice(4, end);
	body = raw.slice(end + 5);
	for (const line of yaml.split("\n")) {
		const [key, ...rest] = line.split(":");
		const value = rest.join(":").trim();
		if (key === "title") form.title = value.replace(/^"|"$/g, "");
		if (key === "timestamp") form.timestamp = value.slice(0, 16);
		if (key === "description") form.description = value.replace(/^"|"$/g, "");
		if (key === "draft") form.draft = value === "true";
		if (key === "sensitive") form.sensitive = value === "true";
		if (key === "top") form.top = Number(value) || 0;
		if (key === "toc") form.toc = value === "true";
		if (key === "series") form.series = value.replace(/^"|"$/g, "");
		if (key === "tags") {
			const tags = value
				.replace(/^\[|\]$/g, "")
				.split(",")
				.map(tag => tag.trim())
				.filter(Boolean);
			form.tags = tags.join(", ");
		}
	}
}

if (initialContent) parseFrontmatter(initialContent);

function escapeText(value: string) {
	return value.replace(/"/g, '\\"');
}

function composeFrontmatter() {
	const tags = form.tags
		.split(",")
		.map(tag => tag.trim())
		.filter(Boolean);
	const lines = [
		`title: "${escapeText(form.title)}"`,
		`timestamp: ${new Date(form.timestamp).toISOString()}`,
		`tags: [${tags.map(tag => `"${escapeText(tag)}"`).join(", ")}]`,
		`description: "${escapeText(form.description)}"`,
		`sensitive: ${form.sensitive}`,
		`top: ${form.top}`,
		`draft: ${form.draft}`
	];

	if (collection === "note") {
		if (form.series.trim()) lines.push(`series: "${escapeText(form.series)}"`);
		lines.push(`toc: ${form.toc}`);
	}

	return `---\n${lines.join("\n")}\n---\n\n${body}`;
}

let previewTimer: ReturnType<typeof setTimeout>;
$effect(() => {
	clearTimeout(previewTimer);
	const markdown = composeFrontmatter().replace(/^---[\s\S]*?---\n\n/, "");
	previewTimer = setTimeout(() => {
		previewHtml = marked.parse(markdown) as string;
	}, 150);
	return () => clearTimeout(previewTimer);
});

async function loadFile(path: string) {
	if (!path) return;
	loading = true;
	message = "加载文件中...";
	const response = await fetch(`/api/admin/content?path=${encodeURIComponent(path)}`);
	const result = await response.json();
	if (!response.ok || !result.ok) {
		message = result.message || "加载失败";
		loading = false;
		return;
	}
	parseFrontmatter(result.content || "");
	message = "文件已加载";
	loading = false;
}

async function save() {
	saving = true;
	message = "保存中...";
	const response = await fetch("/api/admin/save", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ path: filePath, content: composeFrontmatter() })
	});
	const result = await response.json();
	if (!response.ok || !result.ok) {
		message = result.message || "保存失败";
		saving = false;
		return;
	}
	message = "✅ 已保存并提交到 GitHub";
	saving = false;
}
</script>

<section class="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-70vh">
	<div class="flex flex-col gap-3">
		<div class="flex items-center gap-2">
			<span class="text-sm c-secondary">文件路径</span>
			<input bind:value={filePath} class="grow px-2 py-1 b b-solid b-weak rd-1 bg-transparent text-sm" />
			<button class="px-2 py-1 text-sm b b-solid b-weak rd-1" onclick={() => loadFile(filePath)} disabled={loading}>加载</button>
		</div>

		<div class="grid grid-cols-2 gap-2">
			<label class="flex flex-col gap-1 col-span-2">
				<span>标题</span>
				<input bind:value={form.title} class="px-2 py-2 b b-solid b-weak rd-1 bg-transparent" />
			</label>
			<label class="flex flex-col gap-1">
				<span>发布时间</span>
				<input type="datetime-local" bind:value={form.timestamp} class="px-2 py-2 b b-solid b-weak rd-1 bg-transparent" />
			</label>
			<label class="flex flex-col gap-1">
				<span>标签（逗号分隔）</span>
				<input bind:value={form.tags} class="px-2 py-2 b b-solid b-weak rd-1 bg-transparent" />
			</label>
			<label class="flex flex-col gap-1 col-span-2">
				<span>描述</span>
				<textarea bind:value={form.description} rows="2" class="px-2 py-2 b b-solid b-weak rd-1 bg-transparent"></textarea>
			</label>
			{#if collection === "note"}
				<label class="flex flex-col gap-1">
					<span>系列</span>
					<input bind:value={form.series} class="px-2 py-2 b b-solid b-weak rd-1 bg-transparent" />
				</label>
			{/if}
			<label class="flex flex-col gap-1">
				<span>置顶值</span>
				<input type="number" min="0" bind:value={form.top} class="px-2 py-2 b b-solid b-weak rd-1 bg-transparent" />
			</label>
			<label class="flex items-center gap-2"><input type="checkbox" bind:checked={form.draft} />草稿</label>
			<label class="flex items-center gap-2"><input type="checkbox" bind:checked={form.sensitive} />敏感内容</label>
			{#if collection === "note"}
				<label class="flex items-center gap-2"><input type="checkbox" bind:checked={form.toc} />目录</label>
			{/if}
		</div>

		<label class="flex flex-col gap-1 grow">
			<span>Markdown 正文</span>
			<textarea bind:value={body} class="grow min-h-80 px-3 py-2 b b-solid b-weak rd-1 bg-transparent font-mono text-sm leading-6"></textarea>
		</label>
		<div class="flex items-center gap-3">
			<button class="px-4 py-2 rd-1 bg-primary c-background" onclick={save} disabled={saving}>{saving ? "保存中..." : "保存并发布"}</button>
			<span class="text-sm c-secondary">{message}</span>
		</div>
	</div>

	<div class="b b-solid b-weak rd-2 p-4 overflow-auto bg-background">
		<div class="markdown" id="admin-preview">
			{@html previewHtml}
		</div>
	</div>
</section>
