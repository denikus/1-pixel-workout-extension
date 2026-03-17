<script>
  import { onMount } from 'svelte';
  import { Plus, X } from 'lucide-svelte';

  // Sites management
  let sites = [];
  let newSiteInput = '';
  let validationError = '';
  let status = '';
  let showAdvancedSettings = false;

  // Daily Limits
  let maxInterruptionsPerDay = 5;

  // Schedule
  let activeWeekdays = [1, 2, 3, 4, 5];
  let activeTimeStart = '09:00';
  let activeTimeEnd = '18:00';

  // Helper for weekday display
  const WEEKDAY_LABELS = [
    { value: 0, label: 'Sun', fullLabel: 'Sunday' },
    { value: 1, label: 'Mon', fullLabel: 'Monday' },
    { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
    { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
    { value: 4, label: 'Thu', fullLabel: 'Thursday' },
    { value: 5, label: 'Fri', fullLabel: 'Friday' },
    { value: 6, label: 'Sat', fullLabel: 'Saturday' },
  ];

  onMount(() => {
    chrome.storage.sync.get([
      'triggerSites',
      'maxInterruptionsPerDay',
      'activeWeekdays',
      'activeTimeStart',
      'activeTimeEnd'
    ], (items) => {
      // Load sites as array directly
      sites = Array.isArray(items.triggerSites) ? items.triggerSites : [];

      // Load other settings with defaults
      maxInterruptionsPerDay = items.maxInterruptionsPerDay ?? 5;
      activeWeekdays = items.activeWeekdays ?? [1, 2, 3, 4, 5];
      activeTimeStart = items.activeTimeStart ?? '09:00';
      activeTimeEnd = items.activeTimeEnd ?? '18:00';
    });
  });

  // Save sites to storage (auto-save on add/edit/delete)
  function saveSitesToStorage() {
    chrome.storage.sync.set({ triggerSites: sites }, () => {
      status = 'Sites saved';
      setTimeout(() => (status = ''), 2000);
    });
  }

  // Validate a site input
  function validateSite(value, excludeIndex = -1) {
    const normalized = normalizeSite(value);

    if (!normalized) {
      return 'Please enter a domain name';
    }

    // Validate domain format
    const domainRegex = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;
    if (!domainRegex.test(normalized)) {
      return 'Please enter a valid domain (e.g., facebook.com)';
    }

    // Check for duplicates (excluding current edit index)
    const isDuplicate = sites.some((site, i) =>
      i !== excludeIndex && site === normalized
    );

    if (isDuplicate) {
      return 'This site is already in your list';
    }

    return ''; // No error
  }

  // Add a new site
  function addSite() {
    const error = validateSite(newSiteInput);
    if (error) {
      validationError = error;
      return;
    }

    validationError = '';
    const normalized = normalizeSite(newSiteInput);
    sites = [normalized, ...sites]; // Add to beginning
    newSiteInput = '';
    saveSitesToStorage();
  }

  // Remove a site
  function removeSite(index) {
    sites = sites.filter((_, i) => i !== index);
    saveSitesToStorage();
  }

  // Auto-save non-site settings to storage
  function autoSaveSettings() {
    chrome.storage.sync.set({
      maxInterruptionsPerDay,
      activeWeekdays,
      activeTimeStart,
      activeTimeEnd
    }, () => {
      status = 'Settings saved';
      setTimeout(() => (status = ''), 2000);
    });
  }

  // Toggle a weekday in the activeWeekdays array
  function toggleWeekday(day) {
    if (activeWeekdays.includes(day)) {
      activeWeekdays = activeWeekdays.filter(d => d !== day);
    } else {
      activeWeekdays = [...activeWeekdays, day].sort((a, b) => a - b);
    }
    autoSaveSettings();
  }

  // Check if a weekday is active
  function isWeekdayActive(day) {
    return activeWeekdays.includes(day);
  }

  // Quick-add a predefined site
  function addQuickSite(domain) {
    newSiteInput = domain;
    addSite();
  }

  // Normalize a site URL to just the hostname
  function normalizeSite(site) {
    let normalized = site.toLowerCase().trim();

    // Remove protocol (http:// or https://)
    normalized = normalized.replace(/^https?:\/\//, '');

    // Remove path, query params, and trailing slash (keep just the hostname)
    normalized = normalized.split('/')[0];

    return normalized;
  }
</script>

<div class="space-y-8 mx-auto w-full max-w-7xl px-6 pb-16 pt-10 sm:pb-24 lg:px-8">
  <!-- Page Header -->
  <div>
    <h1 class="text-2xl text-center font-bold text-gray-900">Hey, welcome 👋</h1>
  </div>

  <div class="space-y-6">

    <!-- Section 1: Distraction Sites -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <div class="flex items-center gap-x-2 gap-y-6 flex-wrap mt-1">
          <span class="text-xl text-gray-600">Let's be honest — we all have those sites. 🫠 You open a new tab, and before you know it you're 40 minutes deep into ... </span>
          {#if !sites.includes('facebook.com')}
          <button type="button" class="btn btn-outline btn-sm gap-1" on:click={() => addQuickSite('facebook.com')}>
            <Plus size={14} />
            facebook.com
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </button>
          {/if}
          {#if !sites.includes('instagram.com')}
          <button type="button" class="btn btn-outline btn-sm gap-1" on:click={() => addQuickSite('instagram.com')}>
            <Plus size={14} />
            instagram.com
            <svg width="18" height="18" viewBox="0 0 24 24" fill="url(#ig-grad)"><defs><radialGradient id="ig-grad" cx="30%" cy="107%" r="150%"><stop offset="0%" stop-color="#fdf497"/><stop offset="5%" stop-color="#fdf497"/><stop offset="45%" stop-color="#fd5949"/><stop offset="60%" stop-color="#d6249f"/><stop offset="90%" stop-color="#285AEB"/></radialGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </button>
          {/if}
          {#if !sites.includes('x.com')}
          <button type="button" class="btn btn-outline btn-sm gap-1" on:click={() => addQuickSite('x.com')}>
            <Plus size={14} />
            x.com
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </button>
          {/if}
          {#if !sites.includes('youtube.com')}
          <button type="button" class="btn btn-outline btn-sm gap-1" on:click={() => addQuickSite('youtube.com')}>
            <Plus size={14} />
            youtube.com
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </button>
          {/if}
          {#if !sites.includes('tiktok.com')}
          <button type="button" class="btn btn-outline btn-sm gap-1" on:click={() => addQuickSite('tiktok.com')}>
            <Plus size={14} />
            tiktok.com
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
          </button>
          {/if}
          {#if !sites.includes('reddit.com')}
          <button type="button" class="btn btn-outline btn-sm gap-1" on:click={() => addQuickSite('reddit.com')}>
            <Plus size={14} />
            reddit.com
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF4500"><path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm6.066 9.645c.183.049.3.236.3.436 0 1.141-.487 2.204-1.373 2.99-.888.789-2.086 1.267-3.382 1.416.271.405.434.878.434 1.39v2.563c0 .362-.098.515-.316.612a.494.494 0 01-.22.052c-.11 0-.238-.042-.39-.157l-.963-.803c-.168-.14-.37-.21-.578-.21h-.757c-1.417 0-2.735-.445-3.71-1.254C6.337 15.88 5.8 14.772 5.8 13.581c0-.152.009-.301.027-.449a.475.475 0 01.468-.406c.246 0 .455.188.475.434.012.132.018.266.018.402 0 1.922 1.755 3.487 3.912 3.487h.757c.413 0 .812.139 1.132.396l.423.352v-1.763c0-.564.258-1.088.693-1.414a.476.476 0 01.544-.038c.188.107.304.307.304.524 0 .027-.002.055-.006.082 1.093-.128 2.072-.52 2.765-1.107.693-.588 1.074-1.353 1.074-2.158 0-.131-.036-.205-.112-.237a.476.476 0 01-.32-.45c0-.179.1-.342.258-.424a1.722 1.722 0 00-.764-1.09 1.728 1.728 0 00-1.315-.217.476.476 0 01-.52-.253 3.297 3.297 0 00-2.818-1.64 3.297 3.297 0 00-2.818 1.64.476.476 0 01-.52.253 1.728 1.728 0 00-1.315.217 1.722 1.722 0 00-.764 1.09.476.476 0 01-.32.45c-.076.032-.112.106-.112.237 0 .378.127.738.351 1.058a.475.475 0 01-.122.66.475.475 0 01-.66-.122A2.68 2.68 0 014.848 10.1c0-.44.174-.776.494-1.05a.476.476 0 01.12-.462 2.676 2.676 0 011.222-1.712 2.68 2.68 0 012.05-.34 4.247 4.247 0 013.266-1.744 4.247 4.247 0 013.266 1.744 2.68 2.68 0 012.05.34 2.676 2.676 0 011.222 1.712.476.476 0 01.12.462c.32.274.494.61.494 1.05 0 .148-.028.267-.086.387zM9.5 12.5a1 1 0 110-2 1 1 0 010 2zm5 0a1 1 0 110-2 1 1 0 010 2z"/></svg>
          </button>
          {/if}
        </div>
        <!-- Add Site Input -->
        <div class="flex items-center gap-x-2 gap-y-6 flex-wrap mt-6">
          <span class="text-xl text-gray-600">…or maybe yours is something else</span>
          <div class="join">
            <input
              type="text"
              class="input input-bordered join-item input-sm"
              class:input-error={validationError}
              placeholder="your guilty pleasure site"
              size="25"
              bind:value={newSiteInput}
              on:input={() => validationError = ''}
              on:keydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSite(); } }}
            />
            <button type="button" class="btn btn-primary join-item btn-sm text-white" on:click={addSite}>
              <Plus size={16} />
              Add
            </button>
          </div>
          <span class="text-sm text-gray-400">🔒 Stored locally — we never see your list.</span>
        </div>
        {#if validationError}
          <label class="label py-1">
            <span class="label-text-alt text-error">{validationError}</span>
          </label>
        {/if}

        <!-- Sites confirmation sentence -->
        {#if sites.length > 0}
          <p class="text-xl text-gray-600 mt-6 leading-10">
            Now every time you go to
            {#each sites as site, index}
              <span class="badge badge-lg badge-outline gap-1 font-mono align-middle mx-1">
                {site}
                <button type="button" class="btn btn-ghost btn-xs btn-circle" on:click={() => removeSite(index)}>
                  <X size={12} />
                </button>
              </span>
            {/each}
            — we'll jump in with a quick workout instead. 💪
          </p>
          <p class="text-xl text-gray-600 mt-2">You can always skip it — but you probably won't want to. 😏</p>
          {#if !showAdvancedSettings}
            <p class="text-xl text-gray-600 mt-2">
              Want to set your workout times too?
              <button type="button" class="btn btn-link text-xl p-0 align-baseline" on:click={() => showAdvancedSettings = true}>Let's do that ➡️</button>.
            </p>
          {/if}
          <div class="mt-6">
            <p class="text-xl text-gray-600 leading-10">That's it! Two ways to work out now:</p>
            <p class="text-xl text-gray-600 mt-4 leading-10">🧩 Click our icon in the toolbar — anytime you want</p>
            <p class="text-xl text-gray-600 mt-4 leading-10">🫠 Visit your rabbit hole sites — we'll catch you there</p>
            <button type="button" class="btn btn-primary btn-lg mt-4 text-white" on:click={() => { chrome.storage.local.set({ onboardingComplete: true }, () => window.close()); }}>Got it 👍</button>
          </div>
        {/if}
      </div>
    </div>

    {#if showAdvancedSettings}
    <!-- Section 2: Daily Limits -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title text-base font-semibold text-gray-900">
          Daily Limits
        </h2>
        <p class="text-sm text-gray-500">
          Limit how many times the extension prompts you per day.
          After reaching the limit, you're off the hook.
        </p>

        <div class="form-control mt-4">
          <label class="label">
            <span class="label-text">Workout prompts per day</span>
          </label>
          <input
            type="number"
            bind:value={maxInterruptionsPerDay}
            min="0"
            max="100"
            class="input input-bordered w-16"
            placeholder="0"
            on:input={() => { maxInterruptionsPerDay = Math.min(100, Math.max(0, parseInt(maxInterruptionsPerDay) || 0)); }}
            on:change={autoSaveSettings}
          />
          <label class="label">
            <span class="label-text-alt text-gray-400">
              Enter 0 or leave empty for unlimited prompts
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Section 3: Schedule -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title text-base font-semibold text-gray-900">
          Schedule
        </h2>
        <p class="text-sm text-gray-500">
          Choose which days and times the extension should be active.
          Prompts active only during these days and hours.
        </p>

        <!-- Active Days -->
        <div class="form-control mt-4">
          <label class="label">
            <span class="label-text font-medium">Active days</span>
          </label>
          <div class="flex flex-wrap gap-2">
            {#each WEEKDAY_LABELS as { value, label, fullLabel }}
              <label
                class="cursor-pointer flex items-center gap-2 px-3 py-2 rounded border border-base-300 hover:bg-base-200 transition-colors"
                class:bg-primary={isWeekdayActive(value)}
                class:text-primary-content={isWeekdayActive(value)}
                class:border-primary={isWeekdayActive(value)}
              >
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  class:checkbox-primary={!isWeekdayActive(value)}
                  checked={isWeekdayActive(value)}
                  on:change={() => toggleWeekday(value)}
                />
                <span
                  class="text-sm"
                  class:text-primary-content={isWeekdayActive(value)}
                  title={fullLabel}
                >
                  {label}
                </span>
              </label>
            {/each}
          </div>
          {#if activeWeekdays.length === 0}
            <label class="label">
              <span class="label-text-alt text-warning">
                No days selected — no prompts will appear
              </span>
            </label>
          {/if}
        </div>

        <!-- Active Time Range -->
        <div class="form-control mt-6">
          <label class="label">
            <span class="label-text font-medium">Active hours</span>
          </label>
          <div class="flex items-center gap-4 flex-wrap">
            <div class="form-control">
              <label class="label py-0">
                <span class="label-text-alt">Start time</span>
              </label>
              <input
                type="time"
                bind:value={activeTimeStart}
                class="input input-bordered"
                on:change={autoSaveSettings}
              />
            </div>
            <span class="text-gray-500 mt-6">to</span>
            <div class="form-control">
              <label class="label py-0">
                <span class="label-text-alt">End time</span>
              </label>
              <input
                type="time"
                bind:value={activeTimeEnd}
                class="input input-bordered"
                on:change={autoSaveSettings}
              />
            </div>
          </div>
          <label class="label">
            <span class="label-text-alt text-gray-400">
              Times are in your local timezone
            </span>
          </label>
          {#if activeTimeEnd && activeTimeStart && activeTimeEnd < activeTimeStart}
            <label class="label py-0">
              <span class="label-text-alt text-info">
                Overnight schedule: active from {activeTimeStart} to {activeTimeEnd} next day
              </span>
            </label>
          {/if}
        </div>
      </div>
    </div>
    {/if}

  </div>
</div>

{#if status}
  <div class="toast toast-top toast-end">
    <div class="alert alert-success">
      <span>{status}</span>
    </div>
  </div>
{/if}

<style>
  :global(html), :global(body) {
    background: var(--color-base-200, #f2f2f2);
    margin: 0;
  }
</style>
