(() => {
  const cartCount = document.querySelector("[data-cart-count]");
  const authLink = document.querySelector("[data-auth-link]");
  const logoutButton = document.querySelector("[data-logout]");
  const status = document.querySelector("[data-header-status]");

  function updateHeader() {
    if (cartCount) {
      const cartLink = cartCount.closest("a");
      try {
        const count = window.FYCart.getCount();
        cartCount.textContent = String(count);
        cartLink?.setAttribute("aria-label", `장바구니, 담긴 수량 ${count}개`);
      } catch (error) {
        cartCount.textContent = "";
        cartLink?.setAttribute("aria-label", "장바구니 수량을 확인할 수 없습니다.");
        if (status) status.textContent = error.message;
        console.error("헤더 장바구니 수량을 갱신하지 못했습니다.", error);
      }
    }

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
      updateHeader();
      window.location.href = "index.html";
    } catch (error) {
      if (status) status.textContent = "로그아웃하지 못했습니다. 다시 시도해 주세요.";
      console.error("로그아웃 오류:", error);
    }
  });

  document.addEventListener("fy:cart-updated", updateHeader);
  window.addEventListener("fy:auth-updated", updateHeader);
  window.addEventListener("storage", (event) => {
    if (event.key === "fy_cart" || event.key === "fy_session") {
      updateHeader();
    }
  });
  updateHeader();
})();
