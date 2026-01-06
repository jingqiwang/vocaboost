<script lang="ts">
	import { z } from 'zod';
	import { AudioService } from '$lib/services/AudioService';
	import { Vocabulary } from '$lib/models/Vocabulary';
	import Alert from '$lib/components/Alert.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import VocabInput from './VocabInput.svelte';
	import MeaningInput from './MeaningInput.svelte';

	const vocabSchema = z.object({
		word: z
			.string()
			.min(1, '请输入词汇')
			.refine((val) => /[^\s]/.test(val), {
				message: '词汇不能只包含空格'
			}),
		description: z.string().min(1, '请输入释义')
	});

	let word = $state('');
	let description = $state('');
	let enResults = $state<{ pos: string; def: string }[]>([]);
	let searchError = $state('');
	let errors = $state<{ word?: string; description?: string }>({});
	let exceptionMessage = $state('');
	let isLoading = $state(false);
	let loadingStatus = $state('');

	// Modal state
	let showConfirmModal = $state(false);
	let pendingWord = $state<{ word: string; description: string; existingDescription: string } | null>(null);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (isLoading) return;

		errors = {};
		exceptionMessage = '';

		const result = vocabSchema.safeParse({
			word: word,
			description: description
		});

		if (!result.success) {
			result.error.issues.forEach((err) => {
				const field = err.path[0] as 'word' | 'description';
				errors[field] = err.message;
			});
			return;
		}

		try {
			isLoading = true;
			loadingStatus = '正在检查词汇...';

			const existing = await Vocabulary.findByWord(word);
			if (existing) {
				pendingWord = { 
					word, 
					description, 
					existingDescription: existing.description 
				};
				showConfirmModal = true;
				isLoading = false;
				loadingStatus = '';
				return;
			}

			await saveNewVocab(word, description);
		} catch (err) {
			exceptionMessage = err instanceof Error ? err.message : '保存失败,请重试';
			isLoading = false;
			loadingStatus = '';
		}
	}

	async function saveNewVocab(w: string, desc: string) {
		try {
			isLoading = true;
			loadingStatus = '正在保存到数据库...';
			
			const existing = await Vocabulary.findByWord(w);
			if (existing) {
				await existing.resetReview(desc);
			} else {
				await Vocabulary.create({ word: w, description: desc });
			}

			loadingStatus = '正在获取音频...';
			await AudioService.fetchAndSaveAudio(w);

			// Reset form
			word = '';
			description = '';
			enResults = [];
			errors = {};
		} catch (err) {
			exceptionMessage = err instanceof Error ? err.message : '保存失败,请重试';
		} finally {
			isLoading = false;
			loadingStatus = '';
			pendingWord = null;
		}
	}

	function handleConfirmOverwrite() {
		if (pendingWord) {
			saveNewVocab(pendingWord.word, pendingWord.description);
		}
	}
</script>

<ConfirmationModal
	bind:show={showConfirmModal}
	title="单词已存在"
	message={`单词 "${pendingWord?.word}" 已存在（释义：${pendingWord?.existingDescription}）。\n是否要覆盖释义并重新开始学习？`}
	confirmText="覆盖并重置"
	cancelText="取消"
	onConfirm={handleConfirmOverwrite}
/>

{#if exceptionMessage}
	<Alert type="error" message={exceptionMessage} />
{/if}

<div class="eudict-card mb-6 sm:p-8">
	<div>
		<form onsubmit={handleSubmit}>
			<VocabInput
				bind:vocab={word}
				disabled={isLoading}
				on:fillMeaning={(e) => (description = e.detail)}
				on:searchResults={(e) => {
					searchError = '';
					enResults = e.detail;
				}}
				on:searchError={(e) => {
					enResults = [];
					searchError = e.detail;
				}}
			/>
			{#if errors.word}
				<Alert type="error" message={errors.word} />
			{/if}

			<MeaningInput bind:meaning={description} disabled={isLoading} />
			{#if errors.description}
				<Alert type="error" message={errors.description} />
			{/if}

			{#if searchError}
				<Alert type="error" message={searchError} />
			{:else if enResults.length > 0}
				<div class="mt-2 rounded-lg border bg-white p-3" style="border-color: var(--color-border)">
					<div class="eudict-caption mb-2 font-semibold">英英释义</div>
					<div class="space-y-2">
						{#each enResults as item}
							<div class="flex items-start justify-between gap-2 rounded-md border p-2" style="border-color: var(--color-border-light); background-color: var(--color-bg-app)">
								<div class="flex-1">
									<div class="text-[10px] uppercase tracking-widest" style="color: var(--color-text-tertiary)">{item.pos}</div>
									<div class="text-sm" style="color: var(--color-text-primary)">{item.def}</div>
								</div>
								<button
									class="rounded px-2 py-1 text-xs font-medium transition-colors"
									style="background-color: var(--color-primary-light); color: var(--color-primary)"
									onclick={() => (description = item.def)}
									title="填充到释义"
								>
									填充
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<button
				type="submit"
				disabled={isLoading}
				class="eudict-btn-primary button-press mt-6 flex w-full cursor-pointer items-center justify-center gap-2 py-4"
			>
				{#if isLoading}
					<!-- Loading Spinner -->
					<svg
						class="h-5 w-5 animate-spin text-white"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<span>{loadingStatus}</span>
				{:else}
					<span class="text-lg">+</span>
					<span>添加到学习库</span>
				{/if}
			</button>
		</form>
	</div>
</div>
