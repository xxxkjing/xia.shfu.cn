<script lang="ts">
type MediaItem = {
	name: string;
	path: string;
	size: number;
	url: string;
	markdown: string;
};

let loading = $state(false);
let deletingPath = $state("");
let error = $state("");
let message = $state("");
let items = $state<MediaItem[]>([]);

const loadItems = async () => {
	loading = true;
	error = "";
	try {
		const response = await fetch("/api/admin/media");
		const result = await response.json().catch(() => ({ ok: false, error: "读取失败" }));
		if (!response.ok || !result.ok || !Array.isArray(result.items)) {
			error = result.error || "读取失败";
			return;
		}
		items = result.items;
	} catch {
		error = "网络错误，请稍后重试";
	} finally {
		loading = false;
	}
};

const copyMarkdown = async (markdown: string) => {
	message = "";
	error = "";
	try {
		await navigator.clipboard.writeText(markdown);
		message = "Markdown 链接已复制";
	} catch {
		error = "复制失败，请手动复制";
	}
};

const deleteMedia = async (item: MediaItem) => {
	if (!confirm(`确认删除媒体 ${item.name}？`)) return;

	message = "";
	error = "";
	deletingPath = item.path;
	try {
		const response = await fetch("/api/admin/media", {
			method: "DELETE",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ path: item.path })
		});
		const result = await response.json().catch(() => ({ ok: false, error: "删除失败" }));
		if (!response.ok || !result.ok) {
			error = result.error || "删除失败";
			return;
		}
		items = items.filter(entry => entry.path !== item.path);
		message = `已删除：${item.name}`;
	} catch {
		error = "网络错误，请稍后重试";
	} finally {
		deletingPath = "";
	}
};

$effect(() => {
	loadItems();
});
</script>

<section class="media-shell b b-solid b-weak rd-2 p-4">
	<header class="media-head">
		<h2 class="font-bold">媒体管理</h2>
		<button type="button" class="refresh-btn" onclick={loadItems} disabled={loading}>{loading ? "刷新中..." : "刷新"}</button>
	</header>

	{#if message}<p class="text-sm c-green-6">{message}</p>{/if}
	{#if error}<p class="text-sm c-red-6">{error}</p>{/if}

	{#if items.length === 0}
		<p class="text-sm c-remark py-3">暂无媒体文件，先去编辑页上传图片吧。</p>
	{:else}
		<ul class="media-list">
			{#each items as item}
				<li>
					<div class="meta">
						<a href={item.url} target="_blank" rel="noreferrer" class="link">{item.name}</a>
						<small class="c-remark">{(item.size / 1024).toFixed(1)} KB · {item.path}</small>
					</div>
					<div class="actions">
						<button type="button" class="mini-btn" onclick={() => copyMarkdown(item.markdown)}>复制 Markdown</button>
						<button
							type="button"
							class="mini-btn danger"
							onclick={() => deleteMedia(item)}
							disabled={deletingPath === item.path}
						>
							{deletingPath === item.path ? "删除中..." : "删除"}
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style lang="less">
	.media-shell {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		background: color-mix(in oklab, var(--background-color) 94%, var(--block-color));
	}

	.media-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.6rem;
	}

	.refresh-btn {
		padding: 0.35rem 0.7rem;
		border: 1px solid var(--weak-color);
		border-radius: 0.35rem;
		font-size: 0.85rem;
	}

	.media-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 55vh;
		overflow-y: auto;

		li {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 0.6rem;
			padding: 0.5rem 0;
			border-bottom: 1px dashed var(--weak-color);
		}
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.actions {
		display: flex;
		gap: 0.45rem;
		flex-shrink: 0;
	}

	.mini-btn {
		padding: 0.32rem 0.65rem;
		border: 1px solid var(--weak-color);
		border-radius: 0.35rem;
		font-size: 0.8rem;
		white-space: nowrap;
	}

	.danger {
		border-color: color-mix(in oklab, var(--red-color) 55%, var(--weak-color));
		color: var(--red-color);
	}
</style>
