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
    // console.log(sitesArray);
    chrome.storage.sync.set({ triggerSites: sitesArray }, () => {
      status = 'Saved securely in your browser. Your workout reminders are ready!';
      setTimeout(() => (status = ''), 4000);
    });
  }
</script>

<div class="tabs tabs-box">
  <input type="radio" name="my_tabs_6" class="tab" aria-label="Distraction Sites"  checked="checked" />
  <div class="tab-content bg-base-100 border-base-300 p-6">
    <h2 class="text-base font-semibold leading-7 text-gray-900">Distraction Sites</h2>
    <p class="mt-1 text-sm leading-6 text-gray-500">Enter websites where you'd like a workout reminder (like social media or news sites). <br>
      When you visit these sites, you'll see a 1-minute workout suggestion page instead.<br>
      🔒 <strong>These sites are saved locally in your browser only — nothing is ever sent to our servers.</strong>
      </p>

    <form on:submit|preventDefault={saveData}>
        <div class="pt-6 sm:flex">
            <textarea bind:value={triggerSites} rows="10" cols="50" class="textarea textarea-lg"></textarea>
        </div>
        <div class="mt-6">
            <button type="submit" class="btn">Save</button>
        </div>
    </form>
  </div>
</div>

{#if status}
  <div class="toast toast-top">
    <div class="alert alert-success">
      <span>✓ {status}</span>
    </div>
  </div>
{/if}