<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	let { message = '', type = 'error', onclose } = $props();

	// 自动关闭逻辑
	$effect(() => {
		const timer = setTimeout(() => {
			onclose?.();
		}, 4000);
		return () => clearTimeout(timer);
	});
</script>

<div
	in:fly={{ y: -10, duration: 300 }}
	out:fade={{ duration: 200 }}
	class="absolute bottom-full z-50 mb-3"
>
	<div
		class="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-xl
        {type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}"
	>
		{message}
		<div
			class="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent
            {type === 'error' ? 'border-t-red-500' : 'border-t-gray-800'}"
		></div>
	</div>
</div>
