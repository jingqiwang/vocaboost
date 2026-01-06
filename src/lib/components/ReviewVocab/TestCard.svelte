<script lang="ts">
	import AudioBtn from './AudioBtn.svelte';
	let { currentVocab, progressStr, progressPercent, onShowAnswer, onBack = () => {} } = $props();
</script>

<div class="mx-auto w-full max-w-md">
	<div class="relative flex h-[600px] flex-col select-none">
		<!-- Top Bar -->
		<div class="flex items-center justify-between px-2 py-4 text-sm font-medium text-gray-500">
			<!-- svelte-ignore a11y_consider_explicit_label -->
			<button
				class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-gray-100"
				onclick={onBack}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg
				>
			</button>
			<div class="flex flex-1 items-center gap-3 px-4">
				<div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
					<div class="h-full rounded-full bg-gray-900" style="width: {progressPercent()}%"></div>
					<!-- Primary Color Progress -->
				</div>
				<span class="text-xs tabular-nums opacity-70">{progressStr}</span>
			</div>
			<!-- svelte-ignore a11y_consider_explicit_label -->
			<button
				class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle
						cx="5"
						cy="12"
						r="1"
					/></svg
				>
			</button>
		</div>

		<!-- Card Area -->
		<div class="perspective-1000 relative my-2 flex flex-1 flex-col">
			<div
				class="relative flex flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2rem] border-0 bg-white p-8 shadow-xl transition-transform duration-200 active:scale-[0.99]"
			>
				<div class="z-10 w-full space-y-8 text-center">
					<!-- 单词: 修正了 blur-md 和 opacity-50 -->
					<h2
						class="text-5xl font-bold tracking-tight text-gray-900 opacity-50 blur-md transition-all select-none"
					>
						{currentVocab.word}
					</h2>

					<AudioBtn vocab={currentVocab} autoplay={true} />

					<!-- 提示文案 -->
					<p class="animate-pulse text-sm font-medium text-gray-400">请听发音回忆单词...</p>
				</div>
			</div>
		</div>

		<!-- Action Bar -->
		<div class="h-24 px-2 pt-4">
			<!-- 按钮颜色修正: bg-primary (gray-900) -->
			<button
				class="h-16 w-full cursor-pointer rounded-2xl bg-gray-900 text-lg font-medium text-white shadow-lg transition-all hover:bg-gray-800 active:scale-[0.98]"
				onclick={onShowAnswer}
			>
				显示答案
			</button>
		</div>
	</div>
</div>
