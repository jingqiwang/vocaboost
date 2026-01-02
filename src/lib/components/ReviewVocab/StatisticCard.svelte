<script lang="ts">
	import { StudyLog } from '$lib/models/StudyLog';
	let { reviewSession } = $props();

	// 定义类型
	type ReviewResult = 'know' | 'vague' | 'forget';

	interface ReviewResultRecord {
		wordId?: number;
		word: string;
		result?: ReviewResult;
	}

	// 统计各种结果的数量
	const statistics = $derived(() => {
		const stats = {
			know: 0,
			vague: 0,
			forget: 0,
			total: reviewSession.results.length
		};

		reviewSession.results.forEach((result: ReviewResultRecord) => {
			if (result.result === 'know') stats.know++;
			else if (result.result === 'vague') stats.vague++;
			else if (result.result === 'forget') stats.forget++;
		});

		return stats;
	});

	// 计算掌握率
	const masteryRate = $derived(
		statistics().total > 0 ? Math.round((statistics().know / statistics().total) * 100) : 0
	);

	$effect(() => {
		StudyLog.create({
			knowCount: statistics().know,
			vagueCount: statistics().vague,
			forgetCount: statistics().forget,
			accuracyRate: masteryRate
		});
	});

	async function handleRestart() {
		window.location.reload();
	}
</script>

<div class="mx-auto w-full max-w-md">
	<div class="flex min-h-[500px] flex-col items-center justify-center">
		<div class="w-full overflow-hidden rounded-[2rem] bg-white shadow-2xl">
			<div class="space-y-10 p-12 text-center">
				<!-- 成功图标 -->
				<div class="relative">
					<div class="absolute inset-0 rounded-full bg-green-500/20 blur-3xl"></div>
					<div
						class="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="56"
							height="56"
							viewBox="0 0 24 24"
							fill="none"
							stroke="white"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M20 6 9 17 4 12" />
						</svg>
					</div>
				</div>

				<div class="space-y-3">
					<h2 class="text-3xl font-bold tracking-tight text-gray-900">打卡完成!</h2>
					<p class="font-medium text-gray-500">
						{#if masteryRate >= 80}
							太棒了！掌握率达到 {masteryRate}%
						{:else if masteryRate >= 60}
							不错！继续保持，掌握率 {masteryRate}%
						{:else}
							今天也是进步的一天
						{/if}
					</p>
				</div>

				<!-- 结果统计 -->
				<div class="grid w-full grid-cols-3 gap-4">
					<div
						class="flex flex-col items-center rounded-2xl border border-green-100 bg-green-50 p-4"
					>
						<span class="text-2xl font-bold text-green-600">{statistics().know}</span>
						<span class="mt-1 text-xs font-medium text-green-600/60">掌握</span>
					</div>
					<div
						class="flex flex-col items-center rounded-2xl border border-orange-100 bg-orange-50 p-4"
					>
						<span class="text-2xl font-bold text-orange-500">{statistics().vague}</span>
						<span class="mt-1 text-xs font-medium text-orange-500/60">模糊</span>
					</div>
					<div class="flex flex-col items-center rounded-2xl border border-red-100 bg-red-50 p-4">
						<span class="text-2xl font-bold text-red-500">{statistics().forget}</span>
						<span class="mt-1 text-xs font-medium text-red-500/60">陌生</span>
					</div>
				</div>

				<!-- 总复习数 -->
				{#if statistics().total > 0}
					<div class="rounded-xl bg-gray-50 p-4">
						<p class="text-sm text-gray-600">
							本次共复习 <span class="font-bold text-gray-900">{statistics().total}</span> 个单词
						</p>
					</div>
				{/if}

				{#if statistics().forget > 0}
					<!-- 再来一轮按钮 -->
					<button
						onclick={handleRestart}
						class="flex h-14 w-full items-center justify-center rounded-xl border-2 border-gray-200 text-lg font-medium text-gray-700 transition-colors hover:bg-gray-50 active:scale-[0.98]"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="mr-2"
						>
							<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
							<path d="M3 3v5h5" />
						</svg>
						再来一轮
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
