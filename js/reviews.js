(() => {
  const writers = ["김*은", "박*연", "이*정", "최*아", "정*민", "한*서"];
  const fits = ["정사이즈", "작아요", "커요"];
  const sizes = ["S", "M", "L", "FREE"];
  const reviewLines = {
    best: [
      "사진으로 봤을 때보다 색이 차분해서 평소 옷에도 잘 어울려요.",
      "디테일이 과하지 않아 자주 입게 돼요. 마감도 깔끔합니다.",
      "기대했던 느낌 그대로예요. 소재가 부드러워 편하게 입었습니다.",
      "배송이 빠르게 왔고 포장도 단정했어요. 코디하기 편합니다.",
      "사이즈가 고민이었는데 평소 입는 사이즈로 무난하게 맞았어요.",
      "화면과 색감 차이가 크지 않고 계절에 잘 맞는 두께예요.",
    ],
    new: [
      "색감이 은은해서 마음에 들어요. 출근할 때도 부담 없이 입습니다.",
      "디자인이 귀엽지만 과하지 않아서 자주 손이 가네요.",
      "원단 촉감이 괜찮고 핏도 편안해서 만족스럽게 입고 있어요.",
      "사진과 비슷한 색이라 좋았어요. 다른 아이템과 매치하기 쉽습니다.",
      "받아 보니 마감이 깔끔하고 전체적으로 단정한 느낌이에요.",
      "처음 입어 봤는데 생각보다 편해서 데일리로 잘 활용하고 있어요.",
    ],
    top: [
      "촉감이 부드럽고 어깨선이 자연스러워 편하게 입고 있어요.",
      "단독으로 입어도 좋고 가벼운 아우터 안에 받쳐 입기 괜찮아요.",
      "너무 붙지 않는 핏이라 활동할 때 편했습니다.",
      "세탁 후에도 모양이 크게 변하지 않아 만족해요.",
      "색이 튀지 않아 가지고 있는 하의와 잘 맞네요.",
      "기장이 적당해서 넣어 입거나 빼 입기 모두 편합니다.",
    ],
    bottom: [
      "허리와 기장이 편안하고 움직일 때 불편함이 없어요.",
      "실루엣이 깔끔해서 상의를 다양하게 매치하기 좋습니다.",
      "원단이 생각보다 탄탄하고 색상도 차분해서 마음에 들어요.",
      "평소 입는 사이즈로 골랐더니 여유 있게 잘 맞았습니다.",
      "주머니가 실용적이고 오래 앉아 있어도 편했어요.",
      "계절에 맞는 두께라 지금 입기 좋고 핏도 만족합니다.",
    ],
    outer: [
      "가벼운데 바람을 잘 막아줘서 요즘 자주 입고 있어요.",
      "안에 니트를 입어도 움직이기 편하고 핏이 단정합니다.",
      "색이 화면과 비슷하고 봉제도 깔끔해 보여요.",
      "두께가 부담스럽지 않아 간절기에 활용하기 좋겠습니다.",
      "길이감이 마음에 들어요. 평소 입는 옷 위에 걸치기 편해요.",
      "포근하고 무겁지 않아서 데일리 아우터로 잘 입고 있습니다.",
    ],
    dress: [
      "한 벌로 코디가 정리돼서 외출 준비가 편해졌어요.",
      "기장이 적당하고 움직일 때 편안해서 자주 입을 것 같아요.",
      "실루엣이 자연스럽고 디테일도 과하지 않아 마음에 듭니다.",
      "색감이 은은해서 부담 없이 입기 좋고 원단도 부드러워요.",
      "평소 사이즈로 골랐더니 허리와 어깨가 잘 맞았습니다.",
      "사진보다 실제 핏이 더 편안하고 안감도 깔끔해요.",
    ],
    acc: [
      "크기가 적당하고 마감이 단정해 가볍게 들기 좋아요.",
      "디테일이 귀여운데 튀지 않아 평소 소품과 잘 어울립니다.",
      "선물용으로 준비했는데 포장도 깔끔하고 만족스러워요.",
      "가방 안에 넣고 다니기 편하고 소재도 괜찮습니다.",
      "착용감이 가벼워 오래 사용해도 부담이 적어요.",
      "색이 차분해서 다른 아이템과 같이 쓰기 좋네요.",
    ],
  };

  function hash(value) {
    return Array.from(value).reduce(
      (total, character) => total + character.charCodeAt(0),
      0,
    );
  }

  function createReviews(product) {
    const variants = reviewLines[product.category];
    const seed = hash(product.id);
    const count = 3 + (seed % 4);

    return Array.from({ length: count }, (_, index) => {
      const variant = (seed + index) % variants.length;
      const day = String(2 + ((seed + index * 3) % 14)).padStart(2, "0");
      const score = 3 + ((seed + index) % 3);
      return {
        id: `sample-${product.id}-${index}`,
        name: writers[(seed + index) % writers.length],
        date: `2026.11.${day}`,
        rating: score,
        size: product.sizes[(seed + index) % product.sizes.length],
        fit: fits[(seed + index) % fits.length],
        content: variants[variant],
        photo: (seed + index) % 3 === 0,
        helpful: (seed + index * 2) % 8,
        sample: true,
      };
    });
  }

  window.FIND_YOUR_SAMPLE_REVIEWS = Object.fromEntries(
    window.FIND_YOUR_PRODUCTS.map((product) => [
      product.id,
      createReviews(product),
    ]),
  );
})();
