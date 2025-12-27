<script lang="ts">
	import VocabSearchBtn from './VocabSearchBtn.svelte';
	import VocabAudioBtn from '../VocabAudioBtn.svelte';

	let { vocab = $bindable() } = $props();
</script>

<div class="mb-6">
	<label class="mb-3 block text-sm font-medium text-gray-900" for="vocab-input">
		英文单词/句子
	</label>

	<div class="flex flex-col gap-2 sm:flex-row">
		<input
			id="vocab-input"
			type="text"
			name="vocab"
			bind:value={vocab}
			placeholder="输入英文单词或句子..."
			class="flex-1 rounded-lg border-0 bg-gray-50 px-4 py-3 text-sm transition focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
			autocomplete="off"
			required
			pattern="[A-Za-z\s]+"
		/>

		<div class="flex gap-2">
			<VocabSearchBtn bind:vocab />
            <div class="rounded-lg bg-gray-50 hover:bg-gray-100 transition flex px-4 py-3">
                <VocabAudioBtn bind:vocab />
            </div>
		</div>
	</div>
</div>
