(() => {
  const ORDERS_KEY = "fy_orders";
  const LAST_ORDER_KEY = "fy_last_order";
  const LAST_ORDERS_KEY = "fy_last_orders";

  function readOrders() {
    try {
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      if (!Array.isArray(orders)) throw new Error("주문 내역 형식이 올바르지 않습니다.");
      return orders;
    } catch (error) {
      console.error("주문 내역을 읽지 못했습니다.", error);
      throw new Error("주문 내역을 읽을 수 없습니다. 저장 데이터를 확인해 주세요.");
    }
  }

  function createOrderRecord(order, date) {
    const suffix = Array.from(
      window.crypto.getRandomValues(new Uint8Array(3)),
      (byte) => byte.toString(16).padStart(2, "0"),
    )
      .join("")
      .toUpperCase();
    const orderNumber = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${suffix}`;
    return {
      ...order,
      id: `${date.getTime()}-${orderNumber}`,
      orderNumber,
      orderedAt: date.toISOString(),
    };
  }

  function persistOrders(existingOrders, newOrders) {
    const previousLastOrder = localStorage.getItem(LAST_ORDER_KEY);
    const previousLastOrders = localStorage.getItem(LAST_ORDERS_KEY);
    const updatedOrders = [...existingOrders, ...newOrders];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    try {
      localStorage.setItem(
        LAST_ORDERS_KEY,
        JSON.stringify(newOrders.map((order) => order.id)),
      );
      localStorage.setItem(LAST_ORDER_KEY, newOrders[newOrders.length - 1].id);
    } catch (error) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(existingOrders));
      try {
        if (previousLastOrder === null) {
          localStorage.removeItem(LAST_ORDER_KEY);
        } else {
          localStorage.setItem(LAST_ORDER_KEY, previousLastOrder);
        }
        if (previousLastOrders === null) {
          localStorage.removeItem(LAST_ORDERS_KEY);
        } else {
          localStorage.setItem(LAST_ORDERS_KEY, previousLastOrders);
        }
      } catch (rollbackError) {
        console.error("주문 저장 상태를 복구하지 못했습니다.", rollbackError);
      }
      throw error;
    }
  }

  function groupItemsByShipmentDate(items) {
    const groups = new Map();
    // 일반 상품은 한 묶음, 예약배송 상품은 preorder.date가 같은 것끼리 묶습니다.
    items.forEach((item) => {
      const preorderDate = item.preorder ? item.preorder.date : null;
      if (
        preorderDate !== null &&
        (typeof preorderDate !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(preorderDate))
      ) {
        throw new Error("예약배송 출고일 형식이 올바르지 않습니다.");
      }
      const key = preorderDate === null ? "regular" : `preorder:${preorderDate}`;
      if (!groups.has(key)) {
        groups.set(key, { preorderDate, items: [] });
      }
      groups.get(key).items.push(item);
    });

    return [...groups.values()].sort((left, right) => {
      if (left.preorderDate === null) return -1;
      if (right.preorderDate === null) return 1;
      return left.preorderDate.localeCompare(right.preorderDate);
    });
  }

  function allocateAmount(amount, groups, totalSubtotal) {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error("주문 금액 분배 값이 올바르지 않습니다.");
    }
    if (totalSubtotal <= 0) {
      if (amount === 0) return groups.map(() => 0);
      return groups.map((group, index) => (index === 0 ? amount : 0));
    }

    const allocations = groups.map((group) =>
      Math.round((amount * group.subtotal) / totalSubtotal),
    );
    const adjustment =
      amount - allocations.reduce((sum, allocation) => sum + allocation, 0);
    allocations[0] += adjustment;

    if (allocations[0] < 0) {
      let distributed = 0;
      for (let index = 1; index < groups.length; index += 1) {
        allocations[index] = Math.floor(
          (amount * groups[index].subtotal) / totalSubtotal,
        );
        distributed += allocations[index];
      }
      allocations[0] = amount - distributed;
    }
    return allocations;
  }

  function createOrders(order) {
    if (!order || !Array.isArray(order.items) || order.items.length === 0) {
      throw new Error("주문할 상품을 확인할 수 없습니다.");
    }
    const groups = groupItemsByShipmentDate(order.items);
    groups.forEach((group) => {
      group.subtotal = group.items.reduce((sum, item) => {
        if (
          !Number.isFinite(item.unitPrice) ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1
        ) {
          throw new Error("주문 상품 금액이나 수량이 올바르지 않습니다.");
        }
        return sum + item.unitPrice * item.quantity;
      }, 0);
    });
    const subtotal = groups.reduce((sum, group) => sum + group.subtotal, 0);
    if (subtotal !== order.subtotal) {
      throw new Error("주문 상품 금액 합계가 결제 금액과 일치하지 않습니다.");
    }

    const couponDiscounts = allocateAmount(
      order.couponDiscount,
      groups,
      subtotal,
    );
    const shippingFees = allocateAmount(order.shipping, groups, subtotal);
    const groupTotals = groups.map(
      (group, index) =>
        group.subtotal - couponDiscounts[index] + shippingFees[index],
    );
    const total = groupTotals.reduce((sum, amount) => sum + amount, 0);
    if (total !== order.total) {
      throw new Error("배송 그룹별 금액 합계가 최종 결제 금액과 일치하지 않습니다.");
    }

    const orderedAt = new Date();
    const newOrders = groups.map((group, index) => {
      const preorderDate = group.preorderDate;
      return createOrderRecord(
        {
          ...order,
          items: group.items,
          subtotal: group.subtotal,
          couponDiscount: couponDiscounts[index],
          shipping: shippingFees[index],
          total: groupTotals[index],
          paymentTotal: order.total,
          paymentGroupIndex: index + 1,
          paymentGroupCount: groups.length,
          shippingGroup: {
            type: preorderDate === null ? "regular" : "preorder",
            preorderDate,
          },
          estimatedDeliveryAt: preorderDate
            ? `${preorderDate}T00:00:00.000Z`
            : order.estimatedDeliveryAt,
        },
        orderedAt,
      );
    });
    persistOrders(readOrders(), newOrders);
    return newOrders;
  }

  function createOrder(order) {
    const date = new Date();
    const savedOrder = createOrderRecord(order, date);
    persistOrders(readOrders(), [savedOrder]);
    return savedOrder;
  }

  function getById(id) {
    return readOrders().find((order) => order.id === id) || null;
  }

  function getLastOrder() {
    const id = localStorage.getItem(LAST_ORDER_KEY);
    return id ? getById(id) : null;
  }

  function getLastOrders() {
    const storedIds = localStorage.getItem(LAST_ORDERS_KEY);
    if (storedIds === null) {
      const lastOrder = getLastOrder();
      return lastOrder ? [lastOrder] : [];
    }
    let ids;
    try {
      ids = JSON.parse(storedIds);
      if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
        throw new Error("최근 주문 목록 형식이 올바르지 않습니다.");
      }
    } catch (error) {
      console.error("최근 주문 목록을 읽지 못했습니다.", error);
      throw new Error("최근 주문 목록을 읽을 수 없습니다. 저장 데이터를 확인해 주세요.");
    }
    const ordersById = new Map(readOrders().map((order) => [order.id, order]));
    return ids.map((id) => ordersById.get(id)).filter(Boolean);
  }

  function deleteOrder(id) {
    const orders = readOrders();
    const updated = orders.filter((order) => order.id !== id);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    const lastOrders = localStorage.getItem(LAST_ORDERS_KEY);
    if (lastOrders !== null) {
      let ids;
      try {
        ids = JSON.parse(lastOrders);
        if (!Array.isArray(ids)) throw new Error("최근 주문 목록 형식이 올바르지 않습니다.");
      } catch (error) {
        console.error("최근 주문 목록을 읽지 못했습니다.", error);
        throw new Error("최근 주문 목록을 읽을 수 없습니다. 저장 데이터를 확인해 주세요.");
      }
      localStorage.setItem(
        LAST_ORDERS_KEY,
        JSON.stringify(ids.filter((orderId) => orderId !== id)),
      );
    }
    if (localStorage.getItem(LAST_ORDER_KEY) === id) {
      const ids = JSON.parse(localStorage.getItem(LAST_ORDERS_KEY) || "[]");
      const nextId = ids[ids.length - 1] || updated[updated.length - 1]?.id;
      if (nextId) {
        localStorage.setItem(LAST_ORDER_KEY, nextId);
      } else {
        localStorage.removeItem(LAST_ORDER_KEY);
      }
    }
  }

  window.FYOrders = Object.freeze({
    getAll: readOrders,
    createOrder,
    createOrders,
    getById,
    getLastOrder,
    getLastOrders,
    deleteOrder,
  });
})();
