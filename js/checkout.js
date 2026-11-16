(() => {
  const form = document.querySelector("[data-checkout-form]");
  const empty = document.querySelector("[data-checkout-empty]");
  const status = document.querySelector("[data-checkout-status]");
  const dialog = document.querySelector("[data-coupon-dialog]");
  const couponOptions = document.querySelector("[data-coupon-options]");
  const user = window.FYAuth.getCurrentUser();
  const directMode = new URLSearchParams(window.location.search).get("mode") === "direct";
  const numberFormat = new Intl.NumberFormat("ko-KR");
  let items = [];
  let appliedCoupon = null;

  function money(amount) {
    return `${numberFormat.format(amount)}원`;
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

  function renderItems() {
    const container = document.querySelector("[data-checkout-items]");
    container.replaceChildren();
    const orderItems = snapshotItems();
    orderItems.forEach((item) => {
      const row = document.createElement("li");
      row.className = "checkout-item";
      const description = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = item.name;
      const options = document.createElement("p");
      options.textContent = `${item.color} / ${item.size} / ${item.quantity}개`;
      const price = document.createElement("strong");
      price.textContent = money(item.unitPrice * item.quantity);
      description.append(name, options);
      if (item.preorder) {
        const preorder = document.createElement("p");
        preorder.className = "preorder-note";
        preorder.textContent = `${formatPreorderDate(item.preorder.date)} 출고 예정`;
        description.append(preorder);
      }
      row.append(description, price);
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

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const buyerName = String(formData.get("buyerName")).trim();
    const buyerEmail = String(formData.get("buyerEmail")).trim();
    const buyerPhone = String(formData.get("buyerPhone")).trim();
    const recipientName = String(formData.get("recipientName")).trim();
    const recipientPhone = String(formData.get("recipientPhone")).trim();
    const address = String(formData.get("address")).trim();
    if (![buyerName, buyerEmail, buyerPhone, recipientName, recipientPhone, address].every(Boolean)) {
      status.textContent = "주문자와 배송 정보를 모두 입력해 주세요.";
      return;
    }

    let order;
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
      order = window.FYOrders.createOrder({
        userId: user ? user.id : null,
        buyerName,
        buyerEmail,
        buyerPhone,
        recipientName,
        recipientPhone,
        address,
        addressDetail: String(formData.get("addressDetail")).trim(),
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
        if (appliedCoupon) window.FYCoupons.markUsed(appliedCoupon.id, user.id, order.id);
      } catch (error) {
        window.FYOrders.deleteOrder(order.id);
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
    }
    renderItems();
    updatePricing();
  } catch (error) {
    form.hidden = true;
    status.textContent = error.message || "주문 정보를 불러오지 못했습니다.";
    console.error("주문 초기화 오류:", error);
  }
})();
