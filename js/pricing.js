(() => {
  const FREE_SHIPPING_THRESHOLD = 100000;
  const SHIPPING_FEE = 5000;

  function getProduct(item) {
    const product = (window.FIND_YOUR_PRODUCTS || []).find(
      (candidate) => candidate.id === item.productId,
    );
    if (!product) {
      throw new Error(`상품 정보를 찾을 수 없습니다: ${item.productId}`);
    }
    return product;
  }

  function getItemPrice(item) {
    if (Number.isFinite(item.unitPrice) && item.unitPrice >= 0) {
      return item.unitPrice;
    }
    return getProduct(item).price;
  }

  function calculateDiscount(coupon, subtotal) {
    if (!coupon) return 0;
    const rawDiscount =
      coupon.type === "fixed"
        ? coupon.value
        : coupon.type === "percent"
          ? Math.floor((subtotal * coupon.value) / 100)
          : 0;
    const cappedDiscount =
      coupon.type === "percent" && Number.isFinite(coupon.maxDiscountAmount)
        ? Math.min(rawDiscount, coupon.maxDiscountAmount)
        : rawDiscount;
    return Math.max(0, Math.min(subtotal, cappedDiscount));
  }

  function calculatePricing(items, coupon) {
    const subtotal = items.reduce((sum, item) => {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("상품 수량을 확인할 수 없습니다.");
      }
      return sum + getItemPrice(item) * quantity;
    }, 0);

    // 무료배송 기준은 쿠폰 할인 전 상품 합계로 계산합니다.
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const discount = calculateDiscount(coupon, subtotal);
    return {
      subtotal,
      discount,
      shipping,
      total: subtotal - discount + shipping,
      remainingForFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      shippingFee: SHIPPING_FEE,
    };
  }

  window.FYPricing = Object.freeze({
    FREE_SHIPPING_THRESHOLD,
    SHIPPING_FEE,
    getProduct,
    getItemPrice,
    calculateDiscount,
    calculatePricing,
  });
})();
