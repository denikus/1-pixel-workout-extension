<script>
  import { onMount } from 'svelte';

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Classes for the workout types this version knows. A type the site adds
  // later gets PLAIN_WORKOUT_CLASS, so older versions still show its button.
  const WORKOUT_CLASSES = {
    strength: 'btn-strength overflow-hidden text-orange-800 min-w-[220px] bg-orange-200 shadow-[0_6px_20px_theme(colors.orange.200/45%),inset_0_1px_0_rgba(255,255,255,0.5)] hover:scale-[1.04] hover:shadow-[0_10px_32px_theme(colors.orange.200/60%),inset_0_1px_0_rgba(255,255,255,0.5)]',
    stretch: 'btn-stretch overflow-hidden text-teal-800 min-w-[220px] bg-teal-300 shadow-[0_6px_20px_theme(colors.teal.300/45%),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_10px_32px_theme(colors.teal.300/60%)]',
    balanced: 'btn-balance overflow-hidden text-white min-w-[220px] bg-[#f87171] shadow-[0_6px_20px_#f8717173,inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_10px_32px_#f8717199]',
    posture: 'btn-posture overflow-hidden text-[#1a1025] min-w-[300px] bg-gradient-to-r from-orange-300 via-rose-300 to-pink-400 shadow-[0_6px_20px_rgba(244,114,182,0.45),inset_0_1px_0_rgba(255,255,255,0.5)] hover:scale-[1.04] hover:shadow-[0_10px_32px_rgba(244,114,182,0.6),inset_0_1px_0_rgba(255,255,255,0.5)]'
  };
  const PLAIN_WORKOUT_CLASS = 'text-[#1a1025] min-w-[220px] bg-white shadow-[0_6px_20px_rgba(26,16,37,0.08)] hover:scale-[1.04]';

  // The buttons before /extension/home answers, or when it can't be reached.
  const DEFAULT_WORKOUTS = [
    { type: 'strength', label: 'Go Strength', emoji: '💪', hint: "Push-ups, squats, planks. You'll feel it tomorrow. 🔋" },
    { type: 'stretch', label: 'Go Stretch', emoji: '🤸', hint: 'Mobility and tension relief. No sweat, literally. 🧘' },
    { type: 'balanced', label: 'Go Balanced', emoji: '⚖️', hint: 'A little strength, a little mobility. Good for any moment. ✨' },
    { type: 'posture', label: 'Go Unshrimp', emoji: '🦐', hint: 'Open up your chest and shoulders. Undo the slouch. 🦐' }
  ];

  let originalUrl = '#';
  let wasIntercepted = false;
  let isSignedIn = false;
  let authLoaded = false;
  // Whether this guest has met Marti on the site. Until they have, the page
  // shows only the journey screen: start the onboarding, or skip.
  let onboardingSeen = true;
  // Remembered once seen, so the workout buttons show at once on later visits
  // instead of waiting for the site.
  let onboardingSeenCached = false;
  let base_workout_url;
  // /extension/home: workout buttons, challenges and the crew's weekly
  // scoreboard. The last signed-in answer is kept in chrome.storage.local and
  // shown until the fresh one arrives, so the cards don't pop in.
  let home = null;

  $: showJourney = authLoaded && !isSignedIn && !onboardingSeen;
  $: showContent = authLoaded || onboardingSeenCached;
  $: workouts = (Array.isArray(home?.workouts) && home.workouts.length ? home.workouts : DEFAULT_WORKOUTS)
    .filter((workout) => workout && workout.type && workout.label);
  $: challenges = isSignedIn && Array.isArray(home?.challenges) ? home.challenges.filter((challenge) => challenge?.id) : [];
  $: crew = isSignedIn && Array.isArray(home?.crew?.members) && home.crew.members.length ? home.crew : null;
  $: hasCards = challenges.length > 0 || crew;

  onMount(() => {
    init();
    // A guest may sign in on the site in another tab ("Already have a base on
    // Mars?"). When they come back, ask the site again, so the page switches to
    // their challenges and buttons without waiting for the next interruption.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && authLoaded && !isSignedIn) refreshHome();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });

  async function init() {
    chrome.storage.local.get(['onboardingSeen', 'extensionHome'], (result) => {
      onboardingSeenCached = result?.onboardingSeen === true;
      if (!authLoaded && result?.extensionHome?.authenticated) {
        home = result.extensionHome;
        isSignedIn = true;
      }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const encodedUrl = urlParams.get('original');

    if (encodedUrl) {
      originalUrl = decodeURIComponent(encodedUrl);
      wasIntercepted = true;
    }
    base_workout_url = `${API_BASE_URL}/workouts/roulette?source=extension${wasIntercepted ? '&intercepted=true' : ''}`;
    if (wasIntercepted) {
      chrome.storage.local.set({ originalUrl: originalUrl });
    }

    applyHome(await loadHome());
  }

  function applyHome(data) {
    home = data;
    isSignedIn = data?.authenticated === true;
    // An older server or no answer at all: count the onboarding as seen.
    onboardingSeen = isSignedIn || data?.onboarding_seen !== false;
    chrome.storage.local.set({ onboardingSeen: onboardingSeen, extensionHome: isSignedIn ? data : null });
    authLoaded = true;
  }

  // On coming back to the tab. No answer keeps the page as it is.
  async function refreshHome() {
    const data = await loadHome();
    if (data) applyHome(data);
  }

  async function fetchJson(url) {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // /extension/home, or /auth/status on a server that doesn't have it yet.
  async function loadHome() {
    const version = chrome.runtime.getManifest().version;
    try {
      return await fetchJson(`${API_BASE_URL}/extension/home?ext=${encodeURIComponent(version)}${wasIntercepted ? '&intercepted=1' : ''}`);
    } catch {
      try {
        return await fetchJson(`${API_BASE_URL}/auth/status`);
      } catch {
        return null;
      }
    }
  }

  function isSafeUrl(url) {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch { return false; }
  }

  // Links from the server only ever lead to the site.
  function siteUrl(url) {
    return typeof url === 'string' && url.startsWith(`${API_BASE_URL}/`) ? url : null;
  }

  function handleSkip() {
    chrome.runtime.sendMessage({action: 'startCooldown'}, () => {
      if (chrome.runtime.lastError) {
        // Message delivery failed
      }
      if (isSafeUrl(originalUrl)) {
        window.location.href = originalUrl;
      }
    });
  }

  // Leaving for a workout on the site: the background starts the workout
  // cooldown and counts the interruption first.
  function goToWorkout(url) {
    if (!url) return;
    chrome.runtime.sendMessage({action: 'startWorkout'}, () => {
      if (chrome.runtime.lastError) {
        // Message delivery failed
      }
      window.location.href = url;
    });
  }

  function workoutUrl(workout) {
    return siteUrl(workout.url) || `${base_workout_url}&workout_type=${encodeURIComponent(workout.type)}`;
  }

  // Straight to Marti's onboarding on the site. It keeps source/intercepted, so
  // the onboarding workout can offer "Continue browsing".
  function handleStartJourney() {
    goToWorkout(
      siteUrl(home?.links?.onboarding) ||
        `${API_BASE_URL}/onboarding?source=extension${wasIntercepted ? '&intercepted=true' : ''}`
    );
  }

  function handleDashboardWorkout() {
    goToWorkout(siteUrl(home?.links?.dashboard) || `${API_BASE_URL}/dashboard`);
  }

  // "Next: Tomorrow · Squat 50 s"
  function nextText(next) {
    if (!next?.summary) return '';
    return next.date_label ? `Next: ${next.date_label} · ${next.summary}` : `Next: ${next.summary}`;
  }
</script>

<div class="relative bg-[#f0eef8] min-h-screen flex flex-col">
  <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
    <div class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"></div>
  </div>

  <div class="flex-1 flex flex-col items-center justify-center gap-7 px-5 py-10" style="font-family: 'Bricolage Grotesque', sans-serif;">
    {#if showJourney}
    <!-- A still frame of the landing page's pixel Mars, without the green
         terraformed specks (static/mars.svg). -->
    <img src="/mars.svg" alt="" width="112" height="112" class="block size-28 [image-rendering:pixelated]" />

    <h1 class="text-[clamp(28px,5vw,48px)] font-extrabold text-center leading-[1.15] bg-gradient-to-r from-orange-400 via-rose-400 to-fuchsia-500 bg-clip-text text-transparent">Got a minute<br>for Mars?</h1>
    <p class="max-w-md text-center text-lg font-semibold leading-snug text-[#6b6390]">
      Marti is building a base on Mars. Do a 1-minute workout together and earn your first m² of land.
    </p>
    <button
      type="button"
      on:click={handleStartJourney}
      class="btn-journey relative px-14 py-[18px] border-0 rounded-2xl text-lg font-bold cursor-pointer outline-none flex items-center gap-2 text-[#1a1025] min-w-[300px] justify-center transition-[transform,box-shadow] duration-[120ms] active:scale-95 bg-gradient-to-r from-orange-300 via-rose-300 to-pink-400 shadow-[0_6px_20px_rgba(244,114,182,0.45),inset_0_1px_0_rgba(255,255,255,0.5)] hover:scale-[1.04] hover:shadow-[0_10px_32px_rgba(244,114,182,0.6),inset_0_1px_0_rgba(255,255,255,0.5)]"
    >
      <span class="emoji inline-block text-2xl leading-none transition-transform duration-200">🚀</span>
      Start your space journey
    </button>
    <!-- A guest here may already have an account and just not be signed in.
         The sign-in opens in a new tab; coming back refreshes the page. -->
    <p class="-mt-2 text-[15px] font-semibold text-[#9991b8]">
      Already have a base on Mars?
      <a
        href={siteUrl(home?.links?.sign_in) || `${API_BASE_URL}/users/sign_in`}
        target="_blank"
        rel="noopener noreferrer"
        class="text-[#7c6fb0] transition-colors duration-200 hover:text-[#1a1025] underline decoration-dotted underline-offset-2"
      >Sign in</a>
    </p>
    {:else}
    <!-- Hidden (not removed) until we know the guest has met Marti, so a new guest
         doesn't see the workout buttons flash before the journey screen. -->
    <div class="contents" class:invisible={!showContent}>
    <h1 class="text-[clamp(28px,5vw,48px)] font-extrabold text-center leading-[1.15] bg-gradient-to-r from-orange-400 via-rose-400 to-fuchsia-500 bg-clip-text text-transparent">Got a minute for<br>your health?</h1>

    {#if challenges.length}
    <section class="w-full max-w-xl flex flex-col gap-3" aria-label="Your challenges">
      {#each challenges as challenge (challenge.id)}
        <div class="rounded-2xl bg-white/85 px-5 py-4 flex flex-wrap items-center gap-4 shadow-[0_6px_20px_rgba(26,16,37,0.06)]">
          <div class="flex-1 min-w-[200px]">
            <p class="text-xs font-bold uppercase tracking-wide text-[#9991b8]">
              {challenge.day_label || ''}{challenge.kind === 'crew' ? ' · Crew challenge' : ''}
            </p>
            <h2 class="text-xl font-extrabold text-[#1a1025] leading-tight">{challenge.name}</h2>
            {#if challenge.state === 'due' && challenge.today?.summary}
              <p class="mt-1 text-[15px] font-semibold text-[#6b6390]">{challenge.today.summary}</p>
            {:else if challenge.state === 'done'}
              <p class="mt-1 text-[15px] font-semibold text-emerald-700">✅ Done for today</p>
              {#if challenge.next}<p class="text-sm text-[#6b6390]">{nextText(challenge.next)}</p>{/if}
            {:else if challenge.state === 'rest'}
              <p class="mt-1 text-[15px] font-semibold text-[#6b6390]">😴 Rest day</p>
              {#if challenge.next}<p class="text-sm text-[#6b6390]">{nextText(challenge.next)}</p>{/if}
            {:else if challenge.next}
              <p class="mt-1 text-sm text-[#6b6390]">{nextText(challenge.next)}</p>
            {/if}
            <p class="mt-1.5 flex flex-wrap gap-x-3 text-xs font-semibold text-[#9991b8]">
              {#if challenge.progress}<span>{challenge.progress.done} of {challenge.progress.planned} workouts</span>{/if}
              {#if challenge.streak > 0}<span>🔥 {challenge.streak}</span>{/if}
              {#if challenge.crew_today?.label}<span>{challenge.crew_today.label}</span>{/if}
            </p>
          </div>
          {#if challenge.state === 'due' && siteUrl(challenge.workout_url)}
            <button
              type="button"
              on:click={() => goToWorkout(siteUrl(challenge.workout_url))}
              class="px-6 py-3 border-0 rounded-xl text-base font-bold cursor-pointer flex items-center gap-2 text-white bg-gradient-to-r from-orange-400 via-rose-400 to-fuchsia-500 shadow-[0_6px_20px_rgba(244,114,182,0.4)] transition-transform duration-[120ms] hover:scale-[1.04] active:scale-95"
            >
              Do today's
              {#if challenge.today?.m2 > 0}<span class="rounded-full bg-white/25 px-2 py-0.5 text-xs">+{challenge.today.m2} m²</span>{/if}
            </button>
          {:else if siteUrl(challenge.url)}
            <a
              href={siteUrl(challenge.url)}
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm font-semibold text-[#7c6fb0] underline decoration-dotted underline-offset-2 hover:text-[#1a1025]"
            >Open</a>
          {/if}
        </div>
      {/each}
    </section>
    {/if}

    {#if crew}
    <section class="w-full max-w-xl rounded-2xl bg-white/85 px-5 py-4 shadow-[0_6px_20px_rgba(26,16,37,0.06)]" aria-label="Crew weekly scoreboard">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="text-lg font-extrabold text-[#1a1025]">{crew.emblem || ''} {crew.name}</h2>
        {#if crew.week}
          <p class="text-xs font-semibold text-[#9991b8]">Weekly scoreboard · {crew.week.label} · {crew.week.total_m2} m²</p>
        {/if}
      </div>
      <ol class="mt-2">
        {#each crew.members as member (member.rank)}
          <li class="flex items-center gap-3 py-2 border-t border-black/5 first:border-0">
            <span class="w-5 text-sm text-[#9991b8] tabular-nums">{member.rank}</span>
            {#if crew.changes_label}
              <span class="w-9 text-sm font-semibold tabular-nums {member.place_change > 0 ? 'text-emerald-700' : member.place_change < 0 ? 'text-rose-600' : 'text-black/25'}">
                {member.place_change > 0 ? `↑${member.place_change}` : member.place_change < 0 ? `↓${-member.place_change}` : '–'}
              </span>
            {/if}
            <span class="relative shrink-0">
              <span
                class="grid size-8 place-items-center rounded-full text-sm font-semibold"
                style="background-color: {member.color?.bg || '#ede9fe'}; color: {member.color?.text || '#4c1d95'};"
                aria-hidden="true"
              >{member.initial || ''}</span>
              {#if member.level}
                <span class="absolute -right-1.5 -bottom-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#1a1025] px-1 text-[11px] font-semibold text-white ring-2 ring-white" title="Level {member.level}">{member.level}</span>
              {/if}
            </span>
            <div class="flex-1 min-w-0">
              <p class="truncate text-[15px] text-[#1a1025]">
                <span class="font-semibold">{member.name}</span>{#if member.me}<span class="text-[#9991b8]"> (you)</span>{/if}
              </p>
              {#if member.last_active_label}<p class="text-xs text-[#9991b8]">{member.last_active_label}</p>{/if}
            </div>
            {#if member.gained > 0}<span class="text-sm font-semibold text-emerald-700 tabular-nums">+{member.gained}</span>{/if}
            <span class="w-16 text-right font-bold text-[#1a1025] tabular-nums">{member.m2} m²</span>
          </li>
        {/each}
      </ol>
      <div class="mt-2 flex flex-wrap items-baseline justify-between gap-2">
        {#if crew.changes_label}<p class="text-xs text-[#9991b8]">{crew.changes_label}</p>{/if}
        {#if siteUrl(crew.url)}
          <a
            href={siteUrl(crew.url)}
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs font-semibold text-[#7c6fb0] underline decoration-dotted underline-offset-2 hover:text-[#1a1025]"
          >Open crew page</a>
        {/if}
      </div>
    </section>
    {/if}

    {#if hasCards}
      <p class="-mb-3 text-sm font-semibold text-[#9991b8]">Or a quick workout</p>
    {/if}

    <div class="flex gap-3.5 flex-wrap justify-center max-w-[720px]">
      {#each workouts as workout (workout.type)}
        <div class="{workout.type === 'posture' ? 'w-full flex justify-center' : ''}">
          <div class="tooltip tooltip-top" data-tip={workout.hint || null}>
            <button
              type="button"
              on:click={() => goToWorkout(workoutUrl(workout))}
              class="relative px-14 py-[18px] border-0 rounded-2xl text-lg font-bold cursor-pointer outline-none flex items-center gap-2 justify-center transition-[transform,box-shadow] duration-[120ms] active:scale-95 {WORKOUT_CLASSES[workout.type] || PLAIN_WORKOUT_CLASS}"
            >
              {#if workout.emoji}<span class="emoji inline-block text-2xl leading-none transition-transform duration-200">{workout.emoji}</span>{/if}
              {workout.label}
            </button>
          </div>
        </div>
      {/each}
    </div>

    <div class="min-h-[72px] flex items-start justify-center">
    {#if authLoaded}
      {#if isSignedIn}
        <p
          class="text-[13px] font-semibold text-[#9991b8] px-2 py-1 tracking-wide"
          style="font-family: 'Bricolage Grotesque', sans-serif;"
        >
          Or pick your own workout on the <a
            href={siteUrl(home?.links?.dashboard) || `${API_BASE_URL}/dashboard?source=extension`}
            on:click|preventDefault={handleDashboardWorkout}
            class="text-[#7c6fb0] transition-colors duration-200 hover:text-[#1a1025] underline decoration-dotted underline-offset-2 cursor-pointer"
          >site</a>
        </p>
      {:else}
        <p
          class="text-[13px] font-semibold text-[#9991b8] px-2 py-1 tracking-wide"
          style="font-family: 'Bricolage Grotesque', sans-serif;"
        >
          <a
            href={siteUrl(home?.links?.sign_up) || `${API_BASE_URL}/users/sign_up`}
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#7c6fb0] transition-colors duration-200 hover:text-[#1a1025] underline decoration-dotted underline-offset-2"
          >Create a free account</a> to keep your land on Mars.
          (<a
            href={siteUrl(home?.links?.sign_in) || `${API_BASE_URL}/users/sign_in`}
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#7c6fb0] transition-colors duration-200 hover:text-[#1a1025] underline decoration-dotted underline-offset-2"
          >Sign in</a> if you already have one)
        </p>
      {/if}
    {/if}
    </div>
    </div>
    {/if}

    {#if wasIntercepted}
    <button
      type="button"
      on:click|preventDefault={handleSkip}
      class="px-10 py-4 rounded-xl text-[15px] font-semibold text-[#6b6b6b] bg-[#e8e8e8] border-0 cursor-pointer tracking-wide transition-colors duration-200 hover:bg-[#d4d4d4] hover:text-[#444]"
      style="font-family: 'Bricolage Grotesque', sans-serif;"
    >🙈 Skip</button>
    {/if}
  </div>

  <footer class="px-5 pb-6 text-center" style="font-family: 'Bricolage Grotesque', sans-serif;">
    <hr class="border-0 border-t border-[#d1cde0] mb-4" />
    <a
      href="/settings"
      class="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#9991b8] no-underline transition-colors duration-200 hover:text-[#1a1025]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      Settings
    </a>
  </footer>
</div>


<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&display=swap');

  :global(html), :global(body) {
    background: #f0eef8;
    margin: 0;
  }

  /* ---- TOOLTIP ---- */
  :global(.tooltip::before) {
    background-color: white;
    color: #1a1025;
    font-size: 18px;
    padding: 8px 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  :global(.tooltip::after) {
    border-top-color: white;
  }

  /* ---- STRENGTH: shimmer ::before ---- */
  .btn-strength::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%);
    transform: translateX(-100%);
    transition: none;
  }
  .btn-strength:hover::before {
    transform: translateX(100%);
    transition: transform 0.45s ease;
  }

  /* ---- ALL BUTTONS: ripple ::after ---- */
  .btn-strength::after,
  .btn-stretch::after,
  .btn-balance::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    width: 0; height: 0;
    left: 50%; top: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255,255,255,0.3);
    opacity: 0;
    pointer-events: none;
  }
  .btn-strength:active::after,
  .btn-stretch:active::after,
  .btn-balance:active::after {
    width: 200px; height: 200px;
    opacity: 0;
    transition: width 0.4s, height 0.4s, opacity 0.4s;
  }

  /* ---- HOVER ANIMATIONS ---- */
  .btn-strength:hover .emoji {
    animation: clench 0.35s ease-in-out infinite alternate;
  }
  .btn-stretch:hover {
    animation: stretch-btn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  .btn-stretch:not(:hover) {
    animation: unstretched 0.3s ease forwards;
  }
  .btn-stretch:hover .emoji {
    animation: spring-bounce 0.6s cubic-bezier(0.34, 1.8, 0.64, 1) forwards;
  }
  .btn-balance:hover {
    animation: gentle-bob 1s ease-in-out infinite;
  }
  .btn-balance:hover .emoji {
    animation: seesaw 0.7s ease-in-out infinite alternate;
  }
  .btn-journey:hover .emoji {
    animation: lift-off 0.5s ease-in-out infinite alternate;
  }
  .btn-posture:not(:disabled):hover .emoji {
    animation: shrimp-wiggle 0.5s ease-in-out infinite alternate;
  }

  /* ---- KEYFRAMES ---- */
  @keyframes clench {
    0%   { transform: scale(1)    rotate(-3deg); }
    100% { transform: scale(1.28) rotate(5deg); filter: drop-shadow(0 0 6px oklch(0.7 0.12 70.42)); }
  }
  @keyframes stretch-btn {
    0%   { transform: scale(1, 1); }
    30%  { transform: scale(1.18, 0.86); }
    55%  { transform: scale(0.92, 1.12); }
    75%  { transform: scale(1.06, 0.96); }
    90%  { transform: scale(0.98, 1.03); }
    100% { transform: scale(1.04, 1.04); }
  }
  @keyframes unstretched {
    to { transform: scale(1); }
  }
  @keyframes spring-bounce {
    0%   { transform: scaleY(1); }
    25%  { transform: scaleY(0.6) scaleX(1.3); }
    60%  { transform: scaleY(1.4) scaleX(0.85); }
    80%  { transform: scaleY(0.9) scaleX(1.05); }
    100% { transform: scaleY(1) scaleX(1); }
  }
  @keyframes gentle-bob {
    0%,100% { transform: translateY(0) rotate(0deg); }
    25%      { transform: translateY(-3px) rotate(-1deg); }
    75%      { transform: translateY(3px) rotate(1deg); }
  }
  @keyframes seesaw {
    0%   { transform: rotate(-18deg) translateY(2px); }
    100% { transform: rotate(18deg) translateY(-2px); }
  }
  @keyframes lift-off {
    0%   { transform: translate(0, 0) rotate(0deg); }
    100% { transform: translate(2px, -4px) rotate(-8deg); }
  }
  @keyframes shrimp-wiggle {
    0%   { transform: rotate(-15deg) scale(1) translateX(-1px); }
    100% { transform: rotate(15deg)  scale(1.22) translateX(1px); filter: drop-shadow(0 0 5px rgba(244,114,182,0.6)); }
  }
</style>
