<script lang="ts">
	import './layout.css';
	import './layout.css';
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>Daily Vocabulary</title>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
	/>

	<meta name="mobile-web-app-capable" content="yes" />
</svelte:head>

{@render children()}

<BottomNav />
