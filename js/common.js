(() => {
  const authLink = document.querySelector("[data-auth-link]");
  const logoutButton = document.querySelector("[data-logout]");
  const status = document.querySelector("[data-header-status]");
  const hiddenCartPages = new Set([
    "cart.html",
    "checkout.html",
    "order-complete.html",
  ]);
  const currentPage = window.location.pathname.split("/").pop();
  const canPreviewCart = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  );
  let floatingCart = null;
  let floatingCartWrap = null;
  let cartCountLabel = null;
  let previewImage = null;
  let previewName = null;
  let previewQuantity = null;
  let previewOptions = null;
  let previewEmpty = null;
  let previewItem = null;
  let previewNavigation = null;
  let previewPosition = null;
  let previousItemButton = null;
  let nextItemButton = null;
  let previewItems = [];
  let previewIndex = 0;
  let closePreviewTimer = null;
  let previewDismissed = false;

  if (!hiddenCartPages.has(currentPage)) {
    floatingCartWrap = document.createElement("div");
    floatingCartWrap.className = "floating-cart-wrap";

    const preview = document.createElement("section");
    preview.id = "floating-cart-preview";
    preview.className = "floating-cart-popover";
    preview.setAttribute("role", "region");
    preview.setAttribute("aria-label", "장바구니 미리보기");
    preview.hidden = true;

    previewEmpty = document.createElement("p");
    previewEmpty.className = "floating-cart-empty";
    previewEmpty.textContent = "담긴 상품이 없습니다.";

    previewItem = document.createElement("div");
    previewItem.className = "floating-cart-item";
    const imageFrame = document.createElement("div");
    imageFrame.className = "floating-cart-image";
    previewImage = document.createElement("img");
    previewImage.alt = "";
    previewImage.addEventListener("error", () => {
      previewImage.hidden = true;
    });
    imageFrame.append(previewImage);

    const previewCopy = document.createElement("div");
    previewCopy.className = "floating-cart-copy";
    previewName = document.createElement("strong");
    previewName.className = "floating-cart-name";
    previewQuantity = document.createElement("span");
    previewQuantity.className = "floating-cart-quantity";
    previewOptions = document.createElement("span");
    previewOptions.className = "floating-cart-options";
    previewCopy.append(previewName, previewQuantity, previewOptions);
    previewItem.append(imageFrame, previewCopy);

    previewNavigation = document.createElement("div");
    previewNavigation.className = "floating-cart-navigation";
    previousItemButton = document.createElement("button");
    previousItemButton.type = "button";
    previousItemButton.setAttribute("aria-label", "이전 상품");
    previousItemButton.textContent = "‹";
    previewPosition = document.createElement("span");
    previewPosition.setAttribute("aria-live", "polite");
    nextItemButton = document.createElement("button");
    nextItemButton.type = "button";
    nextItemButton.setAttribute("aria-label", "다음 상품");
    nextItemButton.textContent = "›";
    previewNavigation.append(
      previousItemButton,
      previewPosition,
      nextItemButton,
    );

    const previewLink = document.createElement("a");
    previewLink.className = "floating-cart-view";
    previewLink.href = "cart.html";
    previewLink.textContent = "장바구니 보기";
    preview.append(
      previewEmpty,
      previewItem,
      previewNavigation,
      previewLink,
    );

    floatingCart = document.createElement("a");
    floatingCart.className = "floating-cart";
    floatingCart.href = "cart.html";
    floatingCart.setAttribute("aria-label", "장바구니, 상품 0개");
    floatingCart.setAttribute("aria-controls", preview.id);
    floatingCart.setAttribute("aria-expanded", "false");

    const text = document.createElement("span");
    text.textContent = "CART";
    cartCountLabel = document.createElement("span");
    cartCountLabel.textContent = "0";
    floatingCart.append(text, cartCountLabel);
    floatingCartWrap.append(floatingCart, preview);
    document.body.append(floatingCartWrap);
    document.body.classList.add("has-floating-cart");
  }

  function renderCartPreview(items) {
    if (!previewItem) return;
    previewItems = items;
    previewEmpty.textContent = "담긴 상품이 없습니다.";
    if (previewItems.length === 0) {
      previewEmpty.hidden = false;
      previewItem.hidden = true;
      previewNavigation.hidden = true;
      return;
    }

    previewIndex = Math.min(previewIndex, previewItems.length - 1);
    const item = previewItems[previewIndex];
    const product = window.FYCart.productFor(item.productId);
    previewEmpty.hidden = true;
    previewItem.hidden = false;
    previewNavigation.hidden = previewItems.length < 2;
    previewName.textContent = product.name;
    previewQuantity.textContent = `${item.quantity}개`;
    previewOptions.textContent = `${item.color} · ${item.size}`;
    previewPosition.textContent = `${previewIndex + 1} / ${previewItems.length}`;
    previewImage.hidden = !product.image;
    if (product.image) previewImage.src = product.image;
  }

  function setPreviewOpen(open) {
    if (!floatingCartWrap || !canPreviewCart.matches) return;
    const preview = floatingCartWrap.querySelector(".floating-cart-popover");
    preview.hidden = !open;
    floatingCartWrap.classList.toggle("is-open", open);
    floatingCart.setAttribute("aria-expanded", String(open));
  }

  function schedulePreviewClose() {
    window.clearTimeout(closePreviewTimer);
    closePreviewTimer = window.setTimeout(() => {
      if (
        floatingCartWrap.matches(":hover") ||
        floatingCartWrap.contains(document.activeElement)
      ) {
        return;
      }
      setPreviewOpen(false);
    }, 140);
  }

  if (floatingCartWrap) {
    floatingCartWrap.addEventListener("pointerenter", () => {
      if (!canPreviewCart.matches) return;
      window.clearTimeout(closePreviewTimer);
      previewDismissed = false;
      setPreviewOpen(true);
    });
    floatingCartWrap.addEventListener("pointerleave", schedulePreviewClose);
    floatingCartWrap.addEventListener("focusin", () => {
      if (!previewDismissed) setPreviewOpen(true);
    });
    floatingCartWrap.addEventListener("focusout", (event) => {
      if (!floatingCartWrap.contains(event.relatedTarget)) {
        previewDismissed = false;
        schedulePreviewClose();
      }
    });
    floatingCartWrap.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      previewDismissed = true;
      setPreviewOpen(false);
      floatingCart.focus();
    });
    previousItemButton.addEventListener("click", () => {
      previewIndex =
        (previewIndex - 1 + previewItems.length) % previewItems.length;
      renderCartPreview(previewItems);
    });
    nextItemButton.addEventListener("click", () => {
      previewIndex = (previewIndex + 1) % previewItems.length;
      renderCartPreview(previewItems);
    });
  }

  function updateCart() {
    if (!floatingCart) return;
    try {
      const count = window.FYCart.getCount();
      cartCountLabel.textContent = String(count);
      floatingCart.setAttribute("aria-label", `장바구니, 상품 ${count}개`);
      renderCartPreview(window.FYCart.getItems());
    } catch (error) {
      cartCountLabel.textContent = "—";
      floatingCart.setAttribute(
        "aria-label",
        "장바구니 수량을 확인할 수 없습니다.",
      );
      if (status) status.textContent = error.message;
      if (previewEmpty) {
        previewEmpty.textContent = "장바구니 정보를 불러오지 못했습니다.";
        previewEmpty.hidden = false;
        previewItem.hidden = true;
        previewNavigation.hidden = true;
      }
      console.error("플로팅 장바구니 수량을 갱신하지 못했습니다.", error);
    }
  }

  function pulseCart() {
    if (
      !floatingCart ||
      !window.matchMedia("(prefers-reduced-motion: no-preference)").matches
    ) {
      return;
    }
    floatingCart.classList.remove("is-pulsing");
    void floatingCart.offsetWidth;
    floatingCart.classList.add("is-pulsing");
  }

  function updateAuth() {
    if (!authLink || !window.FYAuth) return;
    try {
      const user = window.FYAuth.getCurrentUser();
      authLink.href = user ? "mypage.html" : "login.html";
      authLink.textContent = user ? "MY" : "LOGIN";
      if (logoutButton) logoutButton.hidden = !user;
    } catch (error) {
      if (status) status.textContent = error.message;
      console.error("헤더 회원 상태를 갱신하지 못했습니다.", error);
    }
  }

  logoutButton?.addEventListener("click", () => {
    try {
      window.FYAuth.logout();
      window.dispatchEvent(new Event("fy:auth-updated"));
      updateAuth();
      window.location.href = "index.html";
    } catch (error) {
      if (status) status.textContent = "로그아웃하지 못했습니다. 다시 시도해 주세요.";
      console.error("로그아웃 오류:", error);
    }
  });

  document.addEventListener("fy:cart-updated", updateCart);
  document.addEventListener("fy:cart-item-added", pulseCart);
  window.addEventListener("fy:auth-updated", updateAuth);
  window.addEventListener("storage", (event) => {
    if (event.key === "fy_cart") updateCart();
    if (event.key === "fy_session") updateAuth();
  });
  updateCart();
  updateAuth();
})();
