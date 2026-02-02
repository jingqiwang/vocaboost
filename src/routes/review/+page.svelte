<script lang="ts">
	import { liveQuery } from 'dexie';
	import { Vocabulary } from '$lib/models/Vocabulary';
	import { StudyLog } from '$lib/models/StudyLog';
	import { settings } from '$lib/stores/settings';

	import DashboardCard from '$lib/components/ReviewVocab/DashboardCard.svelte';
	import TestCard from '$lib/components/ReviewVocab/TestCard.svelte';
	import StudyNewCard from '$lib/components/ReviewVocab/StudyNewCard.svelte';
	import AnswerCard from '$lib/components/ReviewVocab/AnswerCard.svelte';
	import StatisticCard from '$lib/components/ReviewVocab/StatisticCard.svelte';

	// ============ 类型定义 ============
	type ReviewStep = 'dashboard' | 'studying-new' | 'reviewing' | 'answering' | 'finished';
	type ReviewResult = 'know' | 'vague' | 'forget';

	interface ReviewResultRecord {
		wordId?: number;
		word: string;
		result?: ReviewResult;
	}

	interface ReviewSession {
		words: Vocabulary[];
		currentIndex: number;
		results: ReviewResultRecord[];
		initialWordIds: Set<number>;
	}

	// ============ 状态管理 ============
	let currentStep = $state<ReviewStep>('dashboard');
	let isTransitioning = $state(false); // 添加过渡状态

	let newWordsSession = $state<ReviewSession>({
		words: [],
		currentIndex: 0,
		results: []
	});

	let reviewSession = $state<ReviewSession>({
		words: [],
		currentIndex: 0,
		results: [],
		initialWordIds: new Set()
	});

	// ============ 数据查询 ============
	const studyLog = liveQuery(() => StudyLog.getLastStudyLog());
	// 与首页「今日新增」一致：只取今日新词
	const newVocabularies = liveQuery(() => Vocabulary.getTodayNewVocabularies());
	const reviewedCount = liveQuery(() => Vocabulary.getTodayReviewedCount());
	const reviewVocabularies = liveQuery(() => Vocabulary.getReviewVocabularies());

	// ============ 派生状态 ============
	const currentVocab = $derived(
		currentStep === 'studying-new'
			? newWordsSession.words[newWordsSession.currentIndex]
			: reviewSession.words[reviewSession.currentIndex]
	);

	// 复习阶段：已记住的唯一词数 / 本轮唯一词数
	const reviewRememberedCount = $derived(
		new Set(
			reviewSession.results
				.filter((r) => r.result === 'know' && r.wordId != null)
				.map((r) => r.wordId!)
		).size
	);
	const reviewTotalUniqueCount = $derived(reviewSession.initialWordIds?.size ?? 0);

	const progressStr = $derived(
		currentStep === 'studying-new'
			? `${newWordsSession.currentIndex + 1} / ${newWordsSession.words.length}`
			: `${reviewRememberedCount} / ${reviewTotalUniqueCount}`
	);

	const progressPercent = $derived(
		currentStep === 'studying-new'
			? newWordsSession.words.length > 0
				? ((newWordsSession.currentIndex + 1) / newWordsSession.words.length) * 100
				: 0
			: reviewTotalUniqueCount > 0
				? (reviewRememberedCount / reviewTotalUniqueCount) * 100
				: 0
	);

	const isLastNewWord = $derived(newWordsSession.currentIndex === newWordsSession.words.length - 1);

	const isLastReviewWord = $derived(reviewSession.currentIndex === reviewSession.words.length - 1);

	// ============ 会话管理辅助函数 ============
	function initializeNewWordsSession(words: Vocabulary[]): void {
		newWordsSession = {
			words: [...words],
			currentIndex: 0,
			results: []
		};
	}

	function initializeReviewSession(words: Vocabulary[]): void {
		reviewSession = {
			words: [...words],
			currentIndex: 0,
			results: [],
			initialWordIds: new Set(words.map((w) => w.id!).filter((id): id is number => id != null))
		};
	}

	function moveToNextNewWord(): void {
		if (!isLastNewWord) {
			newWordsSession.currentIndex++;
		}
	}

	function moveToNextReviewWord(): void {
		if (!isLastReviewWord) {
			reviewSession.currentIndex++;
		}
	}

	function recordNewWordResult(word: Vocabulary): void {
		newWordsSession.results.push({
			wordId: word.id,
			word: word.word
		});
	}

	function recordReviewResult(word: Vocabulary, result: ReviewResult): void {
		reviewSession.results.push({
			wordId: word.id,
			word: word.word,
			result
		});
	}

	// ============ 主要流程控制 ============
	function handleStartReview(): void {
		const dailyLimit = $settings?.dailyReviewCount ?? 10;

		// 优先学习新单词（受每日数量限制）
		if ($newVocabularies?.length > 0) {
			const newList = $newVocabularies.slice(0, dailyLimit);
			initializeNewWordsSession(newList);
			currentStep = 'studying-new';
			return;
		}

		// 没有新单词则进入复习（受每日数量限制）
		if (!$reviewVocabularies?.length) {
			alert('今天没有需要复习的单词！');
			return;
		}

		const reviewList = $reviewVocabularies.slice(0, dailyLimit);
		initializeReviewSession(reviewList);
		currentStep = 'reviewing';
	}

	async function handleNewWordLearned(): Promise<void> {
		if (isTransitioning) return;
		isTransitioning = true;
		
		try {
			const currentWord = newWordsSession.words[newWordsSession.currentIndex];
			currentWord.status = 'learning';
			await currentWord.save();

			recordNewWordResult(currentWord);

			if (!isLastNewWord) {
				moveToNextNewWord();
				// Stay in 'studying-new'
			} else {
				// 新单词学习完成，开始复习（受每日数量限制）
				if ($reviewVocabularies?.length) {
					const dailyLimit = $settings?.dailyReviewCount ?? 10;
					const reviewList = $reviewVocabularies.slice(0, dailyLimit);
					initializeReviewSession(reviewList);
					currentStep = 'reviewing';
				} else {
					currentStep = 'finished';
				}
			}
		} finally {
			isTransitioning = false;
		}
	}

	function handleShowAnswer(): void {
		currentStep = 'answering';
	}

	async function handleAnswerResult(result: ReviewResult): Promise<void> {
		if (isTransitioning) return;
		isTransitioning = true;

		try {
			const currentWord = reviewSession.words[reviewSession.currentIndex];
			if (result === 'know') {
				currentWord.updateNextReview(result);
			} else {
				currentWord.updateReviewStats(result);
			}
			await currentWord.save();

			recordReviewResult(currentWord, result);

			// 如果不是“正确”，则把单词加到队尾重新测试
			if (result !== 'know') {
				reviewSession.words.push(currentWord);
			}

			// 结束条件：所有初始唯一词都已选过 know
			const rememberedIds = new Set(
				reviewSession.results.filter((r) => r.result === 'know' && r.wordId).map((r) => r.wordId!)
			);
			const allRemembered =
				reviewSession.initialWordIds &&
				Array.from(reviewSession.initialWordIds).every((id) => rememberedIds.has(id));

			if (allRemembered) {
				currentStep = 'finished';
			} else {
				moveToNextReviewWord();
				currentStep = 'reviewing';
			}
		} finally {
			isTransitioning = false;
		}
	}

function handleBackToDashboard(): void {
	currentStep = 'dashboard';
}
</script>

<div class="flex mt-4 items-center justify-center bg-gray-100 p-4 pb-28">
	{#if currentStep === 'dashboard'}
		<DashboardCard
			studyLog={$studyLog ?? null}
			reviewedCount={$reviewedCount ?? 0}
			shouldReviewCount={$reviewVocabularies?.length ?? 0}
			newVocabCount={$newVocabularies?.length ?? 0}
			onStartReview={handleStartReview}
		/>
	{:else if currentStep === 'studying-new'}
		<StudyNewCard
			{currentVocab}
			{progressStr}
			progressPercent={() => progressPercent}
			onNewWordLearned={handleNewWordLearned}
		/>
	{:else if currentStep === 'reviewing'}
		<TestCard {currentVocab} {progressStr} progressPercent={() => progressPercent} onShowAnswer={handleShowAnswer} onBack={handleBackToDashboard} />
	{:else if currentStep === 'answering'}
		<AnswerCard
			{currentVocab}
			{progressStr}
			progressPercent={() => progressPercent}
			onSelectResult={handleAnswerResult}
		/>
	{:else if currentStep === 'finished'}
		<StatisticCard {reviewSession} />
	{/if}
</div>
