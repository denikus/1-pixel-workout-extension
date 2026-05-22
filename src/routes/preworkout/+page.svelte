<script>
  import { onMount } from 'svelte';

  let originalUrl = '#';
  let wasIntercepted = false;
  let isSignedIn = true;
  let authLoaded = false;
  let base_workout_url;

  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedUrl = urlParams.get('original');

    if (encodedUrl) {
      originalUrl = decodeURIComponent(encodedUrl);
      wasIntercepted = true;
    }
    base_workout_url = `${import.meta.env.VITE_API_BASE_URL}/workouts/roulette?source=extension${wasIntercepted ? '&intercepted=true' : ''}`;
    if (wasIntercepted) {
      chrome.storage.local.set({ originalUrl: originalUrl });
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/status`, {
        credentials: 'include'
      });
      const data = await res.json();
      isSignedIn = data.authenticated;
    } catch {
      isSignedIn = false;
    }
    authLoaded = true;
  });

  function isSafeUrl(url) {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch { return false; }
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

  function handleStartWorkout(workoutType) {
    chrome.runtime.sendMessage({action: 'startWorkout'}, () => {
      if (chrome.runtime.lastError) {
        // Message delivery failed
      }
      window.location.href = `${base_workout_url}&workout_type=${encodeURIComponent(workoutType)}`;
    });
  }

  function handleDashboardWorkout() {
    chrome.runtime.sendMessage({action: 'startWorkout'}, () => {
      if (chrome.runtime.lastError) {
        // Message delivery failed
      }
      window.location.href = `${import.meta.env.VITE_API_BASE_URL}/dashboard`;
    });
  }
</script>

<div class="relative bg-[#f0eef8] min-h-screen flex flex-col">
  <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
    <div class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"></div>
  </div>

  <div class="flex-1 flex flex-col items-center justify-center gap-7 px-5 py-10" style="font-family: 'Bricolage Grotesque', sans-serif;">
    <h1 class="text-[clamp(28px,5vw,48px)] font-extrabold text-center leading-[1.15] bg-gradient-to-r from-orange-400 via-rose-400 to-fuchsia-500 bg-clip-text text-transparent">Got a minute for<br>your health?</h1>

    <div class="flex gap-3.5 flex-wrap justify-center">

      <div class="tooltip tooltip-top" data-tip="Push-ups, squats, planks. You'll feel it tomorrow. 🔋">
        <button
          type="button"
          on:click={() => handleStartWorkout('strength')}
          class="btn-strength relative px-14 py-[18px] border-0 rounded-2xl text-lg font-bold cursor-pointer overflow-hidden outline-none flex items-center gap-2 text-orange-800 min-w-[220px] justify-center transition-[transform,box-shadow] duration-[120ms] active:scale-95 bg-orange-200 shadow-[0_6px_20px_theme(colors.orange.200/45%),inset_0_1px_0_rgba(255,255,255,0.5)] hover:scale-[1.04] hover:shadow-[0_10px_32px_theme(colors.orange.200/60%),inset_0_1px_0_rgba(255,255,255,0.5)]"
        >
          <span class="emoji inline-block text-2xl leading-none transition-transform duration-200">💪</span>
          Go Strength
        </button>
      </div>

      <div class="tooltip tooltip-top" data-tip="Mobility and tension relief. No sweat, literally. 🧘">
        <button
          type="button"
          on:click={() => handleStartWorkout('stretch')}
          class="btn-stretch relative px-14 py-[18px] border-0 rounded-2xl text-lg font-bold cursor-pointer overflow-hidden outline-none flex items-center gap-2 text-teal-800 min-w-[220px] justify-center transition-[transform,box-shadow] duration-[120ms] active:scale-95 bg-teal-300 shadow-[0_6px_20px_theme(colors.teal.300/45%),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_10px_32px_theme(colors.teal.300/60%)]"
        >
          <span class="emoji inline-block text-2xl leading-none transition-transform duration-200">🤸</span>
          Go Stretch
        </button>
      </div>

      <div class="tooltip tooltip-top" data-tip="A little strength, a little mobility. Good for any moment. ✨">
        <button
          type="button"
          on:click={() => handleStartWorkout('balanced')}
          class="btn-balance relative px-14 py-[18px] border-0 rounded-2xl text-lg font-bold cursor-pointer overflow-hidden outline-none flex items-center gap-2 text-white min-w-[220px] justify-center transition-[transform,box-shadow] duration-[120ms] active:scale-95 bg-[#f87171] shadow-[0_6px_20px_#f8717173,inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_10px_32px_#f8717199]"
        >
          <span class="emoji inline-block text-2xl leading-none transition-transform duration-200">⚖️</span>
          Go Balanced
        </button>
      </div>

    </div>

    <div class="posture-wrapper relative {authLoaded && isSignedIn ? 'tooltip tooltip-top' : ''}" data-tip={authLoaded && isSignedIn ? "Open up your chest and shoulders. Undo the slouch. 🦐" : null}>
      <button
        type="button"
        on:click={() => { if (authLoaded && isSignedIn) handleStartWorkout('posture'); }}
        disabled={!authLoaded || !isSignedIn}
        class="btn-posture relative px-14 py-[18px] border-0 rounded-2xl text-lg font-bold overflow-hidden outline-none flex items-center gap-2 text-[#1a1025] min-w-[300px] justify-center transition-[transform,box-shadow,opacity] duration-[120ms] {!authLoaded ? 'btn-posture-loading cursor-default bg-gradient-to-r from-orange-200 via-rose-200 to-pink-300 shadow-[0_4px_14px_rgba(244,114,182,0.25),inset_0_1px_0_rgba(255,255,255,0.5)]' : isSignedIn ? 'cursor-pointer active:scale-95 bg-gradient-to-r from-orange-300 via-rose-300 to-pink-400 shadow-[0_6px_20px_rgba(244,114,182,0.45),inset_0_1px_0_rgba(255,255,255,0.5)] hover:scale-[1.04] hover:shadow-[0_10px_32px_rgba(244,114,182,0.6),inset_0_1px_0_rgba(255,255,255,0.5)]' : 'cursor-not-allowed bg-gradient-to-r from-orange-200 via-rose-200 to-pink-300 shadow-[0_4px_14px_rgba(244,114,182,0.25),inset_0_1px_0_rgba(255,255,255,0.5)]'}"
      >
        <span class="emoji inline-block text-2xl leading-none transition-transform duration-200" class:invisible={!authLoaded}>🦐</span>
        <span class:invisible={!authLoaded}>Go Unshrimp</span>
      </button>
      {#if authLoaded && !isSignedIn}
        <span class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#1a1025] flex items-center justify-center shadow-md pointer-events-none z-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </span>
        <div class="posture-tip">
          <p>Open up your chest and shoulders. Undo the slouch. 🦐</p>
          <p class="mt-2.5 font-bold">To Unlock - create free account or sign in</p>
        </div>
      {/if}
    </div>

    <div class="min-h-[72px] flex items-start justify-center">
    {#if authLoaded}
      {#if isSignedIn}
        <p
          class="text-[13px] font-semibold text-[#9991b8] px-2 py-1 tracking-wide"
          style="font-family: 'Bricolage Grotesque', sans-serif;"
        >
          Or pick your own workout on the <a
            href="{import.meta.env.VITE_API_BASE_URL}/dashboard?source=extension"
            on:click|preventDefault={handleDashboardWorkout}
            class="text-[#7c6fb0] transition-colors duration-200 hover:text-[#1a1025] underline decoration-dotted underline-offset-2 cursor-pointer"
          >site</a>
        </p>
      {:else}
        <p
          class="text-[13px] font-semibold text-[#9991b8] px-2 py-1 tracking-wide"
          style="font-family: 'Bricolage Grotesque', sans-serif;"
        >
          Only 3 workouts in guest mode.
          <a
            href="{import.meta.env.VITE_API_BASE_URL}/pricing"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#7c6fb0] transition-colors duration-200 hover:text-[#1a1025] underline decoration-dotted underline-offset-2"
          >Grab a free account</a> to unlock more, including Posture Pack.
          (<a
            href="{import.meta.env.VITE_API_BASE_URL}/users/sign_in"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#7c6fb0] transition-colors duration-200 hover:text-[#1a1025] underline decoration-dotted underline-offset-2"
          >Sign in</a> if you already have one)
        </p>
      {/if}
    {/if}
    </div>

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

  /* ---- CUSTOM POSTURE TOOLTIP (disabled state) ---- */
  .posture-tip {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    background: white;
    color: #1a1025;
    font-size: 18px;
    line-height: 1.35;
    padding: 10px 16px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    text-align: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
    z-index: 20;
    white-space: nowrap;
  }
  .posture-tip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -6px;
    border: 6px solid transparent;
    border-top-color: white;
  }
  .posture-wrapper:hover .posture-tip {
    opacity: 1;
  }

  /* ---- POSTURE BUTTON: loading shimmer ---- */
  .btn-posture-loading {
    position: relative;
  }
  .btn-posture-loading::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%);
    transform: translateX(-100%);
    animation: posture-shimmer 1.2s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes posture-shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
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
  @keyframes shrimp-wiggle {
    0%   { transform: rotate(-15deg) scale(1) translateX(-1px); }
    100% { transform: rotate(15deg)  scale(1.22) translateX(1px); filter: drop-shadow(0 0 5px rgba(244,114,182,0.6)); }
  }
</style>
