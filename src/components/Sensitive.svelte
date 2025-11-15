<script lang="ts">
import type { Snippet } from "svelte";
import { fade } from "svelte/transition";

let { sensitive = false, back, children }: { sensitive: boolean; back: string; children: Snippet } = $props();

if (sensitive) {
	$effect(() => {
		if (!sensitive) window.zoom();
	});
}
</script>

{#if sensitive}
	<div transition:fade={{ duration: 150 }} class="flex flex-col items-center justify-end gap-6">
		<h2>敏感内容</h2>
		<div class="flex flex-col items-center justify-end gap-3">
			<p>此内容被标记为敏感，可能包含令人不适的元素。</p>
			<p>请确认您已年满十八周岁，并愿意承担相应风险。</p>
		</div>
		<div class="flex gap-3">
			<button class="font-bold c-background bg-red-5 py-1 px-2 rd-md" onclick={() => (sensitive = false)}>
				继续访问
			</button>
			<a href={back} class="flex items-center font-bold c-background bg-secondary py-1 px-2 rd-md">
				返回
			</a>
		</div>
	</div>
{:else}
	<div transition:fade={{ delay: 150, duration: 150 }}>{@render children()}</div>
{/if}
