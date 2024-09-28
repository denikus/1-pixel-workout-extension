<script>
  // import Autoplay from "embla-carousel-autoplay";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Carousel from "$lib/components/ui/carousel/index.js";
  import { onMount, onDestroy } from 'svelte';
  import SlideTimer from './components/SlideTimer.svelte';

  let timer;
  let api;
  let initialTime = 20;

  function handleSlide(slide) {
    if (timer && timer.startTimer) {
      timer.startTimer();
    }
  }

  function handleTimeUp() {
    if (api) {
      api.scrollNext();
    }
  }


  $: if (api) {
    api.on('slidesInView', handleSlide);
  }

  onDestroy(() => {
    if (api) {
      api.off('slidesInView', handleSlide);
    }
  });

</script>

<main>
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="flex min-h[800] w-full justify-center p-10 items-center">
            <Carousel.Root bind:api class="w-full max-w-xs"

            >
                <Carousel.Content>
                    <Carousel.Item>
                        <div class="p-1">
                            <Card.Root>
                                <Card.Content
                                    class="flex aspect-square items-center justify-center p-6"
                                >
                                    <div>
                                        <div class="text-xl font-semibold">
                                            Squats
                                        </div>
                                    </div>
                                </Card.Content>
                            </Card.Root>
                        </div>
                    </Carousel.Item>

                    <Carousel.Item>
                        <div class="p-1">
                            <Card.Root>
                                <Card.Content
                                    class="flex aspect-square items-center justify-center p-6"
                                >
                                    <div>
                                        <div class="text-xl font-semibold">
                                            Push Ups
                                        </div>
                                    </div>
                                    <div></div>
                                </Card.Content>
                            </Card.Root>
                        </div>
                    </Carousel.Item>
                </Carousel.Content>
                <Carousel.Previous />
                <Carousel.Next />
            </Carousel.Root>
            <SlideTimer bind:this={timer} onTimeUp={handleTimeUp} initialTime={initialTime}></SlideTimer>
        </div>
    </div>
</main>
