(() => {
  const categoryLabels = {
    best: "BEST",
    new: "NEW",
    top: "TOP",
    bottom: "BOTTOM",
    outer: "OUTER",
    dress: "DRESS",
    acc: "ACC",
  };

  const categoryDescriptions = {
    best: "꾸준히 손이 가는 실루엣과 섬세한 디테일을 담았습니다.",
    new: "새로운 계절에 가볍게 더하기 좋은 아이템입니다.",
    top: "다양한 하의와 자연스럽게 어울리는 데일리 상의입니다.",
    bottom: "편안한 착용감과 균형 잡힌 실루엣을 담았습니다.",
    outer: "간절기부터 차분한 레이어드까지 활용하기 좋습니다.",
    dress: "한 벌만으로도 자연스러운 분위기를 완성합니다.",
    acc: "일상의 룩에 은은한 포인트를 더해 줍니다.",
  };
  const PREORDER_DATE = "2026-12-01";

  function makeProduct(id, category, name, price, additionalCategories) {
    const categories = [category, ...(additionalCategories || [])];
    let colors;
    switch (id) {
      case "new-02":
        colors = ["네이비", "머스타드", "핑크"];
        break;
      case "new-03":
        colors = ["핑크", "라벤더", "블루"];
        break;
      case "new-04":
        colors = ["크림", "모카", "세이지 그린"];
        break;
      case "best-01":
        colors = ["아이보리", "민트", "스카이 블루"];
        break;
      case "best-02":
        colors = ["핑크", "옐로우", "스카이 블루"];
        break;
      default:
        colors = ["아이보리", "베이지", "핑크"];
    }
    const product = {
      id,
      category,
      categories,
      name,
      price,
      image: `images/shop/${id.replace("-", " ")}.jpg`,
      description: `${categoryDescriptions[category]} ${name} 상품입니다.`,
      sizes: category === "acc" ? ["FREE"] : ["S", "M", "L"],
      colors: colors,
    };
    if (id === "best-01" || id === "best-05") {
      product.preorder = { date: PREORDER_DATE };
    }
    return product;
  }

  const products = [
    makeProduct("best-01", "best", "체리 리본 니트 가디건", 29000),
    makeProduct("best-02", "best", "퍼프 슬리브 블라우스", 35000),
    makeProduct("best-03", "best", "하트 포켓 데님 팬츠", 39000, ["bottom"]),
    makeProduct("best-04", "best", "로즈 플리츠 스커트", 32000, ["bottom"]),
    makeProduct("best-05", "best", "버블 숏 패딩", 89000, ["outer"]),
    makeProduct("best-06", "best", "리본 미니 원피스", 49000, ["dress"]),
    makeProduct("new-01", "new", "체리 리본 니트", 34000),
    makeProduct("new-02", "new", "별 자수 맨투맨", 38000),
    makeProduct("new-03", "new", "캔디 플리츠 스커트", 31000),
    makeProduct("new-04", "new", "하트 키링 숄더백", 27000, ["acc"]),
    makeProduct("new-05", "new", "크림 퍼프 가디건", 36000),
    makeProduct("new-06", "new", "파스텔 스트라이프 셔츠", 33000, ["top"]),
    makeProduct("top-01", "top", "레몬 크롭 니트", 28000),
    makeProduct("top-02", "top", "프릴 카라 블라우스", 34000),
    makeProduct("top-03", "top", "하트 자수 맨투맨", 36000),
    makeProduct("top-05", "top", "리본 슬리브리스", 24000),
    makeProduct("top-06", "top", "버터 컬러 가디건", 37000),
    makeProduct("bottom-03", "bottom", "크림 와이드 슬랙스", 35000),
    makeProduct("bottom-04", "bottom", "핑크 체크 스커트", 29000),
    makeProduct("bottom-05", "bottom", "버터 코튼 쇼츠", 25000),
    makeProduct("bottom-06", "bottom", "리본 카고 팬츠", 42000),
    makeProduct("outer-02", "outer", "크림 퀼팅 점퍼", 69000),
    makeProduct("outer-03", "outer", "핑크 트위드 재킷", 78000),
    makeProduct("outer-04", "outer", "체리 니트 집업", 45000),
    makeProduct("outer-05", "outer", "버터 울 코트", 119000),
    makeProduct("outer-06", "outer", "리본 바람막이", 52000),
    makeProduct("dress-02", "dress", "프릴 샤워 원피스", 55000),
    makeProduct("dress-03", "dress", "핑크 깅엄 원피스", 52000),
    makeProduct("dress-04", "dress", "버터 서스펜더 원피스", 46000),
    makeProduct("dress-05", "dress", "하트넥 롱 원피스", 58000),
    makeProduct("dress-06", "dress", "파스텔 니트 원피스", 48000),
    makeProduct("acc-02", "acc", "체리 헤어핀 세트", 9000),
    makeProduct("acc-03", "acc", "리본 머리끈", 5000),
    makeProduct("acc-04", "acc", "별 모양 귀걸이", 12000),
    makeProduct("acc-05", "acc", "파스텔 퀼팅 파우치", 18000),
    makeProduct("acc-06", "acc", "버터 니트 비니", 16000),
  ];

  window.FIND_YOUR_PRODUCTS = products;
  window.FIND_YOUR_CATEGORY_LABELS = categoryLabels;
})();
