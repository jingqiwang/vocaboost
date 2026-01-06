<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	let { vocab = $bindable() } = $props();
	const dispatch = createEventDispatcher();

	let isLoading = $state(false);
	let errorMsg = $state('');

	async function handleSearch(e: Event) {
		e.preventDefault();
		if (!vocab || isLoading) return;

		isLoading = true;
		errorMsg = '';

		try {
			// 使用 eliaschen 的免费词典 API（UK 数据源）
			const url = `https://dictionary-api.eliaschen.dev/api/dictionary/uk/${encodeURIComponent(vocab)}`;
			const res = await fetch(url);
			if (!res.ok) {
				throw new Error('未找到该单词的词典释义');
			}
			const data = await res.json();
			// 解析释义（英英为主，若存在 translation 则优先展示）
			const parsed: { pos: string; def: string }[] = [];
			if (data && Array.isArray(data.definition)) {
				for (const d of data.definition) {
					const pos = d.pos || '';
					const defText = d.translation && String(d.translation).trim().length > 0 ? d.translation : d.text;
					if (defText && String(defText).trim().length > 0) {
						parsed.push({ pos, def: defText });
					}
				}
			}
			if (parsed.length === 0) {
				throw new Error('未获取到释义');
			}
			dispatch('searchResults', parsed.slice(0, 12));
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : '搜索失败，请稍后重试';
			dispatch('searchError', errorMsg);
		} finally {
			isLoading = false;
		}
	}

	function fillMeaning(def: string) {
		dispatch('fillMeaning', def);
	}
</script>

<button
	class="button-press flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-50 px-5 py-3 transition hover:bg-gray-100 sm:flex-none"
	onclick={handleSearch}
	title="使用免费英英词典搜索释义"
>
	<svg class="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
		></path>
	</svg>
	<span class="text-sm font-medium text-gray-700">{isLoading ? '搜索中...' : '搜索'}</span>
</button>
