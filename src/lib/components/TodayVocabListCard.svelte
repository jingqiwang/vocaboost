<script lang="ts">
	import { liveQuery } from 'dexie';
	import { Vocabulary } from '$lib/models/Vocabulary';
	import Alert from '$lib/components/Alert.svelte';
	import VocabAudioBtn from '$lib/components/VocabAudioBtn.svelte';

	let vocabs = liveQuery(() => Vocabulary.getTodayNewVocabularies());
	let errorMessage = $state('');

	async function handleDelete(vocab: Vocabulary) {
		if (confirm('确定要删除这个单词吗？')) {
			try {
				await vocab.delete();
			} catch (err) {
				errorMessage = err instanceof Error ? err.message : '删除失败，请重试';
			}
		}
	}
</script>

{#if errorMessage}
	<Alert type="error" message={errorMessage} />
{/if}

{#if $vocabs && $vocabs.length > 0}
	<div class="mb-10 flex items-start justify-center">
		<div class="w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<svg class="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<h2 class="text-lg font-bold text-gray-800">今日新增单词</h2>
					<span class="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
						>{$vocabs.length} 个</span
					>
				</div>
			</div>

			<div class="space-y-4">
				{#each $vocabs as vocab (vocab.id)}
					<div
						class="group relative rounded-xl border border-green-200 bg-green-50/30 p-5 transition-all"
					>
						<div class="mb-6 flex items-start justify-between">
							<div class="space-y-2">
								<div class="flex items-center gap-2">
									<span class="text-lg font-bold text-gray-800">{vocab.word}</span>
									<VocabAudioBtn bind:vocab={vocab.word} />
								</div>

								<p class="text-base font-medium text-green-700">{vocab.description}</p>
							</div>

							<div class="text-green-500">
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									></path>
								</svg>
							</div>
						</div>

						<div class="flex items-start justify-between">
							<p class="text-xs text-green-600/70">
								{vocab.createdAt.toLocaleTimeString(undefined, {
									hour: '2-digit',
									minute: '2-digit'
								})} 添加
							</p>

							<button class="text-red-500" title="删除单词" onclick={() => handleDelete(vocab)}>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
