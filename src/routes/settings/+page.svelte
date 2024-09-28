<script>
  import { onMount } from 'svelte';

  let triggerSites = '';
  let status = '';

  // Load data when the component mounts
  onMount(() => {
    chrome.storage.sync.get(['triggerSites'], (items) => {
      if (Array.isArray(items.triggerSites)) {
        // console.log('is array');
        triggerSites = items.triggerSites.join('\n');
      } else {
        // console.log('not array');
        triggerSites = '';
      }
    });
  });

  // Save data to browser storage
  function saveData() {
    // Split the text by newlines and trim each entry
    const sitesArray = triggerSites.split('\n').map(site => site.trim()).filter(site => site !== '');
    console.log(sitesArray);
    chrome.storage.sync.set({ triggerSites: sitesArray }, () => {
      console.log('Data saved');
      status = 'Data saved!';
      setTimeout(() => (status = ''), 2000);
    });
  }
</script>

<div class="mx-auto max-w-7xl pt-16 lg:flex lg:gap-x-16 lg:px-8">
    <h1 class="sr-only">General Settings</h1>

    <aside class="flex overflow-x-auto border-b border-gray-900/5 py-4 lg:block lg:w-64 lg:flex-none lg:border-0 lg:py-20">
        <nav class="flex-none px-4 sm:px-6 lg:px-0">
            <ul role="list" class="flex gap-x-3 gap-y-1 whitespace-nowrap lg:flex-col">
                <li>
                    <!-- Current: "bg-gray-50 text-indigo-600", Default: "text-gray-700 hover:text-indigo-600 hover:bg-gray-50" -->
                    <a href="settings" class="group flex gap-x-3 rounded-md bg-gray-50 py-2 pl-2 pr-3 text-sm font-semibold leading-6 text-indigo-600">
                        Trigger Sites
                    </a>
                </li>
            </ul>
        </nav>
    </aside>
    <main class="px-4 py-16 sm:px-6 lg:flex-auto lg:px-0 lg:py-20">
        <div class="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
            <div>
                <h2 class="text-base font-semibold leading-7 text-gray-900">Trigger / Guilty Pleasure Sites</h2>
                <p class="mt-1 text-sm leading-6 text-gray-500">Websites you typically visit during downtime (like social media and similar sites).</p>

                <!--            <dl class="mt-6 space-y-6 divide-y divide-gray-100 border-t border-gray-200 text-sm leading-6">-->

                <form on:submit|preventDefault={saveData}>
                    <div class="pt-6 sm:flex">
                        <textarea bind:value={triggerSites} rows="10" cols="30" class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"></textarea>
                    </div>
                    <div class="mt-6 flex items-center justify-end gap-x-6">
                        <button type="submit" class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save</button>
                    </div>
                </form>
                <!--            </dl>-->
            </div>
        </div>
    </main>
</div>


<style>
    /* Add any custom styles you want */
</style>
