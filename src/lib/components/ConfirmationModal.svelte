<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	let {
		show = $bindable(false),
		title = '确认',
		message = '',
		confirmText = '确定',
		cancelText = '取消',
		type = 'warning',
		onConfirm = undefined,
		onCancel = undefined
	} = $props();

	function handleConfirm() {
		onConfirm?.();
		show = false;
	}

	function handleCancel() {
		onCancel?.();
		show = false;
	}

	$effect(() => {
		if (typeof window === 'undefined' || !show) return;
		const fn = (e: KeyboardEvent) => {
			if (e.key === 'Escape') handleCancel();
		};
		window.addEventListener('keydown', fn);
		return () => window.removeEventListener('keydown', fn);
	});
</script>

{#if show}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
		transition:fade={{ duration: 200 }}
	>
		<!-- Backdrop: click or Space/Enter to close -->
		<div
			role="button"
			tabindex="0"
			class="absolute inset-0 bg-black/40 backdrop-blur-sm"
			aria-label="关闭"
			onclick={handleCancel}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleCancel();
				}
			}}
		></div>

		<!-- Modal Content -->
		<div 
			class="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<div class="p-8 text-center">
				{#if type === 'warning'}
					<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
						<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
					</div>
				{:else if type === 'error'}
					<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
						<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
					</div>
				{/if}

				<h3 class="mb-2 text-xl font-bold text-gray-900">{title}</h3>
				<p class="text-sm text-gray-500 leading-relaxed">{message}</p>
			</div>

			<div class="flex border-t border-gray-100">
				<button 
					class="flex-1 py-4 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50"
					onclick={handleCancel}
				>
					{cancelText}
				</button>
				<div class="w-[1px] bg-gray-100"></div>
				<button 
					class="flex-1 py-4 text-sm font-semibold transition-colors hover:bg-gray-50
						{type === 'error' ? 'text-red-600' : 'text-blue-600'}"
					onclick={handleConfirm}
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}
