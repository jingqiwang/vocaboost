<script lang="ts">
	import { onMount } from 'svelte';
	import { Vocabulary } from '$lib/models/Vocabulary';
	import { VocabReviewLog } from '$lib/models/VocabReviewLog';
	import AudioBtn from '$lib/components/AddVocab/AudioBtn.svelte';

	let vocabCount = $state(0);
	let studyTimes = $state(0);
	let accuracyRate = $state(0);
	let needPracticeCount = $state(0);
	let reviewLogs = $state<VocabReviewLog[]>([]);

	let vocabularies = $state<Vocabulary[]>([]);
	let pageIndex = 1;
	let pageSize = 20;
	let loading = $state(false);
	let hasMore = $state(true);

	// Search & Sort State
	let searchQuery = $state('');
	let sortBy = $state('createdAt');
	let sortOrder = $state<'asc' | 'desc'>('desc');
	let searchTimer: NodeJS.Timeout;

	let chartCanvas: HTMLCanvasElement;
	let chartInstance: any;
	let Chart: any;

	onMount(async () => {
		const module = await import('chart.js/auto');
		Chart = module.default;
		
		await updateStats();
		initChart();
		await loadVocabularies(true);
	});

	async function updateStats() {
		vocabCount = await Vocabulary.count();
		studyTimes = await VocabReviewLog.count();

		const knowCount = await VocabReviewLog.countByResult('know');
		const totalReviews = studyTimes;
		accuracyRate = totalReviews > 0 ? Math.round((knowCount / totalReviews) * 100) : 0;

		needPracticeCount = await Vocabulary.countByStatus('learning');
		reviewLogs = await VocabReviewLog.getRecentLogs(7);
	}

	async function loadVocabularies(reset = false) {
		if (loading || (!hasMore && !reset)) return;
		
		if (reset) {
			pageIndex = 1;
			vocabularies = [];
			hasMore = true;
		}

		loading = true;
		try {
			const newVocabs = await Vocabulary.search(
				searchQuery,
				sortBy,
				sortOrder,
				pageIndex,
				pageSize
			);

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

	function handleSearchInput() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			loadVocabularies(true);
		}, 300);
	}

	function handleSortChange() {
		loadVocabularies(true);
	}

	async function handleDelete(vocab: Vocabulary) {
		if (!confirm(`确定要删除单词 "${vocab.word}" 吗？此操作无法撤销。`)) return;
		
		try {
			await vocab.delete();
			// Remove from list
			vocabularies = vocabularies.filter(v => v.id !== vocab.id);
			// Update stats
			vocabCount--; 
			// Note: We might want to refresh full stats, but decrementing count is instant feedback
		} catch (error) {
			alert('删除失败: ' + (error instanceof Error ? error.message : String(error)));
		}
	}

	async function handleEdit(vocab: Vocabulary) {
		const newDescription = prompt('修改释义:', vocab.description);
		if (newDescription === null || newDescription === vocab.description) return;
		
		if (!newDescription.trim()) {
			alert('释义不能为空');
			return;
		}

		try {
			vocab.description = newDescription;
			await vocab.save();
			// Force UI update (Svelte 5 state proxy should handle this if vocab is part of state)
			// But since vocabularies is an array of objects, modifying a property should trigger reaction if $state is deep or we reassign.
			// Let's reassign to be safe or rely on fine-grained reactivity.
			// vocab is a reference to an object in the array.
		} catch (error) {
			alert('更新失败: ' + (error instanceof Error ? error.message : String(error)));
		}
	}

	// Chart Data Preparation
	const chartData = $derived(() => {
		const days = 7;
		const labels = [];
		const values = [];
		const now = new Date();
		
		for (let i = days - 1; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);
			const dateStr = date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
			labels.push(dateStr);
			
			// Find logs for this day
			const logsForDay = reviewLogs.filter(l => {
				const logDate = new Date(l.createdAt);
				return logDate.getDate() === date.getDate() && 
                       logDate.getMonth() === date.getMonth() &&
                       logDate.getFullYear() === date.getFullYear();
			});

			values.push(logsForDay.length);
		}
		return { labels, values };
	});

	function initChart() {
		if (!chartCanvas) return;

		// Destroy existing chart if any
		if (chartInstance) {
			chartInstance.destroy();
		}

		const ctx = chartCanvas.getContext('2d');
		if (!ctx) return;

		const { labels, values } = chartData();

		chartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: labels,
				datasets: [{
					label: '每日复习次数',
					data: values,
					backgroundColor: 'rgba(59, 130, 246, 0.5)',
					borderColor: 'rgb(59, 130, 246)',
					borderWidth: 1,
					borderRadius: 4,
					barPercentage: 0.6
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						backgroundColor: 'rgba(17, 24, 39, 0.9)',
						padding: 12,
						titleFont: {
							size: 13
						},
						bodyFont: {
							size: 13
						},
						displayColors: false,
						callbacks: {
							label: function(context: any) {
								return `${context.parsed.y} 次复习`;
							}
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						border: {
							display: false
						},
						grid: {
							color: 'rgba(0, 0, 0, 0.05)'
						},
						ticks: {
							stepSize: 1,
							font: {
								size: 11
							}
						}
					},
					x: {
						grid: {
							display: false
						},
						ticks: {
							font: {
								size: 11
							}
						}
					}
				}
			}
		});
	}

	// Update chart when data changes
	$effect(() => {
		if (chartInstance && reviewLogs.length > 0) {
			const { labels, values } = chartData();
			chartInstance.data.labels = labels;
			chartInstance.data.datasets[0].data = values;
			chartInstance.update();
		}
	});
	function calculateAccuracy(vocabulary: Vocabulary) {
		const total = vocabulary.knowCount + vocabulary.forgetCount + vocabulary.vagueCount;
		return total > 0 ? Math.round((vocabulary.knowCount / total) * 100) : 0;
	}

	function getReviewStatusInfo(status: string) {
		switch (status) {
			case 'know':
				return { text: '记得', color: 'text-green-600', bg: 'bg-green-50', iconColor: 'text-green-500' };
			case 'vague':
				return { text: '模糊', color: 'text-orange-600', bg: 'bg-orange-50', iconColor: 'text-orange-500' };
			case 'forget':
				return { text: '忘记', color: 'text-red-600', bg: 'bg-red-50', iconColor: 'text-red-500' };
			default:
				return { text: '未知', color: 'text-gray-600', bg: 'bg-gray-50', iconColor: 'text-gray-500' };
		}
	}
