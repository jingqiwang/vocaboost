<script>
	import Header from '$lib/components/Header.svelte';
	import AddVocabCard from '$lib/components/AddVocab/Index.svelte';
	import TodayVocabListCard from '$lib/components/AddVocab/TodayVocabListCard.svelte';
</script>

<div class="mx-auto max-w-4xl px-4 py-6 pb-32 sm:px-6 sm:py-8">
	<Header />
	<AddVocabCard />
	<TodayVocabListCard />
</div>
