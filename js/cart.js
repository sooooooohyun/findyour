(() => {
  const CART_KEY = "fy_cart";
  const DIRECT_CHECKOUT_KEY = "fy_direct_checkout";

  function readCart() {
    const stored = localStorage.getItem(CART_KEY);
    if (stored === null) return [];
    try {
      const cart = JSON.parse(stored);
      if (!Array.isArray(cart)) throw new Error("장바구니 형식이 올바르지 않습니다.");
      if (
        cart.some(
          (item) =>
            !item ||
            typeof item.productId !== "string" ||
            typeof item.size !== "string" ||
            typeof item.color !== "string" ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            item.quantity > 10,
        )
      ) {
        throw new Error("장바구니 상품 정보가 올바르지 않습니다.");
      }
      return cart;
    } catch (error) {
      console.error("장바구니 저장값을 읽지 못했습니다.", error);
      throw new Error("장바구니 정보를 읽을 수 없습니다. 저장 데이터를 확인해 주세요.");
    }
  }

  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    document.dispatchEvent(new Event("fy:cart-updated"));
  }

  function productFor(productId) {
    const product = (window.FIND_YOUR_PRODUCTS || []).find(
      (item) => item.id === productId,
    );
    if (!product) throw new Error("선택한 상품 정보를 찾을 수 없습니다.");
    return product;
  }

  function validateItem({ productId, size, color, quantity }) {
    const product = productFor(productId);
    if (!product.sizes.includes(size) || !product.colors.includes(color)) {
      throw new Error("상품의 색상과 사이즈를 선택해 주세요.");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new Error("수량은 1개부터 10개까지 선택할 수 있습니다.");
    }
    return product;
  }

  function getKey(item) {
    return `${item.productId}|${item.size}|${item.color}`;
  }

  function addItem(selection) {
    validateItem(selection);
    const items = readCart();
    const match = items.find((item) => getKey(item) === getKey(selection));
    if (match) {
      if (match.quantity + selection.quantity > 10) {
        throw new Error("같은 옵션은 최대 10개까지 담을 수 있습니다.");
      }
      match.quantity += selection.quantity;
    } else {
      items.push({
        productId: selection.productId,
        size: selection.size,
        color: selection.color,
        quantity: selection.quantity,
      });
    }
    writeCart(items);
    document.dispatchEvent(new Event("fy:cart-item-added"));
  }

  function updateQuantity(key, quantity) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new Error("수량은 1개부터 10개까지 선택할 수 있습니다.");
    }
    const items = readCart();
    const item = items.find((candidate) => getKey(candidate) === key);
    if (!item) throw new Error("장바구니 상품을 찾을 수 없습니다.");
    item.quantity = quantity;
    writeCart(items);
  }

  function removeItems(keys) {
    const selected = new Set(keys);
    writeCart(readCart().filter((item) => !selected.has(getKey(item))));
  }

  function clear() {
    writeCart([]);
    localStorage.removeItem(DIRECT_CHECKOUT_KEY);
  }

  function getCount() {
    return readCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  function getDirectCheckout() {
    const stored = localStorage.getItem(DIRECT_CHECKOUT_KEY);
    if (stored === null) return null;
    try {
      const item = JSON.parse(stored);
      validateItem(item);
      return item;
    } catch (error) {
      console.error("바로 구매 정보를 읽지 못했습니다.", error);
      throw new Error("바로 구매 정보를 읽지 못했습니다. 다시 시도해 주세요.");
    }
  }

  function setDirectCheckout(selection) {
    validateItem(selection);
    localStorage.setItem(DIRECT_CHECKOUT_KEY, JSON.stringify(selection));
  }

  function clearDirectCheckout() {
    localStorage.removeItem(DIRECT_CHECKOUT_KEY);
  }

  window.FYCart = Object.freeze({
    getItems: readCart,
    getKey,
    productFor,
    addItem,
    updateQuantity,
    removeItems,
    clear,
    getCount,
    getDirectCheckout,
    setDirectCheckout,
    clearDirectCheckout,
  });
})();
