(() => {
  const form = document.querySelector("[data-checkout-form]");
  const empty = document.querySelector("[data-checkout-empty]");
  const emptyMessage = empty.querySelector("[data-checkout-empty-message]");
  const status = document.querySelector("[data-checkout-status]");
  const dialog = document.querySelector("[data-coupon-dialog]");
  const couponOptions = document.querySelector("[data-coupon-options]");
  const postcode = form.elements.postcode;
  const address = form.elements.address;
  const addressDetail = form.elements.addressDetail;
  const addressSearchButton = document.querySelector("[data-open-address]");
  const addressDialog = document.querySelector("[data-address-dialog]");
  const postcodeFrame = document.querySelector("[data-postcode-frame]");
  const addressStatus = document.querySelector("[data-address-status]");
  const user = window.FYAuth.getCurrentUser();
  const savedAddressKey = user ? `fy_shipping_address_${user.id}` : null;
  const directMode = new URLSearchParams(window.location.search).get("mode") === "direct";
  const numberFormat = new Intl.NumberFormat("ko-KR");
  let items = [];
  let appliedCoupon = null;
  let addressSearchReady = false;
  let addressSearchFailed = false;

  function money(amount) {
    return `${numberFormat.format(amount)}원`;
  }

  function announceAddressStatus(message) {
    addressStatus.textContent = message;
    addressStatus.hidden = !message;
  }

  function enableManualAddress(error) {
    if (addressSearchFailed) return;
    addressSearchFailed = true;
    addressSearchReady = false;
    postcode.readOnly = false;
    address.readOnly = false;
    addressSearchButton.hidden = true;
    announceAddressStatus(
      "주소 검색 서비스를 불러오지 못했습니다. 우편번호와 도로명 주소를 직접 입력해 주세요.",
    );
    console.error("주소 검색 CDN을 불러오지 못했습니다.", error);
  }

  function initializeAddressSearch() {
    announceAddressStatus("주소 검색 서비스를 불러오고 있습니다.");
    const script = document.createElement("script");
    script.src =
      "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    const timeout = window.setTimeout(() => {
      enableManualAddress(new Error("주소 검색 스크립트 로드 시간이 초과되었습니다."));
    }, 10000);
    script.addEventListener("load", () => {
      window.clearTimeout(timeout);
      if (addressSearchFailed) return;
      if (typeof window.daum?.Postcode !== "function") {
        enableManualAddress(new Error("주소 검색 기능을 사용할 수 없습니다."));
        return;
      }
      addressSearchReady = true;
      addressSearchButton.disabled = false;
      if (addressStatus.textContent === "주소 검색 서비스를 불러오고 있습니다.") {
        announceAddressStatus("");
      }
    });
    script.addEventListener("error", () => {
      window.clearTimeout(timeout);
      enableManualAddress(new Error("주소 검색 스크립트를 요청하지 못했습니다."));
    });
    document.head.append(script);
  }

  function loadSavedAddress() {
    if (!user) return null;
    try {
      const saved = localStorage.getItem(savedAddressKey);
      if (saved === null) return null;
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object") {
        throw new Error("저장된 배송지 형식이 올바르지 않습니다.");
      }
      return {
        postcode: typeof parsed.postcode === "string" ? parsed.postcode : "",
        address: typeof parsed.address === "string" ? parsed.address : "",
        addressDetail:
          typeof parsed.addressDetail === "string" ? parsed.addressDetail : "",
      };
    } catch (error) {
      console.error("회원 배송지를 읽지 못했습니다.", error);
      announceAddressStatus(
        "저장된 배송지를 불러오지 못했습니다. 주소를 다시 입력해 주세요.",
      );
      return null;
    }
  }

  function saveLastShippingAddress(values) {
    if (!user) return;
    localStorage.setItem(savedAddressKey, JSON.stringify(values));
  }

  function loadItems() {
    if (directMode) {
      const item = window.FYCart.getDirectCheckout();
      return item ? [item] : [];
    }
    return window.FYCart.getItems();
  }

  function snapshotItems() {
    return items.map((item) => {
      const product = window.FYCart.productFor(item.productId);
      return {
        productId: product.id,
        name: product.name,
        image: product.image,
        unitPrice: product.price,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        preorder: product.preorder || null,
      };
    });
  }

  function renderItems(focusIndex = null, focusAction = null) {
    const container = document.querySelector("[data-checkout-items]");
    container.replaceChildren();
    const orderItems = snapshotItems();
    if (orderItems.length === 0) {
      form.hidden = true;
      empty.hidden = false;
      return;
    }

    form.hidden = false;
    empty.hidden = true;
    orderItems.forEach((item, index) => {
      const row = document.createElement("li");
      row.className = "checkout-item";
      row.dataset.checkoutItemIndex = String(index);
      const thumbnail = document.createElement("span");
      thumbnail.className = "checkout-item-thumbnail";
      thumbnail.setAttribute("aria-hidden", "true");
      if (item.image) {
        const image = document.createElement("img");
        image.src = encodeURI(item.image);
        image.alt = "";
        image.addEventListener("error", () => image.remove(), { once: true });
        thumbnail.append(image);
      }
      const description = document.createElement("div");
      description.className = "checkout-item-description";
      const heading = document.createElement("div");
      heading.className = "checkout-item-heading";
      const name = document.createElement("strong");
      name.className = "checkout-item-name";
      name.textContent = item.name;
      const price = document.createElement("strong");
      price.className = "checkout-item-price";
      price.textContent = money(item.unitPrice * item.quantity);
      const options = document.createElement("p");
      options.className = "checkout-item-options";
      options.textContent = `색상 ${item.color} / 사이즈 ${item.size}`;
      heading.append(name, price);
      description.append(heading, options);
      if (item.preorder) {
        const preorder = document.createElement("p");
        preorder.className = "preorder-note";
        preorder.textContent = `${formatPreorderDate(item.preorder.date)} 출고 예정`;
        description.append(preorder);
      }
      const controls = document.createElement("div");
      controls.className = "checkout-item-controls";
      const decrease = document.createElement("button");
      decrease.type = "button";
      decrease.dataset.itemAction = "decrease";
      decrease.textContent = "−";
      decrease.setAttribute("aria-label", `${item.name} 수량 줄이기`);
      decrease.disabled = item.quantity <= 1;
      decrease.addEventListener("click", () =>
        changeQuantity(index, item.quantity - 1, "decrease"),
      );
      const quantity = document.createElement("output");
      quantity.textContent = `${item.quantity}개`;
      quantity.setAttribute("aria-label", `${item.name} 수량`);
      const increase = document.createElement("button");
      increase.type = "button";
      increase.dataset.itemAction = "increase";
      increase.textContent = "+";
      increase.setAttribute("aria-label", `${item.name} 수량 늘리기`);
      increase.disabled = item.quantity >= 10;
      increase.addEventListener("click", () =>
        changeQuantity(index, item.quantity + 1, "increase"),
      );
      const remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.itemAction = "remove";
      remove.className = "checkout-item-remove";
      remove.textContent = "삭제";
      remove.setAttribute("aria-label", `${item.name} 삭제`);
      remove.addEventListener("click", () => removeItem(index));
      controls.append(decrease, quantity, increase, remove);
      description.append(controls);
      row.append(thumbnail, description);
      container.append(row);
    });
    const hasPreorder = orderItems.some((item) => item.preorder);
    const hasRegular = orderItems.some((item) => !item.preorder);
    const preorderNote = document.querySelector("[data-preorder-shipping-note]");
    preorderNote.hidden = !hasPreorder;
    preorderNote.textContent =
      hasPreorder && hasRegular
        ? "일반 상품은 먼저 발송되고 예약배송 상품은 출고 예정일에 별도로 발송됩니다. 배송비는 한 번만 부과됩니다."
        : hasPreorder
          ? "예약배송 상품은 표시된 출고 예정일에 순차 발송됩니다."
          : "";

    if (focusIndex !== null) {
      const row = container.querySelector(
        `[data-checkout-item-index="${focusIndex}"]`,
      );
      const preferred = focusAction
        ? row?.querySelector(`[data-item-action="${focusAction}"]`)
        : null;
      const target =
        preferred && !preferred.disabled
          ? preferred
          : row?.querySelector("button:not(:disabled)");
      target?.focus();
    }
  }

  function reconcileCoupon() {
    if (!appliedCoupon) return "";
    const subtotal = window.FYPricing.calculatePricing(items, null).subtotal;
    if (
      !Number.isFinite(appliedCoupon.minOrderAmount) ||
      subtotal >= appliedCoupon.minOrderAmount
    ) {
      return "";
    }
    const minimum = money(appliedCoupon.minOrderAmount);
    appliedCoupon = null;
    return `주문 금액이 쿠폰 최소 금액(${minimum})에 미달하여 쿠폰 적용이 자동 해제되었습니다.`;
  }

  function changeQuantity(index, quantity, action) {
    try {
      const item = items[index];
      if (!item) throw new Error("주문 상품을 찾을 수 없습니다.");
      if (directMode) {
        const updatedItem = { ...item, quantity };
        window.FYCart.setDirectCheckout(updatedItem);
        items = [updatedItem];
      } else {
        window.FYCart.updateQuantity(window.FYCart.getKey(item), quantity);
        items = window.FYCart.getItems();
      }
      const couponNotice = reconcileCoupon();
      renderItems(index, action);
      updatePricing();
      status.textContent = couponNotice;
    } catch (error) {
      console.error("주문 수량 변경 오류:", error);
      status.textContent = error.message || "상품 수량을 변경하지 못했습니다.";
    }
  }

  function removeItem(index) {
    try {
      const item = items[index];
      if (!item) throw new Error("주문 상품을 찾을 수 없습니다.");
      if (directMode) {
        window.FYCart.clearDirectCheckout();
        items = [];
      } else {
        window.FYCart.removeItems([window.FYCart.getKey(item)]);
        items = window.FYCart.getItems();
      }
      const couponNotice = reconcileCoupon();
      if (items.length === 0) {
        emptyMessage.textContent =
          "마지막 상품을 삭제했습니다. 장바구니에서 상품을 다시 선택해 주세요.";
        form.hidden = true;
        empty.hidden = false;
        empty.querySelector("a").focus();
        return;
      }
      renderItems(Math.min(index, items.length - 1));
      updatePricing();
      status.textContent = couponNotice || "상품을 삭제했습니다.";
    } catch (error) {
      console.error("주문 상품 삭제 오류:", error);
      status.textContent = error.message || "상품을 삭제하지 못했습니다.";
    }
  }

  function formatPreorderDate(date) {
    const [, month, day] = date.split("-").map(Number);
    if (!month || !day) throw new Error("예약배송 날짜 형식이 올바르지 않습니다.");
    return `${month}월 ${day}일`;
  }

  function updatePricing() {
    const pricing = window.FYPricing.calculatePricing(items, appliedCoupon);
    document.querySelector("[data-subtotal]").textContent = money(pricing.subtotal);
    document.querySelector("[data-discount]").textContent =
      pricing.discount > 0 ? `-${money(pricing.discount)}` : money(0);
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
    document.querySelector("[data-coupon-applied]").textContent = appliedCoupon
      ? `${appliedCoupon.name} 적용됨`
      : "";
    document.querySelector("[data-cancel-coupon]").hidden = !appliedCoupon;
  }

  function getCouponEligibility(coupon) {
    return window.FYCoupons.getEligibility(
      coupon,
      window.FYPricing.calculatePricing(items, null).subtotal,
      user.id,
    );
  }

  function openCouponDialog() {
    if (!user) {
      document.querySelector("[data-coupon-member-note]").hidden = false;
      status.textContent = "쿠폰은 로그인한 회원만 사용할 수 있습니다.";
      return;
    }
    document.querySelector("[data-coupon-member-note]").hidden = true;
    try {
      const coupons = window.FYCoupons.getCoupons(user.id);
      couponOptions.replaceChildren();
      if (coupons.length === 0) {
        const emptyOption = document.createElement("li");
        emptyOption.textContent = "보유한 쿠폰이 없습니다.";
        couponOptions.append(emptyOption);
      }
      coupons.forEach((coupon) => {
        const eligibility = getCouponEligibility(coupon);
        const item = document.createElement("li");
        item.className = "coupon-option";
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "checkout-coupon";
        input.value = coupon.id;
        input.disabled = !eligibility.eligible;
        const content = document.createElement("span");
        const title = document.createElement("strong");
        title.textContent = coupon.name;
        const benefit = document.createElement("p");
        benefit.textContent =
          coupon.type === "fixed"
            ? `${money(coupon.value)} 할인`
            : `${coupon.value}% 할인, 최대 ${money(coupon.maxDiscountAmount)}`;
        const condition = document.createElement("p");
        condition.textContent = eligibility.eligible
          ? `사용 기한 ${coupon.expiresAt}`
          : eligibility.reason;
        content.append(title, benefit, condition);
        label.append(input, content);
        item.append(label);
        couponOptions.append(item);
      });
      dialog.showModal();
      status.textContent = "";
    } catch (error) {
      status.textContent = error.message || "쿠폰 목록을 불러오지 못했습니다.";
      console.error("쿠폰 목록 오류:", error);
    }
  }

  document.querySelector("[data-open-coupons]").addEventListener("click", openCouponDialog);
  document.querySelector("[data-close-coupons]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  addressSearchButton.addEventListener("click", () => {
    if (!addressSearchReady) {
      announceAddressStatus("주소 검색 서비스를 불러오고 있습니다.");
      return;
    }
    try {
      postcodeFrame.replaceChildren();
      addressDialog.showModal();
      const postcodeSearch = new window.daum.Postcode({
        width: "100%",
        height: "100%",
        oncomplete(data) {
          const roadAddress =
            data.roadAddress || data.autoRoadAddress || data.address;
          if (!roadAddress) {
            announceAddressStatus("선택한 주소의 도로명 주소를 확인해 주세요.");
            return;
          }
          postcode.value = String(data.zonecode || "");
          address.value = roadAddress;
          announceAddressStatus("");
          addressDialog.close();
          addressDetail.focus();
        },
      });
      postcodeSearch.embed(postcodeFrame);
    } catch (error) {
      if (addressDialog.open) addressDialog.close();
      enableManualAddress(error);
    }
  });
  document
    .querySelector("[data-close-address]")
    .addEventListener("click", () => addressDialog.close());
  addressDialog.addEventListener("click", (event) => {
    if (event.target === addressDialog) addressDialog.close();
  });
  addressDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    addressDialog.close();
  });
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && addressDialog.open) {
        event.preventDefault();
        addressDialog.close();
      }
    },
    true,
  );
  addressDialog.addEventListener("close", () => postcodeFrame.replaceChildren());
  initializeAddressSearch();

  document.querySelector("[data-apply-coupon]").addEventListener("click", () => {
    const selected = couponOptions.querySelector('input[name="checkout-coupon"]:checked');
    if (!selected) {
      status.textContent = "적용할 수 있는 쿠폰을 선택해 주세요.";
      return;
    }
    const coupon = window.FYCoupons.getCoupons(user.id).find(
      (item) => item.id === selected.value,
    );
    const eligibility = coupon && getCouponEligibility(coupon);
    if (!eligibility || !eligibility.eligible) {
      status.textContent = eligibility?.reason || "쿠폰을 확인할 수 없습니다.";
      return;
    }
    appliedCoupon = coupon;
    updatePricing();
    dialog.close();
    status.textContent = "";
  });
  document.querySelector("[data-cancel-coupon]").addEventListener("click", () => {
    appliedCoupon = null;
    updatePricing();
    status.textContent = "쿠폰 적용을 취소했습니다.";
  });

  window.addEventListener("storage", (event) => {
    if (directMode || event.key !== "fy_cart") return;
    try {
      items = window.FYCart.getItems();
      const couponNotice = reconcileCoupon();
      if (items.length === 0) {
        emptyMessage.textContent =
          "장바구니가 비어 있습니다. 장바구니에서 상품을 다시 선택해 주세요.";
      }
      renderItems();
      updatePricing();
      status.textContent = couponNotice;
    } catch (error) {
      console.error("장바구니 변경 사항을 반영하지 못했습니다.", error);
      status.textContent =
        error.message || "장바구니 변경 사항을 반영하지 못했습니다.";
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const buyerName = String(formData.get("buyerName")).trim();
    const buyerEmail = String(formData.get("buyerEmail")).trim();
    const buyerPhone = String(formData.get("buyerPhone")).trim();
    const recipientName = String(formData.get("recipientName")).trim();
    const recipientPhone = String(formData.get("recipientPhone")).trim();
    const postcodeValue = String(formData.get("postcode")).trim();
    const address = String(formData.get("address")).trim();
    const addressDetailValue = String(formData.get("addressDetail")).trim();
    if (
      ![
        buyerName,
        buyerEmail,
        buyerPhone,
        recipientName,
        recipientPhone,
        address,
        addressDetailValue,
      ].every(Boolean)
    ) {
      status.textContent = "주문자와 배송 정보를 모두 입력해 주세요.";
      return;
    }

    let createdOrders = [];
    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;
    status.textContent = "주문을 처리하고 있습니다.";
    try {
      const pricing = window.FYPricing.calculatePricing(items, appliedCoupon);
      if (appliedCoupon) {
        const eligibility = getCouponEligibility(appliedCoupon);
        if (!eligibility.eligible) throw new Error(eligibility.reason);
      }
      const couponSnapshot = appliedCoupon
        ? {
            id: appliedCoupon.id,
            name: appliedCoupon.name,
            type: appliedCoupon.type,
            value: appliedCoupon.value,
            maxDiscountAmount: appliedCoupon.maxDiscountAmount,
          }
        : null;
      const savedItems = snapshotItems();
      const regularItems = savedItems.filter((item) => !item.preorder);
      const estimatedDeliveryAt =
        regularItems.length > 0
          ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          : savedItems
              .map((item) => item.preorder.date)
              .sort()
              .slice(-1)[0] + "T00:00:00.000Z";
      saveLastShippingAddress({
        postcode: postcodeValue,
        address,
        addressDetail: addressDetailValue,
      });
      createdOrders = window.FYOrders.createOrders({
        userId: user ? user.id : null,
        buyerName,
        buyerEmail,
        buyerPhone,
        recipientName,
        recipientPhone,
        postcode: postcodeValue,
        address,
        addressDetail: addressDetailValue,
        shippingMemo: String(formData.get("shippingMemo")).trim(),
        paymentMethod: String(formData.get("paymentMethod")),
        items: savedItems,
        subtotal: pricing.subtotal,
        couponDiscount: pricing.discount,
        shipping: pricing.shipping,
        total: pricing.total,
        couponId: appliedCoupon ? appliedCoupon.id : null,
        couponSnapshot,
        estimatedDeliveryAt,
      });
      try {
        if (appliedCoupon) {
          window.FYCoupons.markUsed(
            appliedCoupon.id,
            user.id,
            createdOrders[0].id,
          );
        }
      } catch (error) {
        createdOrders.forEach((createdOrder) =>
          window.FYOrders.deleteOrder(createdOrder.id),
        );
        throw error;
      }
      if (directMode) {
        window.FYCart.clearDirectCheckout();
      } else {
        window.FYCart.clear();
      }
      window.location.href = "order-complete.html";
    } catch (error) {
      console.error("주문 처리 오류:", error);
      status.textContent = error.message || "주문을 처리하지 못했습니다. 다시 시도해 주세요.";
      submitButton.disabled = false;
    }
  });

  try {
    items = loadItems();
    if (items.length === 0) {
      form.hidden = true;
      empty.hidden = false;
      return;
    }
    if (user) {
      form.elements.buyerName.value = user.name || "";
      form.elements.buyerEmail.value = user.email || "";
      form.elements.buyerPhone.value = user.phone || "";
      form.elements.recipientName.value = user.name || "";
      form.elements.recipientPhone.value = user.phone || "";
      const savedAddress = loadSavedAddress();
      if (savedAddress) {
        postcode.value = savedAddress.postcode;
        address.value = savedAddress.address;
        addressDetail.value = savedAddress.addressDetail;
      }
    }
    renderItems();
    updatePricing();
  } catch (error) {
    form.hidden = true;
    status.textContent = error.message || "주문 정보를 불러오지 못했습니다.";
    console.error("주문 초기화 오류:", error);
  }
})();
