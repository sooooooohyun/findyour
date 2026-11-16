(() => {
  const ORDERS_KEY = "fy_orders";
  const LAST_ORDER_KEY = "fy_last_order";

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

  function createOrder(order) {
    const orders = readOrders();
    const date = new Date();
    const suffix = Array.from(
      window.crypto.getRandomValues(new Uint8Array(3)),
      (byte) => byte.toString(16).padStart(2, "0"),
    )
      .join("")
      .toUpperCase();
    const orderNumber = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${suffix}`;
    const savedOrder = {
      ...order,
      id: `${Date.now()}-${orderNumber}`,
      orderNumber,
      orderedAt: date.toISOString(),
    };
    const updatedOrders = [...orders, savedOrder];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    try {
      localStorage.setItem(LAST_ORDER_KEY, savedOrder.id);
    } catch (error) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      throw error;
    }
    return savedOrder;
  }

  function getById(id) {
    return readOrders().find((order) => order.id === id) || null;
  }

  function getLastOrder() {
    const id = localStorage.getItem(LAST_ORDER_KEY);
    return id ? getById(id) : null;
  }

  function deleteOrder(id) {
    const orders = readOrders();
    const updated = orders.filter((order) => order.id !== id);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    if (localStorage.getItem(LAST_ORDER_KEY) === id) {
      if (updated.length > 0) {
        localStorage.setItem(LAST_ORDER_KEY, updated[updated.length - 1].id);
      } else {
        localStorage.removeItem(LAST_ORDER_KEY);
      }
    }
  }

  window.FYOrders = Object.freeze({
    getAll: readOrders,
    createOrder,
    getById,
    getLastOrder,
    deleteOrder,
  });
})();
