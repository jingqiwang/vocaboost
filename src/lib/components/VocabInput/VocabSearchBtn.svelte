<script lang="ts">
	let { vocab = $bindable() } = $props();
</script>

<button
	class="button-press flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-50 px-5 py-3 transition hover:bg-gray-100 sm:flex-none"
>
	<svg class="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
		></path>
	</svg>
	<span class="text-sm font-medium text-gray-700">搜索</span>
</button>
