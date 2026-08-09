<script lang="ts">
import { onMount, type Snippet } from "svelte";

interface SearchEntry {
	title: string;
	description?: string;
	url: string;
	type: "note" | "jotting";
	timestamp: string;
	tags?: string[];
	content: string;
}

interface SearchResult extends SearchEntry {
	score: number;
	excerpt: string;
	titleHit: boolean;
}

let { search, close }: { [key: string]: Snippet } = $props();

let open: boolean = $state(false);
let query: string = $state("");
let active: number = $state(0);
let input: HTMLInputElement | undefined = $state();
let list: HTMLUListElement | undefined = $state();
let index: SearchEntry[] = $state([]);
let loading: boolean = $state(false);
let failed: boolean = $state(false);

// Lazily fetch the search index the first time the panel is opened
async function loadIndex() {
	if (index.length || loading) return;
	loading = true;
	try {
		const response = await fetch("/search-index.json");
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		index = await response.json();
		failed = false;
	} catch (error) {
		console.error("[Search] Failed to load search index:", error);
		failed = true;
	} finally {
		loading = false;
	}
}

// Compute the snippet of text around the first match in `content`
function makeExcerpt(content: string, term: string, radius = 40): string {
	if (!term) return content.slice(0, 80);
	const lower = content.toLowerCase();
	const pos = lower.indexOf(term.toLowerCase());
	if (pos === -1) return content.slice(0, 80);
	const start = Math.max(0, pos - radius);
	const end = Math.min(content.length, pos + term.length + radius);
	return (start > 0 ? "…" : "") + content.slice(start, end) + (end < content.length ? "…" : "");
}

// Search scoring: title hit > tag hit > description hit > content hit
function searchEntries(entries: SearchEntry[], raw: string): SearchResult[] {
	const term = raw.trim().toLowerCase();
	if (!term) return [];

	const results: SearchResult[] = [];
	for (const entry of entries) {
		const titleHit = entry.title.toLowerCase().includes(term);
		const tagHit = entry.tags?.some(tag => tag.toLowerCase().includes(term)) ?? false;
		const descHit = entry.description?.toLowerCase().includes(term) ?? false;
		const contentHit = entry.content.toLowerCase().includes(term);

		if (!titleHit && !tagHit && !descHit && !contentHit) continue;

		// Priority-based score; timestamp gives a small tiebreaker for newer items
		const score = (titleHit ? 100 : 0) + (tagHit ? 40 : 0) + (descHit ? 20 : 0) + (contentHit ? 1 : 0) + new Date(entry.timestamp).getTime() / 1e15;

		results.push({
			...entry,
			score,
			titleHit,
			excerpt: makeExcerpt(entry.description || entry.content, term)
		});
	}

	// Title matches always rank first; the rest are ordered by combined score
	return results
		.sort((a, b) => Number(b.titleHit) - Number(a.titleHit) || b.score - a.score)
		.slice(0, 20);
}

let results: SearchResult[] = $derived(searchEntries(index, query));

// Reset the active highlight whenever the result set changes
$effect(() => {
	results.length;
	active = 0;
});

// Keep the active item in view as the user arrows through the list
$effect(() => {
	if (!list) return;
	active;
	const item = list.querySelector<HTMLElement>(`[data-index="${active}"]`);
	item?.scrollIntoView({ block: "nearest" });
});

function show() {
	open = true;
	loadIndex();
	queueMicrotask(() => input?.focus());
}

function hide() {
	open = false;
	query = "";
}

function navigate(url: string) {
	hide();
	// Prefer Swup page transitions when available, falling back to a hard navigation
	if (window.swup) {
		window.swup.navigate(url);
	} else {
		window.location.href = url;
	}
}

/**
 * Escape user-controlled characters before interpolating into HTML.
 * @param text Raw string from the search index (no longer user input, but kept
 *   safe in case future edits change the data source).
 */
function escapeHtml(text: string): string {
	return text.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}

/**
 * Highlight every occurrence of the query inside an arbitrary text value.
 * @param text The text to highlight matches in
 * @param query The active search query
 */
