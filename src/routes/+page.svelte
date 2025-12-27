<script>
	import Header from '$lib/components/Header.svelte';
	import AddVocabCard from '$lib/components/AddVocabCard.svelte';
	import TodayVocabListCard from '$lib/components/TodayVocabListCard.svelte';
</script>

<svelte:head>
	<title>Daily Vocabulary</title>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
	/>
	<meta name="mobile-web-app-capable" content="yes" />
</svelte:head>

<div class="mb-8 min-h-screen bg-gray-50">
	<div class="mx-auto max-w-4xl px-4 py-6 pb-28 sm:px-6 sm:py-8">
		<Header />
		<AddVocabCard />
		<TodayVocabListCard />
	</div>
</div>
