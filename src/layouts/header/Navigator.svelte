<script lang="ts">
import { onMount, type Snippet } from "svelte";
import ThemeSwitcher from "./ThemeSwitcher.svelte";

let { route, home, note, jotting, about, rss, sun, moon, bars, close }: { route: string } & { [key: string]: Snippet } = $props();

// Define home route and navigation routes configuration
const homeRoute = "/";
const routes: { path: string; extra?: string[]; icon: Snippet; label: string }[] = [
	{ label: "首页", path: homeRoute, extra: ["/preface"], icon: home },
	{ label: "笔记", path: "/note", icon: note },
	{ label: "随笔", path: "/jotting", icon: jotting },
	{ label: "关于", path: "/about", icon: about }
];

/**
 * Check if a route is currently active based on the current route path
 * @param route - The current route path
 * @param home - The home route path
 * @param path - The navigation item path to check against
 * @param extra - Optional array of additional paths that should be considered active
 * @returns True if the route is active, false otherwise
 */
function active(path: string, extra?: string[]) {
	if (extra?.some(item => item === route)) return true;
	if (path === homeRoute) return path === route;
	return route.startsWith(path);
}

// Control mobile menu visibility state
let menu: boolean = $state(false);
let navigator: HTMLElement | undefined = $state();

onMount(() => {
	// Close mobile menu when any navigation link is clicked
	for (const link of navigator!.getElementsByTagName("a")) {
		link.addEventListener("click", () => (menu = false));
	}

	// Set up route tracking for page navigation with Swup integration
	const updateRoute = () => (route = window.location.pathname);
	if (window.swup) {
		// Register route update hook if Swup is already available
		window.swup.hooks.on("page:load", updateRoute);
	} else {
		// Wait for Swup to be enabled and then register the hook
		document.addEventListener("swup:enable", () => window.swup?.hooks.on("page:load", updateRoute));
	}
});
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div role="button" onclick={() => (menu = false)} class:pointer-events-none={!menu} class:bg-transparent={!menu} class="fixed top-0 left-0 w-screen h-screen pointer-events-auto bg-#aaaaaa88 transition-background-color sm:hidden"></div>

<nav bind:this={navigator} class:transform-translate-x-full={!menu} class="fixed top-0 right-0 flex flex-col justify-between items-start gap-5 p-5 bg-background h-full sm:contents overflow-hidden transition-transform">
	<header class="grid gap-5 c-secondary grid-rows-[repeat(5,1fr)] sm:(grid-rows-none grid-cols-[repeat(4,1fr)])">
		<button onclick={() => (menu = false)} class="sm:hidden">{@render close()}</button>

		{#each routes as item}
			<a href={item.path} class:location={active(item.path, item.extra)}>
				<span>{@render item.icon()}</span>
				<p>{item.label}</p>
			</a>
		{/each}
	</header>

	<footer class="flex flex-col gap-2 sm:gap-5 sm:(flex-row gap-7)">
		<ThemeSwitcher {sun} {moon} />

		<a href="/feed.xml" target="_blank" aria-label="Subscription" class="inline-flex">{@render rss()}</a>
	</footer>
</nav>

<button onclick={() => (menu = true)} class="sm:hidden">{@render bars()}</button>

<style lang="less">
	header {
		a {
			position: relative;
			display: inline-block;

			p,
			span {
				padding: 5px 10px;
				text-align: center;
			}

			span {
				position: absolute;
				top: 0px;
				width: 100%;
				height: 100%;
				border-bottom: 2px solid transparent;

				transition: border-color 0.15s ease;
			}

			p {
				color: var(--background-color);
				background-color: var(--primary-color);

				clip-path: inset(0 100% 0 0);
				transition: clip-path 0.15s ease;
			}

			&.location {
				span {
					border-color: var(--secondary-color);
				}
			}

			&:hover {
				p {
					clip-path: inset(0 0 0 0);
				}
			}
		}
	}

	footer {
		a:not(footer > a) {
			display: flex;
			align-items: center;
			gap: 0.25rem;

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
	}

	@media screen and (max-width: 640px) {
		nav {
			header {
				a {
					display: flex;
					gap: 0.5rem;

					span,
					p {
						padding: 0px;
					}

					span {
						position: static;
						width: auto;

						display: inline-flex;
						align-items: center;

						border-bottom: none;
						color: var(--primary-color);
					}

					p {
						white-space: nowrap;

						clip-path: none;
						color: var(--primary-color);
						background-color: var(--background-color);
					}

					&.location {
						font-weight: bold;
					}
				}
			}

			footer {
				a:not(footer > a) {
					padding: 0.25rem 0rem;
					font-weight: normal;
				}
			}
		}
	}
</style>
