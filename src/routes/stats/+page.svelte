<script lang="ts">
	import { onMount } from 'svelte';
	import { Vocabulary } from '$lib/models/Vocabulary';
	import { StudyLog } from '$lib/models/StudyLog';
    import AudioBtn from '$lib/components/AddVocab/AudioBtn.svelte';

	let vocabCount = 0;
	let studyTimes = 0;
	let vocabularies: Vocabulary[] = [];
	let pageIndex = 1;
	let pageSize = 500;
	let loading = false;
	let hasMore = true;

	onMount(async () => {
		vocabCount = await Vocabulary.count();
		studyTimes = await StudyLog.count();
		await loadMoreVocabularies();
	});

	async function loadMoreVocabularies() {
		if (loading || !hasMore) return;

		loading = true;
		try {
			const newVocabs = await Vocabulary.paginate(pageIndex, pageSize);

			if (newVocabs.length < pageSize) {
				hasMore = false;
			}

			vocabularies = [...vocabularies, ...newVocabs];
			pageIndex++;
		} catch (error) {
			console.error('加载单词失败:', error);
		} finally {
			loading = false;
		}
	}
</script>

<div class="mb-12 bg-gray-50 text-zinc-900 antialiased">
	<div class="mx-auto max-w-5xl space-y-8 px-4 py-10">
		<!-- Header -->
		<div class="space-y-3 text-center">
			<h1 class="text-4xl font-bold tracking-tight">学习统计</h1>
			<p class="text-lg text-zinc-500">您的学习进度与成长轨迹</p>

			<div
				class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-700"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
					/>
				</svg>
				<span>展示示例数据，开始学习后将显示您的真实统计</span>
			</div>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
			<!-- Total Words -->
			<div
				class="rounded-2xl border border-white/20 bg-gradient-to-br from-blue-50 to-white p-6 text-center shadow-lg"
			>
				<div
					class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
						/>
					</svg>
				</div>
				<div class="text-3xl font-bold">{vocabCount}</div>
				<div class="mt-1 text-sm font-medium text-zinc-500">总单词数</div>
			</div>

			<!-- Total Reviews -->
			<div
				class="rounded-2xl border border-white/20 bg-gradient-to-br from-green-50 to-white p-6 text-center shadow-lg"
			>
				<div
					class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
				</div>
				<div class="text-3xl font-bold">{studyTimes}</div>
				<div class="mt-1 text-sm font-medium text-zinc-500">复习次数</div>
			</div>

			<!-- Success Rate -->
			<div
				class="rounded-2xl border border-white/20 bg-gradient-to-br from-purple-50 to-white p-6 text-center shadow-lg"
			>
				<div
					class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
						/>
					</svg>
				</div>
				<div class="text-3xl font-bold">92%</div>
				<div class="mt-1 text-sm font-medium text-zinc-500">总体正确率</div>
			</div>

			<!-- Words Need Practice -->
			<div
				class="rounded-2xl border border-white/20 bg-gradient-to-br from-orange-50 to-white p-6 text-center shadow-lg"
			>
				<div
					class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
						/>
					</svg>
				</div>
				<div class="text-3xl font-bold">12</div>
				<div class="mt-1 text-sm font-medium text-zinc-500">需要加强</div>
			</div>
		</div>

		<div class="space-y-4">
			<div class="flex items-center justify-between px-2">
				<h2 class="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-800">
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
						class="h-5 w-5 text-blue-500"
					>
						<path
							d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"
						/>
						<path
							d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"
						/>
						<path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
					</svg>
					全部单词列表
				</h2>
				<span class="text-sm text-slate-500">{vocabCount} 个单词</span>
			</div>

			{#if vocabularies && vocabularies.length > 0}
				<div class="grid gap-6">
					{#each vocabularies as vocabulary (vocabulary.id)}
						<div
							class="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg"
						>
							<div class="bg-slate-50/50 p-6 pb-4">
								<div class="flex items-start justify-between">
									<div class="flex items-center gap-3">
										<h3
											class="text-2xl font-bold text-slate-900 transition-colors group-hover:text-blue-600"
										>
											{vocabulary.word}
										</h3>
                                        <AudioBtn bind:vocab={vocabulary.word} />
										<span
											class="rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600"
											>需加强</span
										>
									</div>
									<span class="text-xs text-slate-400">
										{vocabulary.createdAt.toLocaleDateString(undefined, {
											day: '2-digit',
											month: '2-digit',
											year: 'numeric'
										})}
									</span>
								</div>
								<p class="mt-1 text-lg text-slate-600">{vocabulary.description}</p>
							</div>

							<div
								class="grid grid-cols-2 divide-x divide-slate-100 border-t border-b border-slate-100 md:grid-cols-6"
							>
								<div class="p-3 text-center">
									<div class="mb-1 text-xs text-slate-400">正确率</div>
									<div class="text-lg font-semibold text-red-600">45%</div>
								</div>
								<div class="p-3 text-center">
									<div class="mb-1 text-xs text-slate-400">正确次数</div>
									<div class="text-lg font-semibold text-slate-700">{vocabulary.knowCount}</div>
								</div>
								<div class="p-3 text-center">
									<div class="mb-1 text-xs text-slate-400">忘记次数</div>
									<div class="text-lg font-semibold text-red-600">{vocabulary.forgetCount}</div>
								</div>
								<div class="p-3 text-center">
									<div class="mb-1 text-xs text-slate-400">模糊次数</div>
									<div class="text-lg font-semibold text-orange-500">{vocabulary.vagueCount}</div>
								</div>
								<div class="p-3 text-center">
									<div class="mb-1 text-xs text-slate-400">间隔天数</div>
									<div class="text-lg font-semibold text-slate-700">{vocabulary.interval}天</div>
								</div>
								<div class="p-3 text-center">
									<div class="mb-1 text-xs text-slate-400">难度系数</div>
									<div class="text-lg font-semibold text-slate-700">{vocabulary.easeFactor}</div>
								</div>
							</div>

							<div class="bg-slate-50/30 p-4">
								<div
									class="mb-3 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase"
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
										class="h-3 w-3"
									>
										<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
										<path d="M3 3v5h5" />
										<path d="M12 7v5l4 2" />
									</svg>
									最近复习记录
								</div>
								<div class="space-y-2 text-sm">
									<div
										class="flex items-center justify-between rounded-lg border border-slate-200/60 bg-white p-2"
									>
										<div class="flex items-center gap-3 font-medium text-red-600">
											<div class="rounded-full bg-red-50 p-1 text-red-500">
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
												>
													<circle cx="12" cy="12" r="10" />
													<line x1="12" x2="12" y1="8" y2="12" />
													<line x1="12" x2="12.01" y1="16" y2="16" />
												</svg>
											</div>
											<span>忘记</span>
										</div>
										<span class="font-mono text-slate-400"
											>2024/01/04 <span class="ml-2 opacity-60">11:20</span></span
										>
									</div>
									<div
										class="flex items-center justify-between rounded-lg border border-slate-200/60 bg-white p-2"
									>
										<div class="flex items-center gap-3 font-medium text-orange-600">
											<div class="rounded-full bg-orange-50 p-1 text-orange-500">
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
												>
													<circle cx="12" cy="12" r="10" />
													<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
													<path d="M12 17h.01" />
												</svg>
											</div>
											<span>模糊</span>
										</div>
										<span class="font-mono text-slate-400"
											>2024/01/03 <span class="ml-2 opacity-60">15:45</span></span
										>
									</div>
									<div
										class="flex items-center justify-between rounded-lg border border-slate-200/60 bg-white p-2"
									>
										<div class="flex items-center gap-3 font-medium text-green-600">
											<div class="rounded-full bg-green-50 p-1 text-green-500">
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
												>
													<path d="M20 6L9 17l-5-5" />
												</svg>
											</div>
											<span>记得</span>
										</div>
										<span class="font-mono text-slate-400"
											>2024/01/02 <span class="ml-2 opacity-60">09:10</span></span
										>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-md">
					<svg
						class="mx-auto h-16 w-16 text-zinc-300"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
						/>
					</svg>
					<p class="mt-4 text-lg font-medium text-zinc-600">还没有单词</p>
					<p class="mt-2 text-sm text-zinc-500">开始添加单词来开始学习吧！</p>
				</div>
			{/if}

			<!-- Load More Button / Loading / End State -->
			{#if vocabularies.length > 0}
				<div class="flex justify-center py-8">
					{#if loading}
						<div class="flex items-center gap-3 rounded-full bg-blue-50 px-6 py-3">
							<svg class="h-5 w-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							<span class="text-sm font-medium text-blue-700">加载中...</span>
						</div>
					{:else if hasMore}
						<button
							on:click={loadMoreVocabularies}
							class="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl active:scale-95"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
							<span>加载更多</span>
						</button>
					{:else}
						<p class="text-sm text-zinc-400">— 已经到底啦 —</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
