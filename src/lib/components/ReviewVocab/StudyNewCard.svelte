<script lang="ts">
	import AudioBtn from './AudioBtn.svelte';
	let { currentVocab, progressStr, progressPercent, onNewWordLearned } = $props();
</script>

<div class="mx-auto w-full max-w-md">
	<div class="relative flex h-150 flex-col select-none">
		<!-- Top Bar -->
		<div class="flex items-center justify-between py-4 text-sm font-medium text-zinc-500">
			<div class="flex flex-1 items-center gap-3 px-4">
				<div class="mr-2 flex items-center gap-2">
					<span
						class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold whitespace-nowrap text-blue-700"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="lucide lucide-sparkles h-3 w-3 fill-current"
							aria-hidden="true"
							><path
								d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
							></path><path d="M20 2v4"></path><path d="M22 4h-4"></path><circle
								cx="4"
								cy="20"
								r="2"
							></circle></svg
						>
						新单词
					</span>
				</div>
				<div class="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-200">
					<div
						id="progress-bar"
						class="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
						style="width: {progressPercent()}%"
					></div>
				</div>
				<span class="text-xs tabular-nums opacity-70">
					<span>{progressStr}</span>
				</span>
			</div>
		</div>

		<div class="perspective-1000 relative my-2 flex flex-1 flex-col">
			<div
				id="word-card"
				class="card-enter flex h-full flex-1 flex-col overflow-hidden rounded-[2rem] border border-zinc-100 bg-white shadow-xl"
			>
				<div
					class="custom-scrollbar flex flex-1 flex-col items-center overflow-y-auto p-8 text-center"
				>
					<div
						class="flex min-h-[300px] w-full flex-1 flex-col items-center justify-center space-y-8"
					>
						<h2 class="text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
							{currentVocab.word}
						</h2>

						<AudioBtn vocab={currentVocab} autoplay={true} />

						<div
							class="w-full space-y-2 rounded-2xl border border-zinc-200/50 bg-zinc-50 p-6 text-left"
						>
							<div
								class="flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-400 uppercase"
							>
								Description
							</div>
							<p class="text-xl leading-relaxed font-medium text-zinc-800">
								{currentVocab.description}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="h-24 pt-4">
			<button
				id="next-btn"
				onclick={onNewWordLearned}
				class="flex h-16 w-full items-center justify-center rounded-2xl bg-blue-600 text-lg font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-[0.98]"
			>
				<span>已记住</span>
			</button>
		</div>
	</div>
</div>
