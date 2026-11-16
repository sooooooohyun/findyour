(() => {
  function formatPreorderDate(date) {
    const [, month, day] = date.split("-").map(Number);
    if (!month || !day) throw new Error("예약배송 날짜 형식이 올바르지 않습니다.");
    return `${month}월 ${day}일`;
  }

  const empty = document.querySelector("[data-order-empty]");
  const details = document.querySelector("[data-order-details]");
  const order = window.FYOrders.getLastOrder();
  if (!order) {
    empty.hidden = false;
    return;
  }

  const numberFormat = new Intl.NumberFormat("ko-KR");
  const money = (amount) => `${numberFormat.format(amount)}원`;
  const pricing = window.FYPricing.calculatePricing(order.items, order.couponSnapshot);
  document.querySelector("[data-order-number]").textContent = order.orderNumber;
  document.querySelector("[data-order-date]").textContent =
    `주문일 ${new Date(order.orderedAt).toLocaleString("ko-KR")}`;
  document.querySelector("[data-subtotal]").textContent = money(pricing.subtotal);
  document.querySelector("[data-discount]").textContent =
    pricing.discount > 0 ? `-${money(pricing.discount)}` : money(0);
  document.querySelector("[data-shipping]").textContent = money(pricing.shipping);
  document.querySelector("[data-total]").textContent = money(pricing.total);
  document.querySelector("[data-estimated-delivery]").textContent =
    new Date(order.estimatedDeliveryAt).toLocaleDateString("ko-KR");

  const list = document.querySelector("[data-order-items]");
  order.items.forEach((item) => {
    const row = document.createElement("li");
    row.className = "order-complete-item";
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
    list.append(row);
  });
  details.hidden = false;
  const hasPreorder = order.items.some((item) => item.preorder);
  const hasRegular = order.items.some((item) => !item.preorder);
  document.querySelector("[data-delivery-label]").textContent =
    hasPreorder && hasRegular
      ? "일반 상품 예상 배송일"
      : hasPreorder
        ? "예약 상품 출고 예정일"
        : "예상 배송일";
})();
