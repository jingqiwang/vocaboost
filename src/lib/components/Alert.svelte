<script lang="ts">
	// 定义类型，增加严谨性
	type AlertType = 'error' | 'success' | 'warning';

	interface Props {
		type: AlertType;
		message: string;
	}

	let { type, message }: Props = $props();

	// 将不同类型的配置抽象出来
	const configs = {
		error: {
			container: 'bg-red-50 dark:bg-red-500/15 dark:outline-red-500/25',
			icon: 'text-red-400',
			text: 'text-red-700 dark:text-red-300',
			path: 'M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z'
		},
		success: {
			container: 'bg-green-50 dark:bg-green-500/10 dark:outline-green-500/20',
			icon: 'text-green-400',
			text: 'text-green-800 dark:text-green-300',
			path: 'M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z'
		},
		warning: {
			container:
				'border-l-4 border-yellow-400 bg-yellow-50 dark:border-yellow-500 dark:bg-yellow-500/10',
			icon: 'text-yellow-400 dark:text-yellow-500',
			text: 'text-yellow-800 dark:text-yellow-300', // 修复了之前的 green 错误
			path: 'M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'
		}
	};

	// 使用 $derived 根据 type 获取当前配置
	let current = $derived(configs[type]);
</script>

{#if current}
	<div class="mb-4 rounded-md p-4 dark:outline {current.container}">
		<div class="flex">
			<div class="shrink-0">
				<svg
					viewBox="0 0 20 20"
					fill="currentColor"
					aria-hidden="true"
					class="size-5 {current.icon}"
				>
					<path fill-rule="evenodd" clip-rule="evenodd" d={current.path} />
				</svg>
			</div>
			<div class="ml-3">
				<p class="text-sm font-medium {current.text}">{message}</p>
			</div>
		</div>
	</div>
{/if}
