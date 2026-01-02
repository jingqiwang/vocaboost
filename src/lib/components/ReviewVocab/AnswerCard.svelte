<script lang="ts">
	import AudioBtn from './AudioBtn.svelte';
	let { currentVocab, progressStr, progressPercent, onSelectResult } = $props();
</script>

<div class="mx-auto w-full max-w-md">
	<div class="relative flex h-[600px] flex-col select-none">
		<!-- Top Bar -->
		<div class="flex items-center justify-between px-2 py-4 text-sm font-medium text-gray-500">
			<!-- svelte-ignore a11y_consider_explicit_label -->
			<button
				class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-gray-100"
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

		<!-- Card Area (Expanded) -->
		<div class="perspective-1000 relative my-2 flex flex-1 flex-col">
			<div class="flex flex-1 flex-col overflow-hidden rounded-[2rem] border-0 bg-white shadow-xl">
				<div
					class="ease-spring flex flex-[0.4] flex-col items-center justify-center border-b border-gray-100 bg-gray-100/50 p-4 transition-all"
				>
					<div class="w-full space-y-4 text-center">
						<h2 class="text-4xl font-bold tracking-tight text-gray-900">{currentVocab.word}</h2>

						<AudioBtn vocab={currentVocab} />
					</div>
				</div>

				<!-- Bottom Half: Meaning -->
				<div class="no-scrollbar flex-[0.6] overflow-y-auto bg-white p-8">
					<div class="space-y-6">
						<div class="space-y-2">
							<div class="text-xs font-bold tracking-wider text-gray-400 uppercase">
								Description
							</div>
							<p class="text-xl leading-relaxed font-medium text-gray-900/90">
								{currentVocab.description}
							</p>
						</div>

						<!-- Stats -->
						<div class="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
							<div class="rounded-xl bg-red-50 p-3">
								<div class="text-xs text-red-600/70">忘记次数</div>
								<div class="text-lg font-bold text-red-600">{currentVocab.forgetCount}</div>
							</div>
							<div class="rounded-xl bg-green-50 p-3">
								<div class="text-xs text-green-600/70">复习通过</div>
								<div class="text-lg font-bold text-green-600">{currentVocab.knowCount}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Action Bar: Grading Buttons -->
		<div class="h-24 px-2 pt-4">
			<div class="grid h-16 grid-cols-3 gap-3">
				<!-- 错误 -->
				<button
					class="flex h-full flex-col items-center justify-center gap-1 rounded-2xl border border-red-200 bg-red-50 text-red-700 transition-all hover:scale-[1.02] hover:border-red-300 hover:bg-red-100 active:scale-[0.98]"
					onclick={() => onSelectResult('forget')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M18 6 6 18" />
						<path d="m6 6 12 12" />
					</svg>
					<span class="text-sm font-semibold">错误</span>
				</button>

				<!-- 不确定 -->
				<button
					class="flex h-full flex-col items-center justify-center gap-1 rounded-2xl border border-orange-200 bg-orange-50 text-orange-700 transition-all hover:scale-[1.02] hover:border-orange-300 hover:bg-orange-100 active:scale-[0.98]"
					onclick={() => onSelectResult('vague')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="10" />
						<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
						<path d="M12 17h.01" />
					</svg>
					<span class="text-sm font-semibold">不确定</span>
				</button>

				<!-- 正确 -->
				<button
					class="flex h-full flex-col items-center justify-center gap-1 rounded-2xl border border-green-200 bg-green-50 text-green-700 transition-all hover:scale-[1.02] hover:border-green-300 hover:bg-green-100 active:scale-[0.98]"
					onclick={() => onSelectResult('know')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M20 6 9 17 4 12" />
					</svg>
					<span class="text-sm font-semibold">正确</span>
				</button>
			</div>
		</div>
	</div>
</div>
