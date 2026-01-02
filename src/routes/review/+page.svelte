<script lang="ts">
	import { liveQuery } from 'dexie';
	import { Vocabulary } from '$lib/models/Vocabulary';

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
	}

	// ============ 状态管理 ============
	let currentStep = $state<ReviewStep>('dashboard');

	let newWordsSession = $state<ReviewSession>({
		words: [],
		currentIndex: 0,
		results: []
	});

	let reviewSession = $state<ReviewSession>({
		words: [],
		currentIndex: 0,
		results: []
	});

	// ============ 数据查询 ============
	const newVocabularies = liveQuery(() => Vocabulary.getNewVocabularies());
	const reviewedCount = liveQuery(() => Vocabulary.getTodayReviewedCount());
	const reviewVocabularies = liveQuery(() => Vocabulary.getReviewVocabularies());

	// ============ 派生状态 ============
	const currentVocab = $derived(
		currentStep === 'studying-new'
			? newWordsSession.words[newWordsSession.currentIndex]
			: reviewSession.words[reviewSession.currentIndex]
	);

	const progressStr = $derived(
		currentStep === 'studying-new'
			? `${newWordsSession.currentIndex + 1} / ${newWordsSession.words.length}`
			: `${reviewSession.currentIndex + 1} / ${reviewSession.words.length}`
	);

	const progressPercent = $derived(() => {
		if (currentStep === 'studying-new') {
			const total = newWordsSession.words.length;
			return total > 0 ? ((newWordsSession.currentIndex + 1) / total) * 100 : 0;
		} else {
			const total = reviewSession.words.length;
			return total > 0 ? ((reviewSession.currentIndex + 1) / total) * 100 : 0;
		}
	});

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
			results: []
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
		// 优先学习新单词
		if ($newVocabularies?.length > 0) {
			initializeNewWordsSession($newVocabularies);
			currentStep = 'studying-new';
			return;
		}

		// 没有新单词则进入复习
		if (!$reviewVocabularies?.length) {
			alert('今天没有需要复习的单词！');
			return;
		}

		initializeReviewSession($reviewVocabularies);
		currentStep = 'reviewing';
	}

	async function handleNewWordLearned(): Promise<void> {
		const currentWord = newWordsSession.words[newWordsSession.currentIndex];
		currentWord.status = 'learning';
		await currentWord.save();

		recordNewWordResult(currentWord);

		if (!isLastNewWord) {
			moveToNextNewWord();
			currentStep = 'studying-new';
		} else {
			// 新单词学习完成，开始复习
			if ($reviewVocabularies?.length) {
				initializeReviewSession($reviewVocabularies);
				currentStep = 'reviewing';
			} else {
				currentStep = 'finished';
			}
		}
	}

	function handleShowAnswer(): void {
		currentStep = 'answering';
	}

	async function handleAnswerResult(result: ReviewResult): Promise<void> {
		const currentWord = reviewSession.words[reviewSession.currentIndex];
		currentWord.updateNextReview(result);
		recordReviewResult(currentWord, result);

		if (!isLastReviewWord) {
			moveToNextReviewWord();
			currentStep = 'reviewing';
		} else {
			currentStep = 'finished';
		}
	}
</script>

<div class="mt-32 flex items-center justify-center bg-gray-100 p-4">
	{#if currentStep === 'dashboard'}
		<DashboardCard
			reviewedCount={$reviewedCount ?? 0}
			shouldReviewCount={$reviewVocabularies?.length ?? 0}
			newVocabCount={$newVocabularies?.length ?? 0}
			onStartReview={handleStartReview}
		/>
	{:else if currentStep === 'studying-new'}
		<StudyNewCard
			{currentVocab}
			{progressStr}
			{progressPercent}
			onNewWordLearned={handleNewWordLearned}
		/>
	{:else if currentStep === 'reviewing'}
		<TestCard {currentVocab} {progressStr} {progressPercent} onShowAnswer={handleShowAnswer} />
	{:else if currentStep === 'answering'}
		<AnswerCard
			{currentVocab}
			{progressStr}
			{progressPercent}
			onSelectResult={handleAnswerResult}
		/>
	{:else if currentStep === 'finished'}
		<StatisticCard {reviewSession} />
	{/if}
</div>
