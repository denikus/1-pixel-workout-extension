<script>
  import { onMount } from 'svelte';
  import { Plus, Pencil, Trash2, Check, X, Globe } from 'lucide-svelte';

  // Sites management
  let sites = [];
  let newSiteInput = '';
  let editingIndex = null;
  let editingValue = '';
  let validationError = '';
  let editValidationError = '';
  let status = '';

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

  // Start editing a site
  function startEdit(index) {
    editingIndex = index;
    editingValue = sites[index];
    editValidationError = '';
  }

  // Save the edited site
  function saveEdit() {
    const error = validateSite(editingValue, editingIndex);
    if (error) {
      editValidationError = error;
      return;
    }

    const normalized = normalizeSite(editingValue);
    sites[editingIndex] = normalized;
    sites = sites; // Trigger reactivity
    editingIndex = null;
    editingValue = '';
    editValidationError = '';
    saveSitesToStorage();
  }

  // Cancel editing
  function cancelEdit() {
    editingIndex = null;
    editingValue = '';
    editValidationError = '';
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
    <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
    <p class="mt-1 text-sm text-gray-500">
      Control your workout triggers.
    </p>
  </div>

  <div class="space-y-6">

    <!-- Section 1: Distraction Sites -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title text-base font-semibold text-gray-900">
          Distraction Sites
        </h2>
        <p class="text-sm text-gray-500">
          Add websites where you'd like a workout reminder.
          When you visit these sites, you'll get a quick workout opportunity.
        </p>
        <p class="text-xs text-gray-400 mt-1">
          Stays private — saved only in your browser.
        </p>

        <!-- Add Site Input -->
        <div class="mt-4">
          <div class="join w-80">
            <input
              type="text"
              class="input input-bordered join-item flex-1"
              class:input-error={validationError}
              placeholder="e.g., facebook.com"
              bind:value={newSiteInput}
              on:input={() => validationError = ''}
              on:keydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSite(); } }}
            />
            <button type="button" class="btn btn-primary join-item" on:click={addSite}>
              <Plus size={16} />
              <span class="hidden sm:inline">Add</span>
            </button>
          </div>
          {#if validationError}
            <label class="label py-1">
              <span class="label-text-alt text-error">{validationError}</span>
            </label>
          {/if}
        </div>

        <!-- Sites List -->
        <div class="mt-4 max-w-80">
          {#if sites.length === 0}
            <div class="text-center py-8 text-gray-400">
              <Globe class="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p class="text-sm">No distraction sites added yet.</p>
            </div>
          {:else}
            <ul class="space-y-2  max-h-[340px] overflow-y-auto">
              {#each sites as site, index}
                <li class="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
                  {#if editingIndex === index}
                    <!-- Edit Mode -->
                    <div class="flex-1">
                      <input
                        type="text"
                        class="input input-bordered input-sm w-full"
                        class:input-error={editValidationError}
                        bind:value={editingValue}
                        on:keydown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      {#if editValidationError}
                        <label class="label py-0">
                          <span class="label-text-alt text-error text-xs">{editValidationError}</span>
                        </label>
                      {/if}
                    </div>
                    <div class="flex gap-1 shrink-0">
                      <button
                        type="button"
                        class="btn btn-success btn-sm btn-square"
                        title="Save"
                        on:click={saveEdit}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm btn-square"
                        title="Cancel"
                        on:click={cancelEdit}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  {:else}
                    <!-- View Mode -->
                    <span class="flex-1 font-mono text-sm truncate" title={site}>{site}</span>
                    <div class="flex gap-1 shrink-0">
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm btn-square"
                        title="Edit"
                        on:click={() => startEdit(index)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm btn-square text-error hover:bg-error hover:text-error-content"
                        title="Delete"
                        on:click={() => removeSite(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    </div>

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
        </div>
      </div>
    </div>

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
    background: #f0eef8;
    margin: 0;
  }
</style>
