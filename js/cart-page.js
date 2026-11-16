(() => {
  const list = document.querySelector("[data-cart-list]");
  const empty = document.querySelector("[data-cart-empty]");
  const controls = document.querySelector("[data-cart-controls]");
  const status = document.querySelector("[data-cart-status]");
  const numberFormat = new Intl.NumberFormat("ko-KR");

  function money(amount) {
    return `${numberFormat.format(amount)}원`;
  }

  function createItem(item) {
    const product = window.FYCart.productFor(item.productId);
    const key = window.FYCart.getKey(item);
    const row = document.createElement("li");
    row.className = "cart-item";
    row.dataset.itemKey = key;
    const select = document.createElement("input");
    select.className = "cart-select";
    select.type = "checkbox";
    select.name = "cart-selected";
    select.value = key;
    select.setAttribute("aria-label", `${product.name} 삭제 대상 선택`);
    const image = document.createElement("img");
    image.src = encodeURI(product.image);
    image.alt = product.name;
    const info = document.createElement("div");
    info.className = "cart-item-info";
    const title = document.createElement("h2");
    title.textContent = product.name;
    const option = document.createElement("p");
    option.textContent = `색상 ${item.color} / 사이즈 ${item.size}`;
    const unitPrice = document.createElement("p");
    unitPrice.textContent = `단가 ${money(product.price)}`;
    if (product.preorder) {
      const preorder = document.createElement("p");
      preorder.className = "preorder-note";
      preorder.textContent = `${formatPreorderDate(product.preorder.date)} 출고 예정`;
      info.append(preorder);
    }
    const subtotal = document.createElement("p");
    subtotal.textContent = `소계 ${money(product.price * item.quantity)}`;
    const itemControls = document.createElement("div");
    itemControls.className = "cart-item-controls";
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", `${product.name} 수량 줄이기`);
    decrease.disabled = item.quantity <= 1;
    decrease.addEventListener("click", () => changeQuantity(key, item.quantity - 1));
    const quantity = document.createElement("input");
    quantity.type = "number";
    quantity.min = "1";
    quantity.max = "10";
    quantity.value = String(item.quantity);
    quantity.setAttribute("aria-label", `${product.name} 수량`);
    quantity.addEventListener("change", () => changeQuantity(key, Number(quantity.value)));
    const increase = document.createElement("button");
    increase.type = "button";
    increase.textContent = "+";
    increase.setAttribute("aria-label", `${product.name} 수량 늘리기`);
    increase.disabled = item.quantity >= 10;
    increase.addEventListener("click", () => changeQuantity(key, item.quantity + 1));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "삭제";
    remove.addEventListener("click", () => {
      window.FYCart.removeItems([key]);
      status.textContent = "상품을 삭제했습니다.";
    });
    itemControls.append(decrease, quantity, increase, remove);
    info.append(title, option, unitPrice, subtotal, itemControls);
    row.append(select, image, info);
    return row;
  }

  function formatPreorderDate(date) {
    const [, month, day] = date.split("-").map(Number);
    if (!month || !day) throw new Error("예약배송 날짜 형식이 올바르지 않습니다.");
    return `${month}월 ${day}일`;
  }

  function changeQuantity(key, quantity) {
    try {
      window.FYCart.updateQuantity(key, quantity);
      status.textContent = "";
    } catch (error) {
      status.textContent = error.message;
      render();
    }
  }

  function render() {
    try {
      const items = window.FYCart.getItems();
      list.replaceChildren(...items.map(createItem));
      const hasItems = items.length > 0;
      empty.hidden = hasItems;
      controls.hidden = !hasItems;
      if (!hasItems) return;

      const pricing = window.FYPricing.calculatePricing(items, null);
      document.querySelector("[data-subtotal]").textContent = money(pricing.subtotal);
      document.querySelector("[data-shipping]").textContent = money(pricing.shipping);
      document.querySelector("[data-total]").textContent = money(pricing.total);
      const progress = document.querySelector("[data-shipping-progress]");
      progress.max = pricing.freeShippingThreshold;
      progress.value = Math.min(
        pricing.subtotal,
        pricing.freeShippingThreshold,
      );
      document.querySelector("[data-shipping-message]").textContent =
        pricing.remainingForFreeShipping > 0
          ? `${money(pricing.remainingForFreeShipping)} 더 담으면 무료배송입니다.`
          : "무료배송 기준을 충족했습니다.";
    } catch (error) {
      console.error("장바구니를 표시하지 못했습니다.", error);
      status.textContent = error.message || "장바구니를 불러오지 못했습니다.";
      empty.hidden = true;
      controls.hidden = true;
    }
  }

  document.querySelector("[data-delete-selected]").addEventListener("click", () => {
    const selected = Array.from(
      list.querySelectorAll('input[name="cart-selected"]:checked'),
      (input) => input.value,
    );
    if (selected.length === 0) {
      status.textContent = "삭제할 상품을 선택해 주세요.";
      return;
    }
    window.FYCart.removeItems(selected);
    status.textContent = "선택한 상품을 삭제했습니다.";
  });

  window.addEventListener("fy:cart-updated", render);
  render();
})();
