<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { db } from '$lib/db';
	import { Vocabulary } from '$lib/models/Vocabulary';
	import { liveQuery } from 'dexie';


	// 统计数据
	let totalWords = $state(0);
	let storageUsage = $state('0 KB');


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
				audios: await serializeAudios(),
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

				await db.transaction('rw', db.vocabularies, db.studyLogs, db.vocabReviewLogs, db.audios, async () => {
					if (data.vocabularies) await db.vocabularies.bulkPut(hydrateDates(data.vocabularies));
					if (data.studyLogs) await db.studyLogs.bulkPut(hydrateDates(data.studyLogs));
					if (data.vocabReviewLogs) await db.vocabReviewLogs.bulkPut(hydrateDates(data.vocabReviewLogs));
					if (data.audios) await db.audios.bulkPut(deserializeAudios(data.audios));
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

	function hydrateDates(items: any[]) {
		const dateFields = ['createdAt', 'nextReview', 'reviewedAt'];
		return items.map(item => {
			const newItem = { ...item };
			dateFields.forEach(field => {
				if (newItem[field]) {
					newItem[field] = new Date(newItem[field]);
				}
			});
			return newItem;
		});
	}

	async function serializeAudios() {
		const audios = await db.audios.toArray();
		const serialized = [];
		for (const item of audios) {
			const base64 = await blobToBase64(item.blob);
			serialized.push({
				key: item.key,
				base64,
				type: item.blob.type
			});
		}
		return serialized;
	}

	function deserializeAudios(items: any[]) {
		return items.map(item => ({
			key: item.key,
			blob: base64ToBlob(item.base64, item.type)
		}));
	}

	function blobToBase64(blob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				const res = reader.result as string;
				// Remove the "data:audio/mpeg;base64," prefix
				resolve(res.split(',')[1]);
			};
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	}

	function base64ToBlob(base64: string, type: string): Blob {
		const bin = atob(base64);
		const len = bin.length;
		const arr = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			arr[i] = bin.charCodeAt(i);
		}
		return new Blob([arr], { type });
	}

	import { mergeVocabularies, mergeLogs, mergeAudios, mergeSettings, studyLogKey, reviewLogKey } from '$lib/utils/sync';

    // ... existing stats code ...

	async function handlePushToLocal() {
		try {
            // 1. Get Local Data (including audios)
            const localData = {
				vocabularies: await db.vocabularies.toArray(),
				studyLogs: await db.studyLogs.toArray(),
				vocabReviewLogs: await db.vocabReviewLogs.toArray(),
				audios: await serializeAudios(),
				settings: $settings
            };

            // 2. Get Remote Data (if exists) to merge
            let remoteData: any = {};
			try {
                const res = await fetch('/api/sync');
                if (res.ok) {
                    const json = await res.json();
                    if (json) remoteData = json;
                }
            } catch (e) {
                // Ignore remote read error, treat as empty
                console.warn('Could not read remote data for merge, assuming empty.', e);
            }

            // 3. Hydrate Dates for Remote Data (if any)
            if (remoteData.vocabularies) remoteData.vocabularies = hydrateDates(remoteData.vocabularies);
            if (remoteData.studyLogs) remoteData.studyLogs = hydrateDates(remoteData.studyLogs);
            if (remoteData.vocabReviewLogs) remoteData.vocabReviewLogs = hydrateDates(remoteData.vocabReviewLogs);

            // 4. Merge (including audios)
            const mergedVocabularies = mergeVocabularies(localData.vocabularies, remoteData.vocabularies || []);
            const mergedStudyLogs = mergeLogs(localData.studyLogs, remoteData.studyLogs || [], studyLogKey);
            const mergedReviewLogs = mergeLogs(localData.vocabReviewLogs, remoteData.vocabReviewLogs || [], reviewLogKey);
            const mergedAudios = mergeAudios(localData.audios, remoteData.audios || []);
            const mergedSettings = mergeSettings(localData.settings, remoteData.settings || {});

            // 5. Construct Payload (including audios)
			const payload = {
				vocabularies: mergedVocabularies,
				studyLogs: mergedStudyLogs,
				vocabReviewLogs: mergedReviewLogs,
				audios: mergedAudios,
				settings: mergedSettings,
				exportedAt: new Date().toISOString()
			};

            // 6. Push Merged Data to Remote
			const response = await fetch('/api/sync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) throw new Error('同步失败');
			
			const result = await response.json();

            // 7. Update Local DB with Merged Data (to stay in sync)
            await db.transaction('rw', db.vocabularies, db.studyLogs, db.vocabReviewLogs, db.audios, async () => {
                await db.vocabularies.bulkPut(mergedVocabularies);
                await db.studyLogs.bulkPut(mergedStudyLogs);
                await db.vocabReviewLogs.bulkPut(mergedReviewLogs);
                await db.audios.bulkPut(deserializeAudios(mergedAudios));
            });
            
            if (mergedSettings) settings.set(mergedSettings);
            await updateStats();

			alert(`同步成功 (已合并)！数据已保存至：\n${result.path}`);
		} catch (e) {
			console.error(e);
			alert('向本地推送数据失败');
		}
	}

	async function handlePullFromLocal() {
		if (!confirm('确定要从本地文件拉取数据并合并吗？')) return;

		try {
            // 1. Fetch Remote
			const response = await fetch('/api/sync');
			if (!response.ok) throw new Error('读取同步文件失败');
			
			const remoteData = await response.json();
			if (!remoteData) {
				alert('未找到同步文件，请先执行“推送到本地文件”');
				return;
			}

            // 2. Get Local Data (including audios)
            const localData = {
				vocabularies: await db.vocabularies.toArray(),
				studyLogs: await db.studyLogs.toArray(),
				vocabReviewLogs: await db.vocabReviewLogs.toArray(),
				audios: await serializeAudios(),
				settings: $settings
            };

            // 3. Hydrate Remote Dates
            if (remoteData.vocabularies) remoteData.vocabularies = hydrateDates(remoteData.vocabularies);
            if (remoteData.studyLogs) remoteData.studyLogs = hydrateDates(remoteData.studyLogs);
            if (remoteData.vocabReviewLogs) remoteData.vocabReviewLogs = hydrateDates(remoteData.vocabReviewLogs);

            // 4. Merge (including audios)
            const mergedVocabularies = mergeVocabularies(localData.vocabularies, remoteData.vocabularies || []);
            const mergedStudyLogs = mergeLogs(localData.studyLogs, remoteData.studyLogs || [], studyLogKey);
            const mergedReviewLogs = mergeLogs(localData.vocabReviewLogs, remoteData.vocabReviewLogs || [], reviewLogKey);
            const mergedAudios = mergeAudios(localData.audios, remoteData.audios || []);
            const mergedSettings = mergeSettings(localData.settings, remoteData.settings || {});

            // 5. Update Local DB Only
			await db.transaction('rw', db.vocabularies, db.studyLogs, db.vocabReviewLogs, db.audios, async () => {
				await db.vocabularies.bulkPut(mergedVocabularies);
				await db.studyLogs.bulkPut(mergedStudyLogs);
				await db.vocabReviewLogs.bulkPut(mergedReviewLogs);
				await db.audios.bulkPut(deserializeAudios(mergedAudios));
			});

			if (mergedSettings) settings.set(mergedSettings);

			await updateStats();
			alert('同步拉取并合并成功');
		} catch (e) {
			console.error(e);
			alert('从本地拉取数据失败');
		}
	}
</script>

<div class="min-h-screen" style="background-color: var(--color-bg-app); color: var(--color-text-primary)">
	<div class="mx-auto max-w-4xl space-y-8 px-4 py-6 pb-32">
		<!-- Header -->
		<div class="space-y-3 text-center">
			<h1 class="eudict-title" style="color: var(--color-primary)">设置</h1>
			<p class="eudict-caption">个性化您的学习体验</p>
		</div>

		<div class="space-y-8">


			<!-- Data Management Card -->
			<div class="eudict-card space-y-8">
				<div class="pb-6">
					<h2 class="eudict-subtitle flex items-center gap-3" style="color: var(--color-primary)">
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
					<div class="space-y-2 rounded-xl border border-transparent p-6" style="background-color: var(--color-primary-light)">
						<div class="text-3xl font-medium" id="total-words" style="color: var(--color-primary)">{totalWords}</div>
						<div class="eudict-caption">单词总数</div>
					</div>
					<div class="space-y-2 rounded-xl border border-transparent p-6" style="background-color: var(--color-primary-light)">
						<div class="text-3xl font-medium" id="storage-size" style="color: var(--color-primary)">{storageUsage}</div>
						<div class="eudict-caption">存储占用</div>
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

				<!-- Local File Sync -->
				<div class="space-y-4">
					<div class="space-y-2">
						<h3 class="text-lg font-medium">本地文件同步 (多设备)</h3>
						<p class="text-sm text-zinc-500">
							将数据保存在固定目录：<code class="rounded bg-zinc-100 px-1">~/vocaboost_sync/data.json</code>
						</p>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<button
							onclick={handlePushToLocal}
							class="flex h-12 items-center justify-center gap-2 rounded-md bg-blue-600 text-sm font-medium text-white transition-colors hover:bg-blue-700"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V10" />
							</svg>
							推送到本地
						</button>
						<button
							onclick={handlePullFromLocal}
							class="flex h-12 items-center justify-center gap-2 rounded-md border border-blue-600 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
							</svg>
							从本地拉取
						</button>
					</div>
				</div>

				<hr class="border-zinc-100" />

				<!-- Danger Zone -->
				<div class="space-y-4">

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
			<div class="eudict-card">
				<div class="pb-6">
					<h2 class="eudict-subtitle flex items-center gap-3" style="color: var(--color-primary)">
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
