(() => {
  function formatPreorderDate(date) {
    const [, month, day] = date.split("-").map(Number);
    if (!month || !day) throw new Error("예약배송 날짜 형식이 올바르지 않습니다.");
    return `${month}월 ${day}일`;
  }

  function getGroupPreorderDate(order) {
    if (order.shippingGroup?.preorderDate) {
      return order.shippingGroup.preorderDate;
    }
    const items = order.items || [];
    if (
      items.length > 0 &&
      items.every(
        (item) => item.preorder?.date === items[0].preorder?.date,
      ) &&
      items[0].preorder?.date
    ) {
      return items[0].preorder.date;
    }
    return null;
  }

  const empty = document.querySelector("[data-order-empty]");
  const details = document.querySelector("[data-order-details]");
  const orders = window.FYOrders.getLastOrders();
  if (orders.length === 0) {
    empty.hidden = false;
    return;
  }

  const numberFormat = new Intl.NumberFormat("ko-KR");
  const money = (amount) => `${numberFormat.format(amount)}원`;
  const groups = document.querySelector("[data-order-groups]");
  const template = document.querySelector("[data-order-template]");
  const paymentTotal =
    Number.isFinite(orders[0].paymentTotal)
      ? orders[0].paymentTotal
      : orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  document.querySelector("[data-payment-total]").textContent =
    money(paymentTotal);
  document.querySelector("[data-order-date]").textContent =
    `주문일 ${new Date(orders[0].orderedAt).toLocaleString("ko-KR")}`;

  orders.forEach((order) => {
    const fragment = template.content.cloneNode(true);
    const group = fragment.querySelector(".order-group");
    group.querySelector("[data-order-number]").textContent = order.orderNumber;
    group.querySelector("[data-subtotal]").textContent = money(order.subtotal);
    group.querySelector("[data-discount]").textContent =
      order.couponDiscount > 0 ? `-${money(order.couponDiscount)}` : money(0);
    group.querySelector("[data-shipping]").textContent = money(order.shipping);
    group.querySelector("[data-total]").textContent = money(order.total);

    const preorderDate = getGroupPreorderDate(order);
    group.querySelector("[data-delivery-label]").textContent = preorderDate
      ? "출고 예정일"
      : "예상 배송일";
    group.querySelector("[data-estimated-delivery]").textContent = preorderDate
      ? `${formatPreorderDate(preorderDate)} 출고`
      : new Date(order.estimatedDeliveryAt).toLocaleDateString("ko-KR");

    const list = group.querySelector("[data-order-items]");
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
    groups.append(fragment);
  });

  details.hidden = false;
})();
