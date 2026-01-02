<script lang="ts">
	import { z } from 'zod';
	import { AudioService } from '$lib/services/AudioService';
	import { Vocabulary } from '$lib/models/Vocabulary';
	import Alert from '$lib/components/Alert.svelte';
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
	let errors = $state<{ word?: string; description?: string }>({});
	let exceptionMessage = $state('');
	let isLoading = $state(false); // 添加 loading 状态

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		// 如果正在加载，防止重复提交
		if (isLoading) return;

		errors = {};
		exceptionMessage = ''; // 清空之前的错误信息

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
			isLoading = true; // 开始加载

			// 检查单词是否已存在
			const existing = await Vocabulary.findByWord(word);
			if (existing) {
				// 弹出确认框
				const confirmReset = confirm(
					`单词 "${word}" 已存在（释义：${existing.description}）。\n是否要覆盖释义并重新开始学习？`
				);

				if (confirmReset) {
					// 执行重置逻辑
					await existing.resetReview(description); // 传入新释义

					// 成功反馈
					word = '';
					description = '';
					alert('已重置该单词的学习进度');
				}
				// 如果用户点取消，则停留在当前页面，不执行任何操作
				return;
			}

			Vocabulary.create({ word: word, description: description });
			await AudioService.fetchAndSaveAudio(word);

			// 成功后重置表单
			word = '';
			description = '';
			errors = {};
		} catch (err) {
			exceptionMessage = err instanceof Error ? err.message : '保存失败,请重试';
		} finally {
			isLoading = false; // 无论成功失败都要结束加载
		}
	}
</script>

{#if exceptionMessage}
	<Alert type="error" message={exceptionMessage} />
{/if}

<div class="mb-6 rounded-xl bg-white p-6 shadow-sm sm:p-8">
	<div>
		<form onsubmit={handleSubmit}>
			<VocabInput bind:vocab={word} disabled={isLoading} />
			{#if errors.word}
				<Alert type="error" message={errors.word} />
			{/if}

			<MeaningInput bind:meaning={description} disabled={isLoading} />
			{#if errors.description}
				<Alert type="error" message={errors.description} />
			{/if}

			<button
				type="submit"
				disabled={isLoading}
				class="button-press mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-900 py-4 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
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
					<span>正在添加...</span>
				{:else}
					<span class="text-lg">+</span>
					<span>添加到学习库</span>
				{/if}
			</button>
		</form>
	</div>
</div>