function highlight(text: string, query: string): string {
	const escaped = escapeHtml(text);
	if (!query.trim()) return escaped;
	const pattern = new RegExp(escapeHtml(query.trim()).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
	return escaped.replace(pattern, match => `<mark>${match}</mark>`);
}

function onKeydown(event: KeyboardEvent) {
	// Open with Ctrl/Cmd+K or "/"; close with Escape
	if (event.key === "Escape" && open) {
		event.preventDefault();
		hide();
		return;
	}

	const isModifier = event.metaKey || event.ctrlKey;
	if (isModifier && event.key.toLowerCase() === "k") {
		event.preventDefault();
		open ? hide() : show();
		return;
	}

	if (event.key === "/" && !open && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
		event.preventDefault();
		show();
		return;
	}

	if (!open) return;

	if (event.key === "ArrowDown") {
		event.preventDefault();
		active = Math.min(active + 1, Math.max(results.length - 1, 0));
	} else if (event.key === "ArrowUp") {
		event.preventDefault();
		active = Math.max(active - 1, 0);
	} else if (event.key === "Enter") {
		event.preventDefault();
		const target = results[active];
		if (target) navigate(target.url);
	}
}

onMount(() => {
	// Re-bind the global shortcut after Swup page transitions
	const bind = () => document.addEventListener("keydown", onKeydown);
	document.addEventListener("keydown", onKeydown);
	document.addEventListener("swup:enable", bind);

	// Cleanup listeners on component destroy (e.g. Swup page transitions)
	return () => {
		document.removeEventListener("keydown", onKeydown);
		document.removeEventListener("swup:enable", bind);
	};
});
</script>

<button onclick={show} aria-label="搜索" class="inline-flex items-center" type="button">
	{@render search()}
</button>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div role="button" onclick={hide} class="fixed top-0 left-0 w-screen h-screen pointer-events-auto bg-#aaaaaa88 z-3"></div>

	<div class="fixed top-10vh left-50% -transform-translate-x-50% w-[min(calc(100%_-_1.5rem),640px)] max-h-80vh flex flex-col bg-background rd-3 shadow-lg z-4 overflow-hidden">
		<header class="flex items-center gap-2 px-3 py-2 border-b-1 border-weak">
			<span class="c-remark shrink-0">{@render search()}</span>
			<input
				bind:this={input}
				bind:value={query}
				type="search"
				placeholder="搜索笔记与随笔…"
				autocomplete="off"
				spellcheck="false"
				class="grow bg-transparent border-none outline-none text-size-base"
			/>
			<button onclick={hide} aria-label="关闭" class="c-remark hover:c-primary transition-colors" type="button">{@render close()}</button>
		</header>

		<ul bind:this={list} class="flex flex-col gap-1 p-2 overflow-y-auto">
			{#if loading}
				<li class="py-8 text-center c-remark text-sm">正在加载索引…</li>
			{:else if failed}
				<li class="py-8 text-center c-remark text-sm">无法加载索引，请稍后重试</li>
			{:else if !query.trim()}
				<li class="py-8 text-center c-remark text-sm">输入关键词开始搜索</li>
			{:else if results.length === 0}
				<li class="py-8 text-center c-remark text-sm">没有找到匹配的内容</li>
			{:else}
				{#each results as result, i (result.url)}
					<li data-index={i}>
						<button
							type="button"
							onmouseenter={() => (active = i)}
							onclick={() => navigate(result.url)}
							class:location={i === active}
							class="flex flex-col gap-1 w-full px-3 py-2 rd-1 text-left transition-colors"
						>
							<span class="flex items-center gap-2">
								<span class="c-remark text-xs uppercase">{result.type === "note" ? "笔记" : "随笔"}</span>
								<span class="font-semibold">{@html highlight(result.title, query)}</span>
							</span>
							{#if result.excerpt}
								<span class="c-remark text-xs line-clamp-2">{@html highlight(result.excerpt, query)}</span>
							{/if}
							{#if result.tags?.length}
								<span class="flex flex-wrap gap-1 c-remark text-xs">
									{#each result.tags as tag}
										<span>#{tag}</span>
									{/each}
								</span>
							{/if}
						</button>
					</li>
				{/each}
			{/if}
		</ul>

		<footer class="flex items-center gap-3 px-3 py-1.5 border-t-1 border-weak c-remark text-xs">
			<span>↑ ↓ 选择</span>
			<span>↵ 打开</span>
			<span>Esc 关闭</span>
			<span class="ml-a">共 {results.length} 条</span>
		</footer>
	</div>
{/if}

<style lang="less">
	button[aria-label="搜索"] {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-weight: bold;
		white-space: nowrap;
		transition:
			color 0.15s ease-in-out,
			background-color 0.15s ease-in-out;

		&:hover {
			color: var(--background-color);
			background-color: var(--primary-color);
		}
	}

	ul {
		mark {
			padding: 0 0.1em;
			color: var(--background-color);
			background-color: var(--primary-color);
			border-radius: 0.15rem;
		}

		button {
			&.location {
				color: var(--secondary-color);
				background-color: var(--background-color);
			}

			@media (min-width: 640px) {
				&:hover {
					color: var(--secondary-color);
					background-color: var(--background-color);
				}
			}
		}
	}
</style>