</script>

<div class="mb-12 bg-gray-50 text-zinc-900 antialiased">
	<div class="mx-auto max-w-5xl space-y-8 px-4 py-10">
		<!-- Header -->
		<div class="space-y-3 text-center">
			<h1 class="text-4xl font-bold tracking-tight">学习统计</h1>
			<p class="text-lg text-zinc-500">您的学习进度与成长轨迹</p>
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
							d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
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
				<div class="text-3xl font-bold">{accuracyRate}%</div>
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
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<div class="text-3xl font-bold">{needPracticeCount}</div>
				<div class="mt-1 text-sm font-medium text-zinc-500">需要加强</div>
			</div>
		</div>

		<!-- Learning Trend Chart -->
		<div class="rounded-2xl border border-white/20 bg-white p-6 shadow-lg">
			<h2 class="mb-6 text-xl font-bold text-gray-800">最近7天学习趋势</h2>
			<div class="relative h-64 w-full">
				<canvas bind:this={chartCanvas}></canvas>
			</div>
		</div>

		<div class="space-y-4">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
				<div class="flex items-center gap-2">
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
						单词列表
					</h2>
					<span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{vocabCount}</span>
				</div>

				<div class="flex flex-1 flex-col gap-2 sm:max-w-md sm:flex-row">
					<div class="relative flex-1">
						<svg
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						<input
							type="text"
							placeholder="搜索单词..."
							bind:value={searchQuery}
							oninput={handleSearchInput}
							class="w-full rounded-lg border-0 bg-white py-2 pl-10 pr-4 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<select
						bind:value={sortBy}
						onchange={handleSortChange}
						class="rounded-lg border-0 bg-white py-2 pl-3 pr-8 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500"
					>
						<option value="createdAt">添加时间</option>
						<option value="nextReview">复习时间</option>
						<option value="knowCount">熟练度</option>
						<option value="forgetCount">错误数</option>
					</select>
					<button
						class="rounded-lg border-0 bg-white p-2 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-700"
						onclick={() => {
							sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
							handleSortChange();
						}}
						title={sortOrder === 'asc' ? '升序' : '降序'}
					>
						<svg
							class="h-5 w-5 transition-transform duration-200 {sortOrder === 'asc' ? 'rotate-180' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
						</svg>
					</button>
				</div>
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
										{#if calculateAccuracy(vocabulary) < 70 && (vocabulary.knowCount + vocabulary.forgetCount + vocabulary.vagueCount) > 0}
											<span
												class="rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600"
												>需加强</span
											>
										{/if}
									</div>
									<div class="flex items-center gap-4">
										<span class="text-xs text-slate-400">
											{vocabulary.createdAt.toLocaleDateString(undefined, {
												day: '2-digit',
												month: '2-digit',
												year: 'numeric'
											})}
										</span>
										<div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
											<button
												onclick={() => handleEdit(vocabulary)}
												class="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
												title="编辑释义"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
												</svg>
											</button>
											<button
												onclick={() => handleDelete(vocabulary)}
												class="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
												title="删除单词"
											>
												<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</button>
										</div>
									</div>
								</div>
								<p class="mt-1 text-lg text-slate-600">{vocabulary.description}</p>
							</div>

							<div
								class="grid grid-cols-2 divide-x divide-slate-100 border-t border-b border-slate-100 md:grid-cols-6"
							>
								<div class="p-3 text-center">
									<div class="mb-1 text-xs text-slate-400">正确率</div>
									<div class="text-lg font-semibold {calculateAccuracy(vocabulary) >= 70 ? 'text-green-600' : 'text-red-600'}">
										{calculateAccuracy(vocabulary)}%
									</div>
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
									{#await VocabReviewLog.getLogsByWord(vocabulary.word, 3)}
										<div class="text-center text-xs text-gray-400 py-2">加载记录中...</div>
									{:then logs}
										{#if logs.length > 0}
											{#each logs as log}
												{@const statusInfo = getReviewStatusInfo(log.reviewStatus)}
												<div
													class="flex items-center justify-between rounded-lg border border-slate-200/60 bg-white p-2"
												>
													<div class="flex items-center gap-3 font-medium {statusInfo.color}">
														<div class="rounded-full {statusInfo.bg} p-1 {statusInfo.iconColor}">
															{#if log.reviewStatus === 'know'}
																<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
																	<path d="M20 6L9 17l-5-5" />
																</svg>
															{:else if log.reviewStatus === 'forget'}
																<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
																	<circle cx="12" cy="12" r="10" />
																	<line x1="12" x2="12" y1="8" y2="12" />
																	<line x1="12" x2="12.01" y1="16" y2="16" />
																</svg>
															{:else}
																<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
																	<circle cx="12" cy="12" r="10" />
																	<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
																	<path d="M12 17h.01" />
																</svg>
															{/if}
														</div>
														<span>{statusInfo.text}</span>
													</div>
													<span class="font-mono text-slate-400">
														{log.createdAt.toLocaleDateString(undefined, {
															year: 'numeric',
															month: '2-digit',
															day: '2-digit'
														})} 
														<span class="ml-2 opacity-60">
															{log.createdAt.toLocaleTimeString(undefined, {
																hour: '2-digit',
																minute: '2-digit'
															})}
														</span>
													</span>
												</div>
											{/each}
										{:else}
											<div class="text-center text-xs text-gray-400 py-2">暂无复习记录</div>
										{/if}
									{/await}
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
							onclick={() => loadVocabularies(false)}
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
