<script lang="ts">
	import Toast from './Toast.svelte';
	import { AudioService } from '$lib/services/AudioService';

	let { vocab = $bindable() } = $props();
	let isLoading = $state(false);
	let errorMsg = $state('');

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

<div class="relative inline-flex items-center justify-center">
	{#if errorMsg}
		<Toast message={errorMsg} type="error" onclose={() => (errorMsg = '')} />
	{/if}

	<button
		class="button-press flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100
        {isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
		disabled={isLoading}
		onclick={(e) => {
			e.preventDefault();
			e.stopPropagation();
			handleSpeak(vocab, 'uk');
		}}
	>
		{#if isLoading}
			<span class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
			></span>
		{:else}
			<div class="flex items-center gap-0.5">
				<svg class="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
					></path>
				</svg>
				<span class="text-[9px] font-bold text-gray-400">UK</span>
			</div>
		{/if}
	</button>
</div>
