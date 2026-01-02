<script lang="ts">
	let { reviewedCount, shouldReviewCount, newVocabCount, onStartReview } = $props();
</script>

<!-- 主卡片容器 -->
<div class="w-full max-w-md overflow-hidden rounded-[2rem] border-0 bg-white shadow-xl">
	<!-- 头部渐变区域 -->
	<div
		class="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600"
	>
		<div class="absolute inset-0 bg-black/10"></div>

		<div class="relative z-10 space-y-2 text-center text-white">
			<h1 class="text-5xl font-bold tracking-tight">{shouldReviewCount}</h1>
			<p class="font-medium tracking-wide text-blue-100">今日待复习</p>
		</div>

		<!-- 装饰圆圈 -->
		<div class="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
		<div class="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
	</div>

	<!-- 内容区域 -->
	<div class="space-y-8 p-8">
		<!-- 2x2 数据统计网格 -->
		<div class="grid grid-cols-2 gap-4">
			<!-- 统计项: 复习进度 -->
			<div class="flex flex-col gap-1 rounded-2xl border border-gray-100 bg-gray-50 p-4">
				<div class="mb-1 flex items-center gap-2 text-gray-500">
					<!-- Target Icon -->
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
						><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle
							cx="12"
							cy="12"
							r="2"
						/></svg
					>
					<span class="text-xs font-medium">复习进度</span>
				</div>
				<div class="text-md font-bold text-gray-900">
					<p class="text-blue-600">{newVocabCount} <span class="text-sm font-norma">新单词</span></p>
					<p class="text-green-600">
						{reviewedCount} / {shouldReviewCount} <span class="text-sm font-normal">已复习</span>
					</p>
				</div>
			</div>

			<!-- 统计项: 连续打卡 -->
			<div class="flex flex-col gap-1 rounded-2xl border border-gray-100 bg-gray-50 p-4">
				<div class="mb-1 flex items-center gap-2 text-orange-500">
					<!-- Zap Icon (Filled) -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="currentColor"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="text-orange-500"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg
					>
					<span class="text-xs font-medium text-gray-500">连续打卡</span>
				</div>
				<div class="text-2xl font-bold text-gray-900">
					5 <span class="text-sm font-normal text-gray-500">天</span>
				</div>
			</div>

			<!-- 统计项: 正确率 -->
			<div class="flex flex-col gap-1 rounded-2xl border border-gray-100 bg-gray-50 p-4">
				<div class="mb-1 flex items-center gap-2 text-green-500">
					<!-- Check Icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg
					>
					<span class="text-xs font-medium text-gray-500">上次正确率</span>
				</div>
				<div class="text-2xl font-bold text-green-600">
					92<span class="text-sm">%</span>
				</div>
			</div>

			<!-- 统计项: 上次学习 -->
			<div class="flex flex-col gap-1 rounded-2xl border border-gray-100 bg-gray-50 p-4">
				<div class="mb-1 flex items-center gap-2 text-blue-500">
					<!-- Clock Icon -->
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
						><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg
					>
					<span class="text-xs font-medium text-gray-500">上次学习</span>
				</div>
				<div class="text-2xl font-bold text-gray-900">10:30</div>
			</div>
		</div>

		<!-- 开始按钮 -->
		<button
			class="group flex h-16 w-full items-center justify-center rounded-2xl bg-blue-600 text-xl font-semibold text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-[0.98]"
			onclick={onStartReview}
			disabled={shouldReviewCount === 0}
		>
			<!-- Play Icon -->
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="currentColor"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="mr-2 transition-transform group-hover:scale-110"
				><polygon points="5 3 19 12 5 21 5 3" /></svg
			>
			开始今日复习
		</button>
	</div>
</div>
