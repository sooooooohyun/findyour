(() => {
  const user = window.FYAuth?.getCurrentUser();
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  const greeting = document.querySelector("[data-member-greeting]");
  const couponList = document.querySelector("[data-coupon-list]");
  const orderList = document.querySelector("[data-order-list]");
  const status = document.querySelector("[data-mypage-status]");
  greeting.textContent = `${user.name}님, 안녕하세요.`;

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "날짜 정보 없음"
      : date.toLocaleDateString("ko-KR");
  }

  function renderCoupons() {
    const coupons = window.FYCoupons.getCoupons(user.id);
    couponList.replaceChildren();
    if (coupons.length === 0) {
      status.textContent = "보유한 쿠폰이 없습니다.";
      return;
    }

    coupons.forEach((coupon) => {
      const item = document.createElement("li");
      item.className = "coupon-card";
      const title = document.createElement("h3");
      title.textContent = coupon.name;
      const benefit = document.createElement("p");
      benefit.textContent =
        coupon.type === "fixed"
          ? `${coupon.value.toLocaleString("ko-KR")}원 할인`
          : `${coupon.value}% 할인, 최대 ${coupon.maxDiscountAmount.toLocaleString("ko-KR")}원`;
      const condition = document.createElement("p");
      condition.textContent = `${coupon.minOrderAmount.toLocaleString("ko-KR")}원 이상 주문 시`;
      const expiration = document.createElement("p");
      expiration.textContent = `사용 기한: ${coupon.expiresAt}`;
      const state = document.createElement("p");
      state.className = "coupon-state";
      const expired = new Date().toISOString().slice(0, 10) > coupon.expiresAt;
      state.textContent = coupon.used ? "사용 완료" : expired ? "기간 만료" : "사용 가능";
      item.append(title, benefit, condition, expiration, state);
      couponList.append(item);
    });
    status.textContent = "";
  }

  function renderOrders() {
    let orders;
    try {
      orders = JSON.parse(localStorage.getItem("fy_orders") || "[]");
      if (!Array.isArray(orders)) {
        throw new Error("주문 내역 형식이 올바르지 않습니다.");
      }
    } catch (error) {
      console.error("주문 내역을 읽지 못했습니다.", error);
      status.textContent = "주문 내역을 불러오지 못했습니다.";
      return;
    }

    orderList.replaceChildren();
    const memberOrders = orders.filter((order) => order.userId === user.id);
    if (memberOrders.length === 0) {
      const empty = document.createElement("li");
      empty.className = "order-card";
      empty.textContent = "주문 내역이 없습니다.";
      orderList.append(empty);
      return;
    }

    memberOrders
      .slice()
      .sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt))
      .forEach((order) => {
        const item = document.createElement("li");
        item.className = "order-card";
        const title = document.createElement("h3");
        title.textContent = `주문번호 ${order.orderNumber}`;
        const date = document.createElement("p");
        date.textContent = `주문일: ${formatDate(order.orderedAt)}`;
        const total = document.createElement("p");
        total.textContent = `결제 금액: ${Number(order.total).toLocaleString("ko-KR")}원`;
        const products = document.createElement("p");
        products.replaceChildren();
        (order.items || []).forEach((orderedItem) => {
          const line = document.createElement("span");
          line.textContent = `${orderedItem.name} ${orderedItem.quantity}개`;
          if (orderedItem.preorder) {
            line.textContent += ` (${formatPreorderDate(orderedItem.preorder.date)} 출고 예정)`;
          }
          products.append(line, document.createTextNode(" "));
        });
        item.append(title, date, products, total);
        orderList.append(item);
      });
  }

  try {
    renderCoupons();
  } catch (error) {
    console.error("쿠폰함을 표시하지 못했습니다.", error);
    status.textContent = "쿠폰함을 불러오지 못했습니다.";
  }
  renderOrders();

  function formatPreorderDate(date) {
    const [, month, day] = date.split("-").map(Number);
    if (!month || !day) throw new Error("예약배송 날짜 형식이 올바르지 않습니다.");
    return `${month}월 ${day}일`;
  }
})();
