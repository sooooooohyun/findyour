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
        const delivery = document.createElement("p");
        delivery.textContent = order.shippingGroup?.preorderDate
          ? `${formatPreorderDate(order.shippingGroup.preorderDate)} 출고`
          : `예상 배송일: ${formatDate(order.estimatedDeliveryAt)}`;
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
        item.append(title, date, delivery, products, total);
        orderList.append(item);
      });
  }

  const attendanceCalendar = document.querySelector("[data-attendance-calendar]");
  const attendanceMonth = document.querySelector("[data-attendance-month]");
  const attendanceButton = document.querySelector("[data-attend-today]");
  const attendanceStatus = document.querySelector("[data-attendance-status]");
  const attendanceDaysLabel = document.querySelector("[data-attendance-days]");
  const currentStreakLabel = document.querySelector(
    "[data-attendance-current-streak]",
  );
  const maxStreakLabel = document.querySelector(
    "[data-attendance-max-streak]",
  );
  const nextRewardLabel = document.querySelector(
    "[data-attendance-next-reward]",
  );
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getAttendanceState(key) {
    const saved = localStorage.getItem(key);
    if (saved === null) return { days: [] };
    let state;
    try {
      state = JSON.parse(saved);
    } catch (error) {
      console.error("출석 기록을 읽지 못했습니다.", error);
      throw new Error("출석 기록을 읽을 수 없습니다. 저장 데이터를 확인해 주세요.");
    }
    if (!state || !Array.isArray(state.days)) {
      throw new Error("출석 기록 형식이 올바르지 않습니다.");
    }
    const uniqueDays = [...new Set(state.days)];
    const monthKey = key.slice(key.lastIndexOf(":") + 1);
    if (
      uniqueDays.some(
        (day) => {
          if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
            return true;
          }
          const [year, month, dayOfMonth] = day.split("-").map(Number);
          const date = new Date(year, month - 1, dayOfMonth);
          return (
            !day.startsWith(monthKey) ||
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== dayOfMonth
          );
        },
      )
    ) {
      throw new Error("출석 기록의 날짜가 올바르지 않습니다.");
    }
    return { days: uniqueDays.sort() };
  }

  function getStreaks(days, year, month, today) {
    const attended = new Set(days);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let maximum = 0;
    let run = 0;
    for (let day = 1; day <= daysInMonth; day += 1) {
      if (attended.has(localDateKey(new Date(year, month, day)))) {
        run += 1;
        maximum = Math.max(maximum, run);
      } else {
        run = 0;
      }
    }

    let current = 0;
    let cursor = attended.has(localDateKey(today))
      ? today.getDate()
      : today.getDate() - 1;
    while (
      cursor > 0 &&
      attended.has(localDateKey(new Date(year, month, cursor)))
    ) {
      current += 1;
      cursor -= 1;
    }
    return { current, maximum, daysInMonth };
  }

  function createCalendarCell(text, className, role) {
    const cell = document.createElement("div");
    cell.className = `attendance-cell ${className}`;
    cell.setAttribute("role", role);
    cell.textContent = text;
    return cell;
  }

  function renderAttendance(checkedIn, today = new Date()) {
    const year = today.getFullYear();
    const month = today.getMonth();
    const todayKey = localDateKey(today);
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const storageKey = `fy_attendance:${user.id}:${monthKey}`;
    attendanceStorageKey = storageKey;
    const state = getAttendanceState(storageKey);
    const attended = new Set(state.days);
    const { current, maximum, daysInMonth } = getStreaks(
      state.days,
      year,
      month,
      today,
    );
    const rules = window.FYCoupons.ATTENDANCE_COUPON_RULES;
    const rewards = [];
    if (maximum >= rules.tenDay.consecutiveDays) {
      if (window.FYCoupons.issueAttendanceCoupon(user, "tenDay", monthKey)) {
        rewards.push(rules.tenDay.name);
      }
    }
    if (state.days.length === daysInMonth) {
      if (window.FYCoupons.issueAttendanceCoupon(user, "fullMonth", monthKey)) {
        rewards.push(rules.fullMonth.name);
      }
    }
    if (rewards.length > 0) {
      try {
        renderCoupons();
      } catch (error) {
        console.error("출석 쿠폰을 쿠폰함에 표시하지 못했습니다.", error);
        status.textContent = "출석 쿠폰을 쿠폰함에 표시하지 못했습니다.";
      }
    }

    attendanceMonth.textContent = `${year}년 ${month + 1}월`;
    attendanceCalendar.setAttribute(
      "aria-label",
      `${year}년 ${month + 1}월 출석 달력`,
    );
    attendanceCalendar.replaceChildren();
    const weekdayRow = document.createElement("div");
    weekdayRow.setAttribute("role", "row");
    weekdays.forEach((weekday) => {
      const cell = createCalendarCell(weekday, "attendance-weekday", "columnheader");
      weekdayRow.append(cell);
    });
    attendanceCalendar.append(weekdayRow);

    const firstWeekday = new Date(year, month, 1).getDay();
    const rowCount = Math.ceil((firstWeekday + daysInMonth) / 7);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const row = document.createElement("div");
      row.setAttribute("role", "row");
      for (let column = 0; column < 7; column += 1) {
        const day = rowIndex * 7 + column - firstWeekday + 1;
        if (day < 1 || day > daysInMonth) {
          const blank = createCalendarCell("", "attendance-blank", "gridcell");
          blank.setAttribute("aria-hidden", "true");
          row.append(blank);
          continue;
        }
        const dateKey = localDateKey(new Date(year, month, day));
        const cell = createCalendarCell(
          String(day),
          "attendance-day",
          "gridcell",
        );
        const isToday = dateKey === todayKey;
        const isAttended = attended.has(dateKey);
        cell.setAttribute(
          "aria-label",
          `${month + 1}월 ${day}일${isToday ? ", 오늘" : ""}${isAttended ? ", 출석 완료" : ""}`,
        );
        if (isAttended) cell.classList.add("is-attended");
        if (isToday) cell.classList.add("is-today");
        if (day < today.getDate()) cell.classList.add("is-past");
        if (day > today.getDate()) cell.classList.add("is-future");
        row.append(cell);
      }
      attendanceCalendar.append(row);
    }

    attendanceButton.disabled = attended.has(todayKey);
    attendanceButton.textContent = attended.has(todayKey)
      ? "출석 완료"
      : "출석하기";
    attendanceDaysLabel.textContent = `${state.days.length}일`;
    currentStreakLabel.textContent = `${current}일`;
    maxStreakLabel.textContent = `${maximum}일`;

    const coupons = window.FYCoupons.getCoupons(user.id);
    const tenDayIssued = coupons.some(
      (coupon) => coupon.id === `attendance-tenDay-${monthKey}-${user.id}`,
    );
    const fullMonthIssued = coupons.some(
      (coupon) => coupon.id === `attendance-fullMonth-${monthKey}-${user.id}`,
    );
    const missedPastDay = Array.from(
      { length: today.getDate() - 1 },
      (_, index) => localDateKey(new Date(year, month, index + 1)),
    ).some((dateKey) => !attended.has(dateKey));
    if (!tenDayIssued) {
      nextRewardLabel.textContent =
        `10일 연속 출석까지 ${Math.max(0, rules.tenDay.consecutiveDays - current)}일`;
    } else if (!fullMonthIssued) {
      nextRewardLabel.textContent = missedPastDay
        ? "이번 달 개근 보상은 더 이상 받을 수 없습니다."
        : `이번 달 전체 출석까지 ${Math.max(0, daysInMonth - state.days.length)}일`;
    } else {
      nextRewardLabel.textContent = "이번 달 보상을 모두 받았습니다.";
    }
    attendanceStatus.textContent = [
      checkedIn ? "오늘 출석을 완료했습니다." : "",
      rewards.length
        ? `${rewards.join(", ")}이 쿠폰함에 지급되었습니다.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  let attendanceStorageKey = "";
  attendanceButton.addEventListener("click", () => {
    try {
      const today = new Date();
      const todayKey = localDateKey(today);
      const monthKey = `${today.getFullYear()}-${String(
        today.getMonth() + 1,
      ).padStart(2, "0")}`;
      attendanceStorageKey = `fy_attendance:${user.id}:${monthKey}`;
      const state = getAttendanceState(attendanceStorageKey);
      if (state.days.includes(todayKey)) {
        renderAttendance(false);
        attendanceStatus.textContent = "오늘은 이미 출석했습니다.";
        return;
      }
      state.days.push(todayKey);
      state.days.sort();
      localStorage.setItem(attendanceStorageKey, JSON.stringify(state));
      renderAttendance(true, today);
    } catch (error) {
      console.error("출석을 처리하지 못했습니다.", error);
      attendanceStatus.textContent =
        error.message || "출석을 처리하지 못했습니다. 다시 시도해 주세요.";
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== attendanceStorageKey) return;
    try {
      renderAttendance(false);
    } catch (error) {
      console.error("출석 기록을 갱신하지 못했습니다.", error);
      attendanceStatus.textContent = "출석 기록을 갱신하지 못했습니다.";
    }
  });

  try {
    renderCoupons();
  } catch (error) {
    console.error("쿠폰함을 표시하지 못했습니다.", error);
    status.textContent = "쿠폰함을 불러오지 못했습니다.";
  }
  renderOrders();
  try {
    renderAttendance(false);
  } catch (error) {
    console.error("출석 달력을 표시하지 못했습니다.", error);
    attendanceStatus.textContent =
      error.message || "출석 달력을 불러오지 못했습니다.";
    attendanceButton.disabled = true;
  }

  function formatPreorderDate(date) {
    const [, month, day] = date.split("-").map(Number);
    if (!month || !day) throw new Error("예약배송 날짜 형식이 올바르지 않습니다.");
    return `${month}월 ${day}일`;
  }
})();
