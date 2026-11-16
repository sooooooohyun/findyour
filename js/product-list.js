(() => {
  const grid = document.querySelector("[data-product-grid]");
  const products = window.FIND_YOUR_PRODUCTS || [];
  const money = new Intl.NumberFormat("ko-KR");

  function formatPreorderDate(date) {
    const [, month, day] = date.split("-").map(Number);
    if (!month || !day) {
      throw new Error(`예약배송 날짜 형식이 올바르지 않습니다: ${date}`);
    }
    return `${month}월 ${day}일`;
  }

  function renderMenuGrid() {
    if (!grid) return;
    const category = grid.dataset.category;
    const matchingProducts = products.filter((product) =>
      product.categories.includes(category),
    );
    grid.replaceChildren();
    matchingProducts.forEach((product, index) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.className = "product-card";
      link.href = `product.html?id=${encodeURIComponent(product.id)}`;
      const figure = document.createElement("figure");
      figure.className = "product-thumb";
      const image = document.createElement("img");
      image.src = encodeURI(product.image);
      image.alt = product.name;
      figure.append(image);

      if (category === "best") {
        const rank = document.createElement("span");
        rank.className = "rank";
        rank.textContent = String(index + 1);
        figure.append(rank);
      } else if (category === "new") {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = "NEW";
        figure.append(tag);
      }

      const info = document.createElement("div");
      info.className = "product-info";
      const name = document.createElement("h2");
      name.className = "product-name";
      name.textContent = product.name;
      const price = document.createElement("p");
      price.className = "product-price";
      price.textContent = `${money.format(product.price)}원`;
      const more = document.createElement("span");
      more.className = "product-more";
      more.textContent = "상품 자세히 보기";
      info.append(name, price);
      if (product.preorder) {
        const preorder = document.createElement("p");
        preorder.className = "preorder-tag";
        preorder.textContent =
          `예약배송 · ${formatPreorderDate(product.preorder.date)} 출고`;
        info.append(preorder);
      }
      info.append(more);
      link.append(figure, info);
      item.append(link);
      grid.append(item);
    });
  }

  function renderHomeGrid() {
    const homeGrid = document.querySelector("[data-home-new-grid]");
    if (!homeGrid) return;
    const newProducts = products.filter((product) => product.category === "new").slice(0, 4);
    homeGrid.replaceChildren();
    newProducts.forEach((product) => {
      const item = document.createElement("li");
      item.className = "new-card";
      const link = document.createElement("a");
      link.href = `product.html?id=${encodeURIComponent(product.id)}`;
      const figure = document.createElement("figure");
      figure.className = "home-img";
      const image = document.createElement("img");
      image.src = encodeURI(product.image);
      image.alt = product.name;
      const badge = document.createElement("span");
      badge.className = "new-badge";
      badge.textContent = "NEW";
      figure.append(image, badge);
      const name = document.createElement("p");
      name.className = "new-name";
      name.textContent = product.name;
      const price = document.createElement("p");
      price.className = "new-price";
      price.textContent = `${money.format(product.price)}원`;
      link.append(figure, name, price);
      item.append(link);
      homeGrid.append(item);
    });
  }

  renderMenuGrid();
  renderHomeGrid();
})();
