(() => {
  const products = window.FIND_YOUR_PRODUCTS || [];
  const labels = window.FIND_YOUR_CATEGORY_LABELS || {};
  const productId = new URLSearchParams(window.location.search).get("id");
  const product = products.find((item) => item.id === productId);
  const pageContent = document.querySelector("#product-page-content");
  const message = document.querySelector("#product-message");

  if (!product) {
    document.title = "상품을 찾을 수 없습니다 | FIND YOUR __";
    document.querySelector("#product-breadcrumb").hidden = true;
    pageContent.hidden = true;
    message.hidden = false;
    return;
  }

  const productImage = document.querySelector("#product-image");
  const price = new Intl.NumberFormat("ko-KR").format(product.price);

  document.title = `${product.name} | FIND YOUR __`;
  document.querySelector("#breadcrumb-category").textContent =
    labels[product.category];
  document.querySelector("#product-category").textContent =
    labels[product.category];
  document.querySelector("#product-name").textContent = product.name;
  document.querySelector("#product-price").textContent = `${price}원`;
  document.querySelector("#product-description").textContent =
    product.description;
  if (product.preorder) {
    const [year, month, day] = product.preorder.date.split("-").map(Number);
    if (!year || !month || !day) {
      throw new Error(`예약배송 날짜 형식이 올바르지 않습니다: ${product.preorder.date}`);
    }
    const dateLabel = `${month}월 ${day}일`;
    const preorderTag = document.querySelector("#product-preorder-tag");
    preorderTag.textContent = `예약배송 · ${dateLabel} 출고`;
    preorderTag.hidden = false;
    const preorderNote = document.querySelector("#product-preorder-note");
    preorderNote.textContent = `${dateLabel}부터 순차 발송됩니다.`;
    preorderNote.hidden = false;
  }
  productImage.src = encodeURI(product.image);
  productImage.alt = product.name;

  function renderOptions(containerSelector, name, options) {
    const container = document.querySelector(containerSelector);
    options.forEach((option) => {
      const label = document.createElement("label");
      label.className = "option-choice";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.value = option;
      input.required = true;
      const text = document.createElement("span");
      text.textContent = option;
      label.append(input, text);
      container.append(label);
    });
  }

  renderOptions("#product-colors", "color", product.colors);
  renderOptions("#product-sizes", "size", product.sizes);

  const reviewSize = document.querySelector("#review-size");
  product.sizes.forEach((size) => {
    const option = document.createElement("option");
    option.value = size;
    option.textContent = size;
    reviewSize.append(option);
  });

  const quantity = document.querySelector("#quantity");
  document.querySelector("#quantity-decrease").addEventListener("click", () => {
    quantity.value = String(Math.max(1, Number(quantity.value) - 1));
  });
  document.querySelector("#quantity-increase").addEventListener("click", () => {
    quantity.value = String(Math.min(10, Number(quantity.value) + 1));
  });
  quantity.addEventListener("change", () => {
    quantity.value = String(
      Math.min(10, Math.max(1, Number(quantity.value) || 1)),
    );
  });

  const cartFeedback = document.querySelector("#cart-feedback");
  const cartFeedbackLinks = document.querySelector("#cart-feedback-links");

  function getSelection() {
    const color = document.querySelector('#product-colors input[name="color"]:checked');
    const size = document.querySelector('#product-sizes input[name="size"]:checked');
    if (!color || !size) {
      cartFeedback.textContent = "색상과 사이즈를 선택해 주세요.";
      cartFeedbackLinks.replaceChildren();
      return null;
    }
    const selectedQuantity = Number(quantity.value);
    if (!Number.isInteger(selectedQuantity) || selectedQuantity < 1 || selectedQuantity > 10) {
      cartFeedback.textContent = "수량은 1개부터 10개까지 선택할 수 있습니다.";
      cartFeedbackLinks.replaceChildren();
      return null;
    }
    return {
      productId: product.id,
      color: color.value,
      size: size.value,
      quantity: selectedQuantity,
    };
  }

  function showCartFeedback(message, includeLinks) {
    cartFeedback.textContent = message;
    cartFeedbackLinks.replaceChildren();
    if (!includeLinks) return;
    const cartLink = document.createElement("a");
    cartLink.href = "cart.html";
    cartLink.textContent = "장바구니로 이동";
    const shopLink = document.createElement("a");
    shopLink.href = "menu.html";
    shopLink.textContent = "쇼핑 계속하기";
    cartFeedbackLinks.append(cartLink, shopLink);
  }

  document.querySelector("#add-to-cart").addEventListener("click", () => {
    const selection = getSelection();
    if (!selection) return;
    try {
      window.FYCart.addItem(selection);
      showCartFeedback("상품을 장바구니에 담았습니다.", true);
    } catch (error) {
      showCartFeedback(error.message, false);
    }
  });

  document.querySelector("#buy-now").addEventListener("click", () => {
    const selection = getSelection();
    if (!selection) return;
    try {
      window.FYCart.setDirectCheckout(selection);
      window.location.href = "checkout.html?mode=direct";
    } catch (error) {
      showCartFeedback(error.message, false);
    }
  });

  const inquiryQuery = new URLSearchParams({
    type: "product",
    product: product.name,
  });
  document.querySelector("#inquiry-link").href =
    `contact.html?${inquiryQuery.toString()}`;

  const imageFrame = document.querySelector("#product-image-frame");
  const canHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
  const imageDialog = document.querySelector("#image-dialog");
  const dialogImage = document.querySelector("#dialog-image");
  const imageMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: no-preference)",
  );
  const zoomState = {
    x: 0,
    y: 0,
    scale: 1,
    scaleStart: 1,
    scaleStartedAt: 0,
    targetPointerX: 0,
    targetPointerY: 0,
    targetScale: 1,
  };
  let imageReady = productImage.complete && productImage.naturalWidth > 0;
  let pointerInside = false;
  let frameWidth = 0;
  let frameHeight = 0;
  let zoomAnimation = null;
  let animationFrame = 0;

  function openImageDialog() {
    dialogImage.src = productImage.src;
    dialogImage.alt = product.name;
    imageDialog.showModal();
  }

  function setZoomScale(scale) {
    zoomState.scaleStart = zoomState.scale;
    zoomState.targetScale = scale;
    zoomState.scaleStartedAt = performance.now();
  }

  function applyZoomTransform() {
    const transform =
      `translate(${zoomState.x}px, ${zoomState.y}px) scale(${zoomState.scale})`;
    if (!zoomAnimation) {
      zoomAnimation = productImage.animate(
        [{ transform }, { transform }],
        { duration: 1000, fill: "both" },
      );
      zoomAnimation.pause();
    }
    zoomAnimation.effect.setKeyframes([
      { transform, offset: 0 },
      { transform, offset: 1 },
    ]);
    zoomAnimation.currentTime = 0;
  }

  function animateZoom(timestamp) {
    const easing = 0.15;
    const progress = Math.min(1, (timestamp - zoomState.scaleStartedAt) / 250);
    const easedProgress = progress * progress * (3 - 2 * progress);
    zoomState.scale =
      zoomState.scaleStart +
      (zoomState.targetScale - zoomState.scaleStart) * easedProgress;
    const maxX = (frameWidth * (zoomState.scale - 1)) / 2;
    const maxY = (frameHeight * (zoomState.scale - 1)) / 2;
    const targetX = -zoomState.targetPointerX * maxX;
    const targetY = -zoomState.targetPointerY * maxY;
    zoomState.x = Math.max(
      -maxX,
      Math.min(maxX, zoomState.x + (targetX - zoomState.x) * easing),
    );
    zoomState.y = Math.max(
      -maxY,
      Math.min(maxY, zoomState.y + (targetY - zoomState.y) * easing),
    );

    const settled =
      Math.abs(zoomState.targetScale - zoomState.scale) < 0.002 &&
      Math.abs(targetX - zoomState.x) < 0.1 &&
      Math.abs(targetY - zoomState.y) < 0.1;
    if (settled) {
      zoomState.scale = zoomState.targetScale;
      zoomState.x = targetX;
      zoomState.y = targetY;
      if (!pointerInside) {
        zoomAnimation?.cancel();
        zoomAnimation = null;
      } else {
        applyZoomTransform();
      }
      animationFrame = 0;
      return;
    }

    applyZoomTransform();
    animationFrame = window.requestAnimationFrame(animateZoom);
  }

  function requestZoomFrame() {
    if (!animationFrame) {
      animationFrame = window.requestAnimationFrame(animateZoom);
    }
  }

  function setZoomTarget(event) {
    if (!imageReady) return;
    const bounds = imageFrame.getBoundingClientRect();
    frameWidth = imageFrame.clientWidth;
    frameHeight = imageFrame.clientHeight;
    const localX = event.clientX - bounds.left - imageFrame.clientLeft;
    const localY = event.clientY - bounds.top - imageFrame.clientTop;
    zoomState.targetPointerX = Math.max(
      -1,
      Math.min(1, (localX - frameWidth / 2) / (frameWidth / 2)),
    );
    zoomState.targetPointerY = Math.max(
      -1,
      Math.min(1, (localY - frameHeight / 2) / (frameHeight / 2)),
    );
    requestZoomFrame();
  }

  function startZoom(event) {
    if (!imageReady) return;
    pointerInside = true;
    imageFrame.classList.add("is-zoomed");
    setZoomScale(2.5);
    setZoomTarget(event);
  }

  function stopZoom() {
    pointerInside = false;
    imageFrame.classList.remove("is-zoomed");
    zoomState.targetPointerX = 0;
    zoomState.targetPointerY = 0;
    setZoomScale(1);
    requestZoomFrame();
  }

  productImage.addEventListener("load", () => {
    imageReady = productImage.naturalWidth > 0;
  });
  productImage.addEventListener("error", () => {
    imageReady = false;
    stopZoom();
  });

  if (canHover && imageMotionQuery.matches) {
    imageFrame.addEventListener("pointerenter", startZoom);
    imageFrame.addEventListener("pointermove", setZoomTarget);
    imageFrame.addEventListener("pointerleave", stopZoom);
    imageFrame.addEventListener("focus", () => {
      if (!imageReady) return;
      pointerInside = true;
      zoomState.targetPointerX = 0;
      zoomState.targetPointerY = 0;
      imageFrame.classList.add("is-zoomed");
      setZoomScale(2.5);
      requestZoomFrame();
    });
    imageFrame.addEventListener("blur", stopZoom);
  } else if (!canHover) {
    imageFrame.addEventListener("click", openImageDialog);
  }
  imageFrame.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openImageDialog();
    }
  });
  document
    .querySelector("#image-dialog-close")
    .addEventListener("click", () => imageDialog.close());

  const detailImage = document.querySelector("#detail-image");
  const detailPlaceholder = document.querySelector("#detail-image-placeholder");
  detailImage.alt = `${product.name} 상품 소개`;
  detailImage.addEventListener("load", () => {
    detailImage.hidden = false;
    detailPlaceholder.hidden = true;
  });
  detailImage.addEventListener("error", () => {
    detailImage.hidden = true;
    detailPlaceholder.hidden = false;
  });
  const detailImagePath = `images/detail/${product.id}.jpg`;
  if (window.location.protocol !== "file:") {
    fetch(encodeURI(detailImagePath), { method: "HEAD" })
      .then((response) => {
        if (response.ok) {
          detailImage.src = encodeURI(detailImagePath);
        } else if (response.status !== 404) {
          detailPlaceholder.textContent = "상품 소개 이미지를 불러오지 못했습니다.";
        }
      })
      .catch(() => {
        detailPlaceholder.textContent = "상품 소개 이미지를 불러오지 못했습니다.";
      });
  }

  const relatedProducts = document.querySelector("#related-products");
  products
    .filter(
      (item) =>
        item.id !== product.id && item.categories.includes(product.category),
    )
    .slice(0, 4)
    .forEach((item) => {
      const card = document.createElement("li");
      const link = document.createElement("a");
      link.className = "related-card";
      link.href = `product.html?id=${encodeURIComponent(item.id)}`;
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      image.src = encodeURI(item.image);
      image.alt = item.name;
      const name = document.createElement("p");
      name.className = "related-card-name";
      name.textContent = item.name;
      const itemPrice = document.createElement("p");
      itemPrice.className = "related-card-price";
      itemPrice.textContent = `${new Intl.NumberFormat("ko-KR").format(item.price)}원`;
      figure.append(image);
      link.append(figure, name, itemPrice);
      card.append(link);
      relatedProducts.append(card);
    });

  setupReviews(product);

  function setupReviews(currentProduct) {
    const reviewList = document.querySelector("#review-list");
    const moreButton = document.querySelector("#review-more");
    const emptyMessage = document.querySelector("#review-empty");
    const sortControl = document.querySelector("#review-sort");
    const ratingFilter = document.querySelector("#review-rating-filter");
    const photoFilter = document.querySelector("#photo-review-filter");
    const reviewForm = document.querySelector("#review-form");
    const formStatus = document.querySelector("#review-form-status");
    const user = window.FYAuth.getCurrentUser();
    const storageKey = `fy_reviews_${currentProduct.id}`;
    const helpfulKey = user
      ? `fy_helpful_${user.id}_${currentProduct.id}`
      : null;
    const examples = window.FIND_YOUR_SAMPLE_REVIEWS[currentProduct.id] || [];
    const promptTimers = new WeakMap();
    let visibleCount = 3;
    let userReviews = readUserReviews();
    let helpfulVotes = readHelpfulVotes();

    function showStorageError(error) {
      formStatus.textContent =
        "브라우저 저장소를 사용할 수 없습니다. 리뷰를 표시하거나 저장하지 못할 수 있습니다.";
      console.error("상품 리뷰 저장소 오류:", error);
    }

    function readUserReviews() {
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
        return Array.isArray(stored)
          ? stored.filter(
              (review) =>
                review &&
                typeof review.id === "string" &&
                typeof review.content === "string" &&
                Number.isInteger(review.rating) &&
                review.rating >= 1 &&
                review.rating <= 5,
            )
          : [];
      } catch (error) {
        showStorageError(error);
        return [];
      }
    }

    function readHelpfulVotes() {
      if (!user) return new Set();
      try {
        const stored = JSON.parse(localStorage.getItem(helpfulKey) || "[]");
        return new Set(
          Array.isArray(stored)
            ? stored.filter((reviewId) => typeof reviewId === "string")
            : [],
        );
      } catch (error) {
        showStorageError(error);
        return new Set();
      }
    }

    function allReviews() {
      return [...userReviews, ...examples];
    }

    function saveUserReviews() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(userReviews));
        return true;
      } catch (error) {
        showStorageError(error);
        return false;
      }
    }

    function saveHelpfulVotes() {
      try {
        localStorage.setItem(helpfulKey, JSON.stringify([...helpfulVotes]));
        return true;
      } catch (error) {
        showStorageError(error);
        return false;
      }
    }

    function createLoginPrompt() {
      const prompt = document.createElement("p");
      prompt.className = "review-login-prompt";
      prompt.setAttribute("role", "status");
      prompt.setAttribute("aria-live", "polite");
      const link = document.createElement("a");
      link.href = "login.html";
      link.textContent = "로그인";
      prompt.append("로그인 후 이용하실 수 있습니다. ", link);
      prompt.hidden = true;
      prompt.addEventListener("focusout", () => {
        window.setTimeout(() => {
          if (!prompt.contains(document.activeElement)) prompt.hidden = true;
        });
      });
      return prompt;
    }

    function showLoginPrompt(prompt) {
      prompt.hidden = false;
      window.clearTimeout(promptTimers.get(prompt));
      const timer = window.setTimeout(() => {
        if (!prompt.contains(document.activeElement)) prompt.hidden = true;
      }, 3500);
      promptTimers.set(prompt, timer);
    }

    function updateSummary(reviews) {
      const total = reviews.length;
      const average = total
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
        : 0;
      const score = document.querySelector("#review-average-score");
      score.textContent = `${average.toFixed(1)} / 5`;
      score.setAttribute("aria-label", `별 5개 중 평균 ${average.toFixed(1)}개`);
      document.querySelector("#review-count").textContent =
        `총 ${total}개의 리뷰`;

      const distribution = document.querySelector("#rating-distribution");
      distribution.replaceChildren();
      for (let rating = 5; rating >= 1; rating -= 1) {
        const count = reviews.filter(
          (review) => review.rating === rating,
        ).length;
        const row = document.createElement("div");
        row.className = "rating-row";
        const title = document.createElement("span");
        title.textContent = `${rating}점`;
        const progress = document.createElement("progress");
        progress.max = total || 1;
        progress.value = count;
        progress.setAttribute("aria-label", `${rating}점 리뷰 ${count}개`);
        const amount = document.createElement("output");
        amount.textContent = String(count);
        row.append(title, progress, amount);
        distribution.append(row);
      }

      const fitSummary = document.querySelector("#fit-summary");
      fitSummary.replaceChildren();
      ["정사이즈", "작아요", "커요"].forEach((fit) => {
        const count = reviews.filter((review) => review.fit === fit).length;
        const row = document.createElement("p");
        row.className = "fit-summary-row";
        const label = document.createElement("span");
        label.textContent = fit;
        const percent = document.createElement("span");
        percent.textContent = `${total ? Math.round((count / total) * 100) : 0}%`;
        row.append(label, percent);
        fitSummary.append(row);
      });
    }

    function getFilteredReviews() {
      const rating = Number(ratingFilter.value);
      const reviews = allReviews().filter((review) => {
        return (
          (!rating || review.rating === rating) &&
          (!photoFilter.checked || review.photo)
        );
      });
      if (sortControl.value === "high") {
        reviews.sort(
          (left, right) =>
            right.rating - left.rating || right.date.localeCompare(left.date),
        );
      } else if (sortControl.value === "low") {
        reviews.sort(
          (left, right) =>
            left.rating - right.rating || right.date.localeCompare(left.date),
        );
      } else {
        reviews.sort((left, right) => right.date.localeCompare(left.date));
      }
      return reviews;
    }

    function createReviewItem(review) {
      const item = document.createElement("li");
      item.className = "review-item";
      const header = document.createElement("div");
      header.className = "review-item-header";
      const author = document.createElement("span");
      author.className = "review-author";
      author.textContent = review.name;
      const stars = document.createElement("span");
      stars.className = "review-stars";
      stars.textContent = `${review.rating} / 5`;
      stars.setAttribute("aria-label", `별 5개 중 ${review.rating}개`);
      const date = document.createElement("time");
      date.className = "review-date";
      date.dateTime = review.date.replaceAll(".", "-");
      date.textContent = review.date;
      header.append(author, stars, date);

      const tags = document.createElement("div");
      tags.className = "review-tags";
      [review.size, review.fit, ...(review.photo ? ["사진 리뷰"] : [])].forEach(
        (value) => {
          const tag = document.createElement("span");
          tag.className = "review-tag";
          tag.textContent = value;
          tags.append(tag);
        },
      );

      const content = document.createElement("p");
      content.className = "review-content";
      content.textContent = review.content;
      const helpful = document.createElement("button");
      helpful.className = "review-helpful";
      helpful.type = "button";
      helpful.setAttribute("aria-disabled", String(!user));
      const loginPrompt = createLoginPrompt();
      const helpfulGroup = document.createElement("div");
      helpfulGroup.className = "review-helpful-group";

      function updateHelpfulButton() {
        const active = helpfulVotes.has(review.id);
        helpful.setAttribute("aria-pressed", String(active));
        helpful.classList.toggle("is-active", active);
        helpful.textContent = `도움돼요 ${review.helpful + Number(active)}${active ? " · 취소" : ""}`;
      }

      updateHelpfulButton();
      helpful.addEventListener("focus", () => {
        if (!user) showLoginPrompt(loginPrompt);
      });
      helpful.addEventListener("click", () => {
        if (!user) {
          showLoginPrompt(loginPrompt);
          return;
        }
        const wasActive = helpfulVotes.has(review.id);
        if (wasActive) {
          helpfulVotes.delete(review.id);
        } else {
          helpfulVotes.add(review.id);
        }
        if (!saveHelpfulVotes()) {
          if (wasActive) {
            helpfulVotes.add(review.id);
          } else {
            helpfulVotes.delete(review.id);
          }
        }
        updateHelpfulButton();
      });

      helpfulGroup.append(helpful, loginPrompt);
      item.append(header, tags, content, helpfulGroup);
      return item;
    }

    function renderReviews() {
      const reviews = getFilteredReviews();
      const visibleReviews = reviews.slice(0, visibleCount);
      reviewList.replaceChildren(...visibleReviews.map(createReviewItem));
      emptyMessage.hidden = reviews.length > 0;
      moreButton.hidden = reviews.length <= visibleCount;
      updateSummary(allReviews());
    }

    [sortControl, ratingFilter, photoFilter].forEach((control) => {
      control.addEventListener("change", () => {
        visibleCount = 3;
        renderReviews();
      });
    });
    moreButton.addEventListener("click", () => {
      visibleCount += 3;
      renderReviews();
    });

    const formLoginPrompt = createLoginPrompt();
    reviewForm.append(formLoginPrompt);
    reviewForm.addEventListener("focusin", () => {
      if (!user) showLoginPrompt(formLoginPrompt);
    });
    reviewForm
      .querySelector('[type="submit"]')
      .addEventListener("click", () => {
        if (!user) showLoginPrompt(formLoginPrompt);
      });
    reviewForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!user) {
        showLoginPrompt(formLoginPrompt);
        return;
      }
      if (!reviewForm.reportValidity()) return;

      const formData = new FormData(reviewForm);
      const enteredName = String(formData.get("name")).trim();
      const enteredContent = String(formData.get("content")).trim();
      if (!enteredName) {
        formStatus.textContent = "이름을 입력해 주세요.";
        reviewForm.elements.name.focus();
        return;
      }
      if (enteredContent.length < 10) {
        formStatus.textContent = "리뷰 내용은 10자 이상 입력해 주세요.";
        reviewForm.elements.content.focus();
        return;
      }
      const characters = Array.from(enteredName);
      const maskedName =
        characters.length > 2
          ? `${characters[0]}*${characters[characters.length - 1]}`
          : `${characters[0]}*`;
      const today = new Date();
      const date = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join(".");
      const review = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: maskedName,
        date,
        rating: Number(formData.get("rating")),
        size: String(formData.get("size")),
        fit: String(formData.get("fit")),
        content: enteredContent,
        photo: false,
        helpful: 0,
        sample: false,
      };

      userReviews = [review, ...userReviews];
      if (!saveUserReviews()) {
        userReviews = userReviews.filter((item) => item.id !== review.id);
        return;
      }
      reviewForm.reset();
      sortControl.value = "latest";
      ratingFilter.value = "0";
      photoFilter.checked = false;
      visibleCount = 3;
      formStatus.textContent =
        "리뷰가 이 기기에 저장되어 목록에 추가되었습니다. 서버로 전송되지는 않았습니다.";
      renderReviews();
      document.querySelector("#review").scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    });

    renderReviews();
  }
})();
