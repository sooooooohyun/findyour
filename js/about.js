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

  storyList.classList.add("is-animated");

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;

      observer.disconnect();
      items.forEach((item, index) => {
        window.setTimeout(() => item.classList.add("is-visible"), index * 100);
      });
    },
    { threshold: 0.15 },
  );

  observer.observe(storyList);
})();
