(() => {
  const COUPONS_KEY = "fy_coupons";
  const ORDERS_KEY = "fy_orders";

  function readList(key) {
    const stored = localStorage.getItem(key);
    if (stored === null) return [];
    try {
      const value = JSON.parse(stored);
      if (!Array.isArray(value)) {
        throw new Error("저장된 목록 형식이 올바르지 않습니다.");
      }
      return value;
    } catch (error) {
      console.error(`저장 데이터를 읽지 못했습니다 (${key}).`, error);
      throw new Error("저장된 정보를 읽지 못했습니다. 브라우저 저장 데이터를 확인해 주세요.");
    }
  }

  function writeCoupons(coupons) {
    localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
    window.dispatchEvent(new Event("fy:coupons-updated"));
  }

  function dateAfterDays(days) {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + days);
    return expiration.toISOString().slice(0, 10);
  }

  function createId() {
    const bytes = window.crypto.getRandomValues(new Uint8Array(12));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function issueInitialCoupons(user) {
    if (!user || !user.id) {
      throw new Error("회원 확인 후 쿠폰을 발급할 수 있습니다.");
    }
    const coupons = readList(COUPONS_KEY);
    if (coupons.some((coupon) => coupon.userId === user.id)) return;

    const expiresAt = dateAfterDays(30);
    const issued = [
      {
        id: createId(),
        userId: user.id,
        name: "첫 가입 쿠폰",
        type: "fixed",
        value: 5000,
        minOrderAmount: 30000,
        maxDiscountAmount: null,
        expiresAt,
        used: false,
        firstPurchaseOnly: false,
      },
      {
        id: createId(),
        userId: user.id,
        name: "첫 구매 쿠폰",
        type: "percent",
        value: 10,
        minOrderAmount: 50000,
        maxDiscountAmount: 10000,
        expiresAt,
        used: false,
        firstPurchaseOnly: true,
      },
    ];
    writeCoupons([...coupons, ...issued]);
  }

  function getCoupons(userId) {
    return readList(COUPONS_KEY).filter((coupon) => coupon.userId === userId);
  }

  function getEligibility(coupon, subtotal, userId) {
    if (!coupon || coupon.userId !== userId) {
      return { eligible: false, reason: "이 회원에게 발급된 쿠폰이 아닙니다." };
    }
    if (coupon.used) {
      return { eligible: false, reason: "이미 사용한 쿠폰입니다." };
    }
    if (new Date().toISOString().slice(0, 10) > coupon.expiresAt) {
      return { eligible: false, reason: "사용 기간이 지난 쿠폰입니다." };
    }
    if (subtotal < coupon.minOrderAmount) {
      return {
        eligible: false,
        reason: `${coupon.minOrderAmount.toLocaleString("ko-KR")}원 이상 주문 시 사용할 수 있습니다.`,
      };
    }
    if (
      coupon.firstPurchaseOnly &&
      readList(ORDERS_KEY).some((order) => order.userId === userId)
    ) {
      return { eligible: false, reason: "첫 주문에만 사용할 수 있는 쿠폰입니다." };
    }
    return { eligible: true, reason: "" };
  }

  function markUsed(couponId, userId, orderId) {
    const coupons = readList(COUPONS_KEY);
    const index = coupons.findIndex(
      (coupon) =>
        coupon.id === couponId && coupon.userId === userId && !coupon.used,
    );
    if (index < 0) {
      throw new Error("사용할 쿠폰을 확인할 수 없습니다.");
    }
    coupons[index] = {
      ...coupons[index],
      used: true,
      usedAt: new Date().toISOString(),
      orderId,
    };
    writeCoupons(coupons);
  }

  window.FYCoupons = Object.freeze({
    issueInitialCoupons,
    getCoupons,
    getEligibility,
    markUsed,
  });
})();
