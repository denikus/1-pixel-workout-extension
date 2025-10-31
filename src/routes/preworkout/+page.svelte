<script>
  import { onMount } from 'svelte';

  let originalUrl = '#';
  const workout_roulette_url = `${import.meta.env.VITE_API_BASE_URL}/workouts/roulette?source=extension&intercepted=true`;

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedUrl = urlParams.get('original');

    if (encodedUrl) {
      originalUrl = decodeURIComponent(encodedUrl);
    }
    // Save to Chrome storage, so later can take it and make redirection
    chrome.storage.local.set({ originalUrl: originalUrl }, () => {
      console.log('Original URL saved to storage');
    });
  });

  function handleSkip() {
    chrome.runtime.sendMessage({action: 'startCooldown'}, (response) => {
      if (response.success) {
        window.location.href = originalUrl;
      }
    });
  }


</script>

<div class="bg-white">
    <div class="relative isolate px-6 pt-14 lg:px-8">
        <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
            <div class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"></div>
        </div>
        <div class="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
            <div class="text-center">
                <h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">Got a minute for your health?</h1>
                <div class="mt-10 flex items-center justify-center gap-x-6">
                    <a href="{workout_roulette_url}" class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Start Workout</a>
                    <button type="button" on:click|preventDefault={handleSkip} class="text-sm font-semibold leading-6 text-gray-900">Skip</button>
                </div>
            </div>
        </div>
        <div class="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
            <div class="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"></div>
        </div>
    </div>
</div>


<style>
    /* Add any custom styles you want */
</style>
