<!-- SlideTimer.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';

  export let initialTime; // in seconds
  export let onTimeUp = () => {}; // callback function when timer reaches 0

  let timeLeft;
  let intervalId;

  export function startTimer() {
    // console.log("start timer in component");
    timeLeft = initialTime;
    clearInterval(intervalId); // Clear any existing interval
    intervalId = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
      } else {
        clearInterval(intervalId);
        onTimeUp();
      }
    }, 1000);

  }

  onDestroy(() => {
    clearInterval(intervalId);
  });
</script>

<div class="slide-content">
    <div class="timer">{timeLeft} seconds</div>
</div>

<style>
    .slide-content {
        position: relative;
        height: 100%;
    }
    .timer {
        position: absolute;
        bottom: 10px;
        right: 10px;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
    }
</style>
