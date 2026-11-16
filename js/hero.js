(() => {
  const slider = document.querySelector(".hero-slider");
  const hero = document.querySelector(".hero");
  const count = document.querySelector(".hero-count");
  const previous = document.querySelector(".hero-prev");
  const next = document.querySelector(".hero-next");

  if (
    !slider ||
    !hero ||
    !count ||
    !previous ||
    !next ||
    typeof Swiper === "undefined"
  ) {
    return;
  }

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const swiper = new Swiper(slider, {
    loop: true,
    speed: reducedMotion ? 0 : 800,
    slidesPerView: 1,
    slidesPerGroup: 1,
    resistanceRatio: 0.65,
    threshold: 8,
    longSwipesRatio: 0.3,
    longSwipesMs: 300,
    shortSwipes: true,
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
    autoplay: reducedMotion
      ? false
      : {
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
        },
    on: {
      init(instance) {
        updateCount(instance);
      },
      slideChange(instance) {
        updateCount(instance);
      },
    },
  });

  function updateCount(instance) {
    count.textContent = `${String(instance.realIndex + 1).padStart(2, "0")} / 05`;
  }

  function resumeAutoplay() {
    if (
      !reducedMotion &&
      document.visibilityState === "visible" &&
      !hero.matches(":hover") &&
      !hero.matches(":focus-within")
    ) {
      swiper.autoplay.start();
    }
  }

  function pauseAutoplay() {
    if (!reducedMotion) {
      swiper.autoplay.stop();
    }
  }

  previous.addEventListener("click", () => swiper.slidePrev());
  next.addEventListener("click", () => swiper.slideNext());

  hero.addEventListener("mouseenter", pauseAutoplay);
  hero.addEventListener("mouseleave", resumeAutoplay);
  hero.addEventListener("focusin", pauseAutoplay);
  hero.addEventListener("focusout", (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      resumeAutoplay();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      pauseAutoplay();
    } else {
      resumeAutoplay();
    }
  });
})();
