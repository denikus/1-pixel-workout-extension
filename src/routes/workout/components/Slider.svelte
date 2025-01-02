<!-- Slider.svelte -->

<script>
  import { onMount, onDestroy } from 'svelte';
  import Swiper from 'swiper';
  import { Navigation, Pagination, Autoplay } from 'swiper/modules';
  import Confetti from "canvas-confetti";

  // Updated CSS imports
  import 'swiper/css';
  import 'swiper/css/navigation';
  import 'swiper/css/pagination';

  const slides = [
    {
      id: 1,
      image: 'https://picsum.photos/800/400?random=1',
      title: 'Slide 1'
    },
    {
      id: 2,
      image: 'https://picsum.photos/800/400?random=2',
      title: 'Slide 2'
    },
    {
      id: 3,
      image: 'https://picsum.photos/800/400?random=3',
      title: 'Slide 3'
    },
    {
      id: 4,
      image: 'https://picsum.photos/800/400?random=4',
      title: 'Slide 4'
    },
    {
      id: 5,
      image: 'https://picsum.photos/800/400?random=5',
      title: 'Slide 5'
    }
  ];

  class SwiperController {
    constructor() {
      this.swiper = null;
      this.timer = null;
      this.seconds = 0;
      this.elements = {};
    }

    initialize(options, elements) {
      this.elements = elements;
      this.swiper = new Swiper(this.elements.containerTarget, options);

      this.swiper.on('autoplayTimeLeft', (swiper, time, progress) => {
        if (swiper.autoplay.paused) {
          return
        }

        let countdown = Math.ceil(time / 1000);

        // if countdown reach 0 - then just stop it
        if (countdown <= 0) {
          countdown = 0;
          progress = 0;
        }

        this.elements.progressCircleTarget.style.setProperty("--progress", 1 - progress);
        this.elements.progressContentTarget.textContent = `${countdown}s`;
      });

      this.swiper.on('reachEnd', () => {
        this.hidePauseOverlay();
        this.throwConfetti();
        this.hideSlideProgressBar();
        this.hideBottomPanel();
        this.stopTimer();
      })
    }

    destroy() {
      this.stopTimer();
      this.swiper?.destroy();
    }

    handleKeyPress(event) {
      if (event.code === 'Space') {
        event.preventDefault()
        this.togglePlay()
      }
    }


    hideSlideProgressBar() {
      this.elements.slideProgressWrapperTarget.classList.add("hidden");
    }

    hideBottomPanel() {
      this.elements.bottomPanelTarget.classList.add("hidden");
    }

    hidePauseOverlay() {
      this.elements.pauseOverlayTarget.classList.add('hidden');
      this.elements.pauseOverlayTarget.classList.remove('flex');
    }

    pause() {
      this.swiper.autoplay.pause()
      this.elements.pauseButtonTarget.querySelector('svg').outerHTML = this.resumeIcon
      this.elements.pauseButtonTarget.querySelector('span').textContent = 'Resume'
      // Show overlay
      this.showPauseOverlay();
    }

    play() {
      this.swiper.autoplay.resume()
      this.elements.pauseButtonTarget.querySelector('svg').outerHTML = this.pauseIcon
      this.elements.pauseButtonTarget.querySelector('span').textContent = 'Pause'

      // Hide overlay
      this.hidePauseOverlay();
    }

    get pauseIcon() {
      return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <rect x="6" y="4" width="2" height="12"></rect>
            <rect x="12" y="4" width="2" height="12"></rect>
          </svg>`
    }

    get resumeIcon() {
      return `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 4l12 6-12 6z" />
            </svg>`
    }

    showPauseOverlay() {
      this.elements.pauseOverlayTarget.classList.remove('hidden')
      this.elements.pauseOverlayTarget.classList.add('flex');
    }

    startTimer() {
      this.timer = setInterval(() => {
        if (!this.swiper.autoplay.paused) {
          this.seconds++
          this.updateDisplay()
          this.updateLastSlideText()
        }
      }, 1000)
    }

    stopTimer() {
      clearInterval(this.timer);
    }

    stopWorkout(){
      this.pause();
      // this.swiper.autoplay.pause();
      // this.elements.pauseButtonTarget.querySelector('svg').outerHTML = this.resumeIcon
      // this.elements.pauseButtonTarget.querySelector('span').textContent = 'Resume'

      if (window.confirm('Are you sure you want to stop the workout?')) {
        // User clicked OK - stop completely
        this.swiper.autoplay.stop();
        this.swiper.slideTo(this.swiper.slides.length - 1);
      } else {
        this.play();
        // this.swiper.autoplay.resume()
        // this.elements.pauseButtonTarget.querySelector('svg').outerHTML = this.pauseIcon
        // this.elements.pauseButtonTarget.querySelector('span').textContent = 'Pause'
      }
    }

    throwConfetti() {
      Confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }

    togglePlay() {
      if (!this.swiper.autoplay.paused) {
        this.pause();
      } else {
        this.play();
      }
    }


    updateDisplay() {
      const minutes = Math.floor(this.seconds / 60);
      const secs = this.seconds % 60;
      const formatted = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      this.elements.timerDisplayTarget.textContent = formatted;
    }

    updateLastSlideText() {
      const str = this.elements.lastSlideTextTarget.textContent
      const newMinutes = Math.floor(this.seconds / 60)
      const newSeconds = this.seconds % 60

      const updatedStr = str.replace(
        /(\d+)\s+minutes?\s+(\d+)\s+seconds?/,
        `${newMinutes} minutes ${newSeconds} seconds`
      )

      this.elements.lastSlideTextTarget.textContent = updatedStr
    }
  }

  // Initialize controller
  const controller = new SwiperController();

  let lastSlideTextTarget;
  let timerDisplayTarget;
  let containerTarget;
  let progressCircleTarget;
  let progressContentTarget;
  let slideProgressWrapperTarget;
  let bottomPanelTarget;
  let pauseButtonTarget;
  let pauseOverlayTarget;

  onMount(() => {
    let options = {
      spaceBetween: 30,
      centeredSlides: true,
      pagination: {
        el: ".swiper-pagination",
        type: "progressbar",
      },
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
        stopOnLastSlide: true
      },
      modules: [Navigation, Autoplay, Pagination]
    }

    let elements = {
      lastSlideTextTarget: lastSlideTextTarget,
      timerDisplayTarget: timerDisplayTarget,
      containerTarget: containerTarget,
      progressCircleTarget: progressCircleTarget,
      progressContentTarget: progressContentTarget,
      slideProgressWrapperTarget: slideProgressWrapperTarget,
      bottomPanelTarget: bottomPanelTarget,
      pauseButtonTarget: pauseButtonTarget,
      pauseOverlayTarget: pauseOverlayTarget
    }

    controller.initialize(options, elements);

    controller.updateDisplay();
    controller.startTimer();
  });

  onDestroy(() => {
    controller.destroy();
  });
</script>

<svelte:window on:keydown={(e) => controller.handleKeyPress(e)}/>

<div class="w-full relative" data-controller="slider" data-slider-exercise-duration-value="30">

    <div bind:this={containerTarget} data-slider-target="container" class="swiper progress-slide-carousel swiper-container relative">
        <div class="swiper-wrapper mt-5">
            {#each slides as slide}
                <div class="swiper-slide">
                    <div class="bg-indigo-50 rounded-2xl min-h-96 flex flex-col justify-center items-center">
                        <div class="text-3xl font-semibold text-indigo-600 p-5">{slide.title}</div>
                        <div class="w-full relative h-auto p-5 max-w-sm mx-auto ">
                            <img
                                src={slide.image}
                                alt={slide.title}
                                class="block mx-auto"
                            />
                        </div>
                    </div>
                </div>
            {/each}
            <div class="swiper-slide">
                <div class="bg-indigo-50 rounded-2xl min-h-96 flex flex-col justify-center items-center">
                    <div bind:this={lastSlideTextTarget} class="text-3xl font-semibold text-indigo-600 p-5 text-center">dddddddddddddddd</div>
                    <div class="w-full relative h-auto p-5 max-w-sm mx-auto text-center">
                        <span class="mx-auto text-9xl">🎉</span>
                    </div>
                </div>
            </div>
        </div>
        <div bind:this={pauseOverlayTarget} data-slider-target="pauseOverlay" class="absolute inset-0 bg-black/50 items-center justify-center z-[999] hidden">
            <p class="text-white text-2xl font-bold">Paused</p>
        </div>

        <div bind:this={slideProgressWrapperTarget} class="progress-wrapper">
            <div class="autoplay-progress">
                <svg bind:this={progressCircleTarget} viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20"></circle>
                </svg>
                <span bind:this={progressContentTarget}></span>
            </div>
        </div>
    </div>
    <div bind:this={bottomPanelTarget} data-slider-target="bottomPanel" class="grid grid-cols-3 items-center fixed bottom-0 bg-white w-full border-t border-gray-200 flex inset-x-0 justify-around items-center p-4 z-50">
        <div class="swiper-pagination mx-auto bg-gray-100"></div>
        <div bind:this={timerDisplayTarget} data-slider-target="timerDisplay" class="timerDisplay text-3xl font-semibold tracking-tight text-indigo-600">
        </div>
        <div class="flex justify-center">
            <button bind:this={pauseButtonTarget} on:click={() => controller.togglePlay()} data-slider-target="pauseButton" data-action="click->slider#togglePlay" type="button" class="inline-flex items-center gap-x-2 rounded bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="6" y="4" width="2" height="12"></rect>
                    <rect x="12" y="4" width="2" height="12"></rect>
                </svg>
                <span>Pause</span>
            </button>
        </div>
        <div class="flex justify-end">
            <button data-slider-target="stopButton" on:click={() => controller.stopWorkout()} data-action="click->slider#stopWorkout" type="button" class="ml-auto inline-flex items-center gap-x-2 rounded rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="5" y="5" width="10" height="10"></rect>
                </svg>
                <span>Finish Early</span>
            </button>
        </div>
    </div>
</div>
