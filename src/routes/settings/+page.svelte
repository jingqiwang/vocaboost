<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { db } from '$lib/db';
	import { Vocabulary } from '$lib/models/Vocabulary';
	import { liveQuery } from 'dexie';

	// 绑定设置
	let dailyReviewCount = $state($settings.dailyReviewCount);
	let reminderTime = $state($settings.reminderTime);
	let autoCleanup = $state($settings.autoCleanup);

	// 统计数据
	let totalWords = $state(0);
	let storageUsage = $state('0 KB');

	// 监听 store 变化，初始化本地状态
	settings.subscribe((v) => {
		dailyReviewCount = v.dailyReviewCount;
		reminderTime = v.reminderTime;
		autoCleanup = v.autoCleanup;
	});

	onMount(async () => {
		await updateStats();
	});

	async function updateStats() {
		totalWords = await Vocabulary.count();
		// 估算存储大小 (粗略计算)
		const vocabularies = await db.vocabularies.toArray();
		const logs = await db.studyLogs.toArray();
		const reviews = await db.vocabReviewLogs.toArray();
		const audios = await db.audios.toArray();

		const totalSize =
			JSON.stringify(vocabularies).length +
			JSON.stringify(logs).length +
			JSON.stringify(reviews).length +
			audios.reduce((acc: number, curr: any) => acc + curr.blob.size, 0); // 音频是大头

		if (totalSize < 1024) {
			storageUsage = `${totalSize} B`;
		} else if (totalSize < 1024 * 1024) {
			storageUsage = `${(totalSize / 1024).toFixed(2)} KB`;
		} else {
			storageUsage = `${(totalSize / 1024 / 1024).toFixed(2)} MB`;
		}
	}

	function handleSaveSettings() {
		settings.set({
			dailyReviewCount,
			reminderTime,
			autoCleanup
		});
		alert('设置已保存');
	}

	async function handleResetSettings() {
		if (!confirm('确定要恢复默认设置吗？')) return;
		settings.reset();
		alert('已恢复默认设置');
	}

	async function handleClearAllData() {
		if (!confirm('警告：此操作将永久删除所有学习记录和单词数据，无法恢复！确定要继续吗？')) return;
		
		try {
			await db.delete();
			await db.open(); // 重新打开会重建表结构
			await updateStats();
			alert('所有数据已清除');
			window.location.reload();
		} catch (e) {
			console.error(e);
			alert('清除数据失败');
		}
	}

	async function handleExportData() {
		try {
			const data = {
				vocabularies: await db.vocabularies.toArray(),
				studyLogs: await db.studyLogs.toArray(),
				vocabReviewLogs: await db.vocabReviewLogs.toArray(),
				// 音频通常太大，不建议导出到 JSON，或者需要转 base64
				settings: $settings,
				exportedAt: new Date().toISOString()
			};

			const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `vocaboost_backup_${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (e) {
			console.error(e);
			alert('导出失败');
		}
	}

	async function handleImportData() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			try {
				const text = await file.text();
				const data = JSON.parse(text);

				if (!confirm('导入数据将覆盖现有部分数据，确定继续吗？')) return;

				await db.transaction('rw', db.vocabularies, db.studyLogs, db.vocabReviewLogs, async () => {
					if (data.vocabularies) await db.vocabularies.bulkPut(data.vocabularies);
					if (data.studyLogs) await db.studyLogs.bulkPut(data.studyLogs);
					if (data.vocabReviewLogs) await db.vocabReviewLogs.bulkPut(data.vocabReviewLogs);
				});

				if (data.settings) {
					settings.set(data.settings);
				}

				await updateStats();
				alert('数据导入成功');
			} catch (e) {
				console.error(e);
				alert('导入失败：文件格式错误或数据损坏');
			}
		};

		input.click();
	}
</script>

<div class="min-h-screen bg-white text-zinc-950">
	<div class="mx-auto max-w-4xl space-y-8 px-4 py-6">
		<!-- Header -->
		<div class="space-y-3 text-center">
			<h1 class="text-4xl font-bold tracking-tight">设置</h1>
			<p class="text-lg text-zinc-500">个性化您的学习体验</p>
		</div>

		<div class="space-y-8">
			<!-- Learning Settings Card -->
			<div class="space-y-8 rounded-xl border-0 bg-white p-6 shadow-lg">
				<div class="pb-6">
					<h2 class="flex items-center gap-3 text-2xl font-semibold tracking-tight">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<circle cx="12" cy="12" r="10" stroke-width="2" />
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6l4 2"
							/>
						</svg>
						学习设置
					</h2>
				</div>

				<div class="space-y-8">
					<!-- Daily Review Count -->
					<div class="space-y-4">
						<label class="text-lg font-medium">每日复习单词数量</label>
						<div class="space-y-4">
							<input
								type="range"
								min="5"
								max="50"
								step="5"
								bind:value={dailyReviewCount}
								id="word-count-slider"
								class="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-zinc-900"
							/>
							<div class="flex justify-between text-zinc-500">
								<span>5 个</span>
								<span class="text-xl font-medium text-zinc-950" id="word-count-display"
									>{dailyReviewCount} 个</span
								>
								<span>50 个</span>
							</div>
						</div>
					</div>

					<!-- Reminder Time -->
					<div class="space-y-4">
						<label for="reminder-time" class="text-lg font-medium">每日提醒时间</label>
						<input
							type="time"
							id="reminder-time"
							bind:value={reminderTime}
							class="flex h-12 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-lg transition-colors focus-visible:ring-1 focus-visible:ring-zinc-950 focus-visible:outline-none"
						/>
					</div>

					<!-- Auto Cleanup Toggle -->
					<div class="flex items-center justify-between rounded-xl bg-zinc-100/50 p-6">
						<div class="space-y-2">
							<label class="text-lg font-medium">自动清理已掌握的单词</label>
							<p class="text-sm text-zinc-500">
								自动移除连续通过 <span id="cleanup-days-text">30</span> 天的单词
							</p>
						</div>
						<label class="relative inline-flex cursor-pointer items-center">
							<input
								type="checkbox"
								class="peer sr-only"
								bind:checked={autoCleanup}
								id="auto-cleanup-toggle"
							/>
							<div
								class="peer h-6 w-11 rounded-full bg-zinc-200 peer-checked:bg-zinc-900 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"
							></div>
						</label>
					</div>

					<!-- Save Button -->
					<button
						onclick={handleSaveSettings}
						class="flex h-14 w-full items-center justify-center gap-3 rounded-md bg-zinc-900 text-lg font-medium text-zinc-50 transition-colors hover:bg-zinc-900/90"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						保存设置
					</button>
				</div>
			</div>

			<!-- Data Management Card -->
			<div class="space-y-8 rounded-xl border-0 bg-white p-6 shadow-lg">
				<div class="pb-6">
					<h2 class="flex items-center gap-3 text-2xl font-semibold tracking-tight">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
						数据管理
					</h2>
				</div>

				<!-- Stats Grid -->
				<div class="grid grid-cols-2 gap-6 text-center">
					<div class="space-y-2 rounded-xl border border-transparent bg-zinc-100/50 p-6">
						<div class="text-3xl font-medium" id="total-words">{totalWords}</div>
						<div class="text-zinc-500">单词总数</div>
					</div>
					<div class="space-y-2 rounded-xl border border-transparent bg-zinc-100/50 p-6">
						<div class="text-3xl font-medium" id="storage-size">{storageUsage}</div>
						<div class="text-zinc-500">存储占用</div>
					</div>
				</div>

				<hr class="border-zinc-100" />

				<!-- Backup Buttons -->
				<div class="space-y-4">
					<button
						onclick={handleExportData}
						class="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-zinc-200 bg-white text-lg font-medium text-zinc-950 transition-colors hover:bg-zinc-100"
					>
						<svg
							class="h-5 w-5 text-zinc-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
						导出数据备份
					</button>
					<button
						onclick={handleImportData}
						class="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-zinc-200 bg-white text-lg font-medium text-zinc-950 transition-colors hover:bg-zinc-100"
					>
						<svg
							class="h-5 w-5 text-zinc-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
							/>
						</svg>
						导入数据备份
					</button>
				</div>

				<hr class="border-zinc-100" />

				<!-- Danger Zone -->
				<div class="space-y-4">
					<button
						onclick={handleResetSettings}
						class="h-12 w-full rounded-md border border-zinc-200 bg-white text-lg font-medium text-zinc-950 transition-colors hover:bg-zinc-100"
					>
						重置设置
					</button>
					<button
						onclick={handleClearAllData}
						class="flex h-12 w-full items-center justify-center gap-3 rounded-md bg-red-600 text-lg font-medium text-white transition-colors hover:bg-red-600/90"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
						清除所有数据
					</button>
				</div>
			</div>

			<!-- Usage Tips Card -->
			<div class="rounded-xl border-0 bg-white p-6 shadow-lg">
				<div class="pb-6">
					<h2 class="flex items-center gap-3 text-2xl font-semibold tracking-tight">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
						使用提示
					</h2>
				</div>
				<div class="space-y-4 text-zinc-500">
					<div class="flex items-start gap-3">
						<span class="text-xl">📅</span>
						<span>建议每天固定时间复习，养成良好的学习习惯</span>
					</div>
					<div class="flex items-start gap-3">
						<span class="text-xl">🔊</span>
						<span>复习时请在安静的环境中，确保能清楚听到语音</span>
					</div>
					<div class="flex items-start gap-3">
						<span class="text-xl">💾</span>
						<span>定期备份数据，避免意外丢失学习记录</span>
					</div>
					<div class="flex items-start gap-3">
						<span class="text-xl">📈</span>
						<span>根据个人情况调整每日复习数量，循序渐进</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
