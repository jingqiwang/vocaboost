<script>
	let { meaning = $bindable(), disabled = false } = $props();
</script>

<div class="mb-6">
	<label class="mb-3 block text-sm font-medium text-gray-900" for="meaning-input">中文含义</label>

	<textarea
		bind:value={meaning}
		id="meaning-input"
		placeholder="输入中文含义或翻译..."
		rows="4"
		class="w-full resize-none rounded-lg border-0 bg-gray-50 px-4 py-3 text-sm transition focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
		required
		disabled={disabled}
	></textarea>
</div>
