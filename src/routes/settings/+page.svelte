<script>
  import { onMount } from 'svelte';

  let triggerSites = '';
  let status = '';

  // Load data when the component mounts
  onMount(() => {
    chrome.storage.sync.get(['triggerSites'], (items) => {
      triggerSites = items.triggerSites || '';
    });
  });

  // Save data to browser storage
  function saveData() {
    chrome.storage.sync.set({ triggerSites }, () => {
      status = 'Data saved!';
      setTimeout(() => (status = ''), 2000);
    });
  }
</script>


<main class="px-4 py-16 sm:px-6 lg:flex-auto lg:px-0 lg:py-20">
    <div class="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
            <div>
                <h2 class="text-base font-semibold leading-7 text-gray-900">Trigger / Guilty Pleasure Sites</h2>
                <p class="mt-1 text-sm leading-6 text-gray-500">Websites you typically visit during downtime (like social media and similar sites).</p>

                <dl class="mt-6 space-y-6 divide-y divide-gray-100 border-t border-gray-200 text-sm leading-6">

    <form on:submit|preventDefault={saveData}>
        <div class="pt-6 sm:flex">
            <textarea bind:value={triggerSites} rows="10" cols="30" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"></textarea>
        </div>
        <div class="mt-6 flex items-center justify-end gap-x-6">
            <button type="submit" class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save</button>
        </div>
    </form>

    {#if status}
        <div>{status}</div>
    {/if}
</main>

<style>
    /* Add any custom styles you want */
</style>
