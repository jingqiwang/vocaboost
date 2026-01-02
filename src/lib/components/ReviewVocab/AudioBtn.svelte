<script lang="ts">
	import Toast from '../Toast.svelte';
	import { AudioService } from '$lib/services/AudioService';

	let { vocab, autoplay = false } = $props();

	let isLoading = $state(false);
	let errorMsg = $state('');
	let lastPlayedId = $state<number | undefined>(undefined);

	$effect(() => {
		// 只有开启了 autoplay 且单词存在时才播放
		if (autoplay && vocab?.word && vocab?.id !== lastPlayedId) {
			handleSpeak(vocab.word, 'uk');
			lastPlayedId = vocab.id;
		}
	});

	async function handleSpeak(word: string, accent: 'uk' | 'us' = 'uk') {
		if (!word || isLoading) return;

		isLoading = true;
		errorMsg = '';

		try {
			await AudioService.speakWord(word, accent);
		} catch (error) {
			errorMsg = error instanceof Error ? error.message : '播放出错';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex justify-center">
	{#if errorMsg}
		<Toast message={errorMsg} type="error" onclose={() => (errorMsg = '')} />
	{/if}

	<button
		class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200/50 text-gray-900 ring-4 ring-transparent transition-all hover:scale-110 hover:bg-gray-100 hover:ring-gray-200
        {isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
		disabled={isLoading}
		onclick={(e) => {
			e.preventDefault();
			e.stopPropagation();
			handleSpeak(vocab.word, 'uk');
		}}
	>
		{#if isLoading}
			<span class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
			></span>
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="32"
				height="32"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path
					d="M15.54 8.46a5 5 0 0 1 0 7.07"
				/><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg
			>
		{/if}
	</button>
</div>
