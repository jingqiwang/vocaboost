<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state'; // Svelte 5 的新模块

	/**
	 * 修复 1: 在 Svelte 5 中，不再使用 $:
	 * 使用 $derived 来根据 page.url.pathname 自动计算 currentPage
	 * 修复 2: 访问 page 时不要带 $ 符号，因为它不是 Store
	 */
	let currentPage = $derived(page.url.pathname === '/' ? 'add' : page.url.pathname.slice(1));

	const navItems = [
		{ id: 'add', label: '添加', icon: 'plus', path: '/' },
		{ id: 'review', label: '复习', icon: 'book', path: '/review' },
		{ id: 'stats', label: '统计', icon: 'chart', path: '/stats' },
		{ id: 'settings', label: '设置', icon: 'settings', path: '/settings' }
	] as const; // 使用 const 断言获得更好的类型推断

	function handleNavClick(path: string): void {
		goto(path);
	}
</script>

<nav class="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white">
	<div class="mx-auto max-w-4xl px-2">
		<div class="flex h-20 items-center justify-around">
			{#each navItems as item}
				<button
					on:click={() => handleNavClick(item.path)}
					class="button-press flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-all"
					class:text-gray-400={currentPage !== item.id}
					class:hover:text-gray-600={currentPage !== item.id}
				>
					<div
						class="flex h-10 w-10 items-center justify-center rounded-xl"
						class:bg-gray-100={currentPage === item.id}
					>
						{#if item.icon === 'plus'}
							<span class="text-xl" class:text-gray-700={currentPage === item.id}>+</span>
						{:else if item.icon === 'book'}
							<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
								></path>
							</svg>
						{:else if item.icon === 'chart'}
							<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								></path>
							</svg>
						{:else if item.icon === 'settings'}
							<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								></path>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								></path>
							</svg>
						{/if}
					</div>
					<span class="text-xs font-medium" class:text-gray-600={currentPage === item.id}>
						{item.label}
					</span>
				</button>
			{/each}
		</div>
	</div>
</nav>
