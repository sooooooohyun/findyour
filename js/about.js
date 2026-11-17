(() => {
  const storyList = document.querySelector(".story-list");
  const items = storyList?.querySelectorAll(".story-item");

  if (
    !storyList ||
    !items?.length ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !("IntersectionObserver" in window)
  ) {
    return;
  }

  const pendingReveals = new WeakMap();
  storyList.classList.add("is-animated");

  const observer = new IntersectionObserver(
    (entries) => {
      let delay = 0;
      entries
        .slice()
        .sort(
          (left, right) =>
            left.boundingClientRect.top - right.boundingClientRect.top,
        )
        .forEach((entry) => {
          const item = entry.target;
          if (entry.isIntersecting) {
            if (item.classList.contains("is-visible") || pendingReveals.has(item)) {
              return;
            }
            const timer = window.setTimeout(() => {
              item.classList.add("is-visible");
              pendingReveals.delete(item);
            }, delay);
            pendingReveals.set(item, timer);
            delay += 90;
            return;
          }

          const timer = pendingReveals.get(item);
          if (timer !== undefined) {
            window.clearTimeout(timer);
            pendingReveals.delete(item);
          }
          if (item.getBoundingClientRect().top > 0) {
            item.classList.remove("is-visible");
          } else {
            item.classList.add("is-visible");
          }
        });
    },
    { threshold: 0.12 },
  );

  items.forEach((item) => observer.observe(item));
})();
