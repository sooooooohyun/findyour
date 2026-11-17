# FIND YOUR __ 관리 안내

정적 쇼핑몰의 상품, 이미지, 리뷰, 배송, 쿠폰, 문의 기능을 수정할 때 참고하는 안내입니다. 경로는 프로젝트 루트 기준입니다.

## 1. 상품 추가

상품 데이터는 `js/products.js` 상단의 `makeProduct()`와 그 아래 `const products = [...]` 배열에서 관리합니다. 기존 상품 한 줄을 복사해 배열 안에 넣고, 새 상품 ID와 정보를 지정합니다.

상품 ID는 `new-07`, `top-07`처럼 소문자 카테고리 코드와 하이픈, 두 자리 번호를 조합합니다. 같은 ID를 중복 사용하지 마세요. 카테고리 코드는 `best`, `new`, `top`, `bottom`, `outer`, `dress`, `acc` 중 하나입니다.

```js
makeProduct("new-07", "new", "라운드 버튼 니트", 39000),
```

`makeProduct()`가 다음 값을 만듭니다.

- `id`, `category`, `name`, `price`: 위 호출에서 입력합니다. `price`는 원 단위 숫자이며 `39000`처럼 씁니다.
- `categories`: 기본 상품 카테고리에 `additionalCategories`를 더한 배열입니다. 여러 목록에 같이 노출하려면 마지막 인자로 `["top"]`처럼 전달합니다.
- `image`: 기본적으로 `images/shop/${id의 첫 하이픈을 공백으로 바꾼 값}.jpg`가 됩니다. 위 예시는 `images/shop/new 07.jpg`입니다.
- `description`: 카테고리별 문구와 상품명이 조합됩니다. 개별 설명을 쓰려면 배열을 닫은 다음 `makeProduct()` 결과의 `description`을 덮어씁니다.
- `sizes`: 기본은 `["S", "M", "L"]`, `acc`는 `["FREE"]`입니다. `colors` 기본값은 `["아이보리", "베이지", "핑크"]`입니다.
- `preorder`: 기본적으로 자동 지정되지 않습니다. 예약배송 상품은 아래 예약배송 안내처럼 객체를 추가합니다.

색상·사이즈·설명을 별도로 지정하고 예약배송도 설정하는 예시입니다. `products` 배열 선언 바로 다음에 추가하고 `window.FIND_YOUR_PRODUCTS = products;` 앞에 두세요.

```js
const addedProduct = makeProduct("new-07", "new", "라운드 버튼 니트", 39000);
addedProduct.image = "images/shop/new 07.jpg";
addedProduct.description = "부드러운 니트 소재의 라운드 버튼 가디건입니다.";
addedProduct.sizes = ["S", "M"];
addedProduct.colors = ["아이보리", "네이비"];
addedProduct.preorder = { date: "2026-12-15" };
products.push(addedProduct);
```

다른 상품과 다른 목록에도 보여 주려면 호출에서 추가 카테고리를 지정합니다.

```js
makeProduct("new-07", "new", "라운드 버튼 니트", 39000, ["top"]),
```

## 2. 상품 이미지

- 대표 상품 이미지: `images/shop/`에 저장합니다. 위 상품 예시의 파일은 `images/shop/new 07.jpg`입니다.
- 세로로 긴 상품 소개 이미지: `images/detail/상품ID.jpg`에 저장합니다. 예를 들어 `images/detail/new-07.jpg`입니다. `images/detail/` 폴더가 없다면 새로 만들고 상품 ID와 확장자를 정확히 맞춥니다.
- `js/products.js`에서 대표 이미지 경로를 생성할 때 ID의 첫 하이픈이 공백으로 바뀝니다. 현재 저장소의 파일명도 `new 01.jpg`처럼 공백을 포함합니다. 경로를 직접 덮어쓰거나 파일명을 바꿀 때는 `addedProduct.image`와 실제 파일명이 정확히 같아야 합니다. 공백이 있는 경로를 다른 코드에 직접 넣을 경우 공백과 URL 인코딩이 일치하는지 확인하세요.

## 3. 상품 목록과 홈 NEW

목록 카드의 `<li>`는 HTML에 직접 작성되어 있지 않습니다. `menu.html`, `menu-new.html`, `menu-top.html`, `menu-bottom.html`, `menu-outer.html`, `menu-dress.html`, `menu-acc.html`에는 `data-product-grid`가 있는 빈 `<ul>`이 있고, `js/product-list.js`가 `js/products.js`의 상품을 읽어 카드 `<li>`를 생성합니다. 새 상품을 `products` 배열에 추가하면 `category` 또는 `categories`에 해당하는 목록에 나타납니다. 목록은 6개에서 자르지 않으며 조건에 맞는 상품을 모두 표시합니다.

홈의 NEW 카드도 HTML에 상품 `<li>`를 직접 넣지 않습니다. `index.html`의 `<ul data-home-new-grid>`를 `js/product-list.js`가 채웁니다. NEW 카테고리 상품 중 `products` 배열 앞에서부터 4개만 보이므로 홈 카드에 노출하려는 상품은 배열의 NEW 상품 순서를 조정하세요. 목록 페이지는 카테고리 기준으로 자동 분류되므로 별도 `<li>` 복사는 필요하지 않습니다.

## 4. 리뷰 추가·수정

`js/reviews.js`의 `reviewLines`는 `best`, `new`, `top` 등의 카테고리별 기본 리뷰 문구 목록입니다. 상품별 기본 리뷰는 상품 ID를 기준으로 만들어지며 `FIND_YOUR_SAMPLE_REVIEWS`에 들어갑니다. 특정 상품에만 가상 리뷰를 추가하려면 `productSpecificReviews` 객체에 상품 ID를 키로 추가하세요. 이 리뷰는 해당 상품의 자동 생성 리뷰 앞에 표시됩니다.

```js
const productSpecificReviews = {
  "new-07": [
    {
      id: "sample-new-07-extra-1",
      name: "김*은",
      date: "2026.11.17",
      rating: 5,
      size: "M",
      fit: "정사이즈",
      content: "촉감이 부드럽고 단추 디테일이 예뻐서 자주 입고 있어요.",
      photo: false,
      helpful: 2,
      sample: true,
    },
  ],
};
```

리뷰의 `id`는 중복되지 않게 작성하고, `rating`은 1~5, `fit`은 `정사이즈`, `작아요`, `커요` 중 하나로 둡니다. `size`는 그 상품의 `sizes` 중 하나를 사용하세요. 페이지에서 작성한 사용자의 리뷰는 별도로 브라우저 저장소에 저장되며 이 예시 데이터와 다릅니다.

## 5. 예약배송

상품 데이터의 `preorder`는 `{ date: "YYYY-MM-DD" }` 형식입니다. 기존 공통 예약 날짜는 `js/products.js`의 `PREORDER_DATE`이며, 현재 `best-01`, `best-05`가 이 상수를 사용합니다. 이 두 상품의 날짜를 함께 바꾸려면 상수를 수정하세요. 다른 상품은 상품 객체에 `product.preorder = { date: "2026-12-15" };`처럼 설정하고, 예약이 끝나면 해당 `preorder` 할당을 제거합니다.

표시 문구는 `js/product-detail.js`의 상품 상세(“예약배송 · 날짜 출고”, “날짜부터 순차 발송됩니다.”), `js/product-list.js`의 목록(“예약배송 · 날짜 출고”), `js/cart-page.js`, `js/checkout.js`, `js/order-complete.js`, `js/mypage.js`의 주문 요약에서 생성합니다. 실제 출고 날짜는 `YYYY-MM-DD`로 입력하며 화면에는 월·일로 표시됩니다.

## 6. 가격·배송·쿠폰

- 기본 배송비와 무료배송 기준은 `js/pricing.js` 상단의 `SHIPPING_FEE = 5000`, `FREE_SHIPPING_THRESHOLD = 100000`입니다. 두 값은 원 단위입니다. 무료배송은 쿠폰 할인 전 상품 합계를 기준으로 계산합니다.
- 회원 가입 시 발급되는 쿠폰은 `js/coupons.js`의 `issueInitialCoupons()` 안에 있습니다. `첫 가입 쿠폰`의 `type`, `value`, `minOrderAmount`는 5,000원 할인 및 최소 주문 금액을, `첫 구매 쿠폰`은 10% 할인·최대 할인액 10,000원·최소 주문 금액 50,000원을 설정합니다. 쿠폰 이름이나 할인 조건을 바꿀 때 각 객체의 해당 필드를 수정하세요. `firstPurchaseOnly`는 첫 구매 제한 여부입니다.

## 7. 문의용 EmailJS 설정

문의 폼은 인증코드 절차 없이 비회원과 회원 모두 같은 문의용 템플릿으로 전송합니다. 설정값은 `js/contact.js` 파일 맨 위의 `SERVICE_ID`, `TEMPLATE_ID`, `PUBLIC_KEY`입니다. 현재 저장소에는 다음 값이 들어 있습니다.

```js
const SERVICE_ID = "service_epo041o";
const TEMPLATE_ID = "template_36j8m95";
const PUBLIC_KEY = "MZ08FlNZfaE79qHk_";
```

사이트에서 사용할 EmailJS 계정의 값으로 각 문자열을 바꾸세요. 설정 순서는 다음과 같습니다.

1. EmailJS에서 이메일 서비스를 연결하고 Service ID를 확인합니다.
2. 문의 템플릿 **하나만** 생성하고 받는 주소를 템플릿의 **To email**에 지정합니다.
3. 제목과 본문에 아래 문의 변수를 사용합니다.
4. EmailJS Account의 Public Key를 확인합니다.
5. EmailJS 보안 설정의 Allowed Origins에 사이트 도메인을 등록합니다. 필요한 경우 로컬 미리보기 주소도 추가합니다.
6. `js/contact.js`의 `SERVICE_ID`, `TEMPLATE_ID`, `PUBLIC_KEY`를 입력하고 문의 폼으로 전송을 확인합니다.

**Subject**

```text
[FIND YOUR __ 문의] {{type}} - {{name}}
```

**Body**

```text
이름: {{name}}
연락처: {{tel}}
이메일: {{email}}
문의 유형: {{type}}
개인정보 수집 및 이용 동의: {{agree}}

문의 내용:
{{message}}
```

템플릿 변수는 `name`, `tel`, `email`, `type`, `message`, `agree`입니다. **Private Key는 브라우저 코드나 저장소에 절대 넣지 마세요.** 이 사이트는 클라이언트에서 Public Key를 사용하므로 EmailJS의 Allowed Origins 제한을 설정하세요.

## 8. 스크롤 스냅 구역

공통 스냅 규칙은 `css/common.css` 아래쪽의 주석 `PC 포인터 환경에서 짧은 구역만 proximity 스냅합니다` 다음 블록 한 곳에 있습니다. 이 블록은 1024px 이상, hover 가능한 정밀 포인터, 움직임 줄이기 미설정 환경에서만 적용됩니다. 완전히 끄려면 이 블록 하나를 삭제하세요.

스냅할 HTML의 짧은 `<section>`에 `snap-section` 클래스를 직접 붙입니다.

```html
<section class="section snap-section" aria-labelledby="sample-title">
```

대상 구역은 화면 높이의 90% 이내로 유지합니다. 길어지면 그 구역에서 `snap-section`을 제거하세요. 모바일·태블릿·터치 환경과 `prefers-reduced-motion` 사용자는 일반 스크롤입니다. 상품 목록, 상품 상세·리뷰, 긴 상세 이미지, STORY 연표, 장바구니, 결제, 문의, 가입·로그인, 마이페이지, 푸터에는 이 클래스를 붙이지 않습니다.

## 9. 주소 검색·출석 쿠폰·주문 그룹·장바구니 미리보기

- **도로명 주소 검색:** `checkout.html`에서 카카오(다음) 우편번호 스크립트 `https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js`를 불러오며, 동작과 수동 입력 대체 안내는 `js/checkout.js`, 모달 모양은 `css/checkout.css`에서 관리합니다. 이 서비스는 API 키 없이 사용할 수 있습니다. 검색 창이 열리지 않으면 인터넷 연결과 브라우저 개발자 도구의 네트워크 탭에서 CDN 응답을 확인하고, 확장 프로그램이나 네트워크 보안 설정이 요청을 차단하는지 확인하세요. CDN이 로드되지 않으면 안내에 따라 주소를 직접 입력할 수 있습니다.
- **출석체크 보상:** 금액과 조건은 `js/coupons.js`의 `ATTENDANCE_COUPON_RULES` 한 곳에서 바꿉니다. `tenDay`는 연속 출석 일수, 할인율, 최소 주문 금액, 최대 할인액, 유효 기간을, `fullMonth`는 한 달 개근 쿠폰의 같은 값을 가집니다. 달력과 사용자별 월간 기록·지급 안내는 `mypage.html`, `js/mypage.js`, `css/mypage.css`에 있습니다. 쿠폰 ID에는 사용자와 `YYYY-MM`이 들어가 같은 달 같은 쿠폰이 중복 발급되지 않습니다.
- **예약배송 주문번호:** `js/orders.js`에서 일반 상품은 한 주문으로 묶고, 예약 상품은 상품의 `preorder.date` 문자열이 같은 것끼리 묶습니다. 날짜가 다르면 주문번호도 다릅니다. 결제는 한 번이며 할인과 배송비를 상품 금액 비율로 주문 그룹에 배분하고, 반올림 차이는 첫 번째 주문에 반영해 주문 금액 합계가 최종 결제 금액과 같도록 합니다. 결과는 `js/order-complete.js`와 `js/mypage.js`에서 주문번호별로 표시합니다.
- **플로팅 장바구니 미리보기:** 공통 삽입·상품 순환·수량 갱신은 `js/common.js`, 위치·크기·반응형 스타일은 `css/common.css`입니다. 상품 정보는 장바구니와 `js/products.js`에서 가져옵니다. 팝오버는 마우스와 키보드에서 열리고, 터치 기기에서는 버튼을 누르면 장바구니로 이동합니다.
- **화면 문구와 푸터:** 화면에 표시되는 문구에는 “예시”, “가상”, “과제”, “샘플”, “데모”, “테스트용” 등 제작·데이터 설명을 넣지 않습니다. 기존 푸터의 `본 사이트는 웹 제작 과제용 가상 사이트입니다.` 문구만 모든 페이지에서 유지합니다.

## 10. 무엇을 바꾸려면 어느 파일의 어느 부분

| 바꾸려는 내용 | 파일 | 위치 |
| --- | --- | --- |
| 상품 추가·이름·가격·카테고리·사이즈·색상 | `js/products.js` | `makeProduct()` 아래 `products` 배열 |
| 대표 상품 사진 | `images/shop/` 및 필요 시 `js/products.js` | ID에 맞는 이미지 파일, 상품의 `image` |
| 긴 상품 소개 사진 | `images/detail/상품ID.jpg` | 상품 ID와 같은 파일명 |
| 자동 리뷰 문구·특정 상품 리뷰 | `js/reviews.js` | `reviewLines`, `productSpecificReviews` |
| 예약배송 날짜 | `js/products.js` | `PREORDER_DATE` 또는 상품의 `preorder.date` |
| 배송비·무료배송 기준 | `js/pricing.js` | `SHIPPING_FEE`, `FREE_SHIPPING_THRESHOLD` |
| 가입·첫 구매 쿠폰 | `js/coupons.js` | `issueInitialCoupons()`의 쿠폰 객체 |
| 문의 메일 설정·전송 | `js/contact.js` | `SERVICE_ID`, `TEMPLATE_ID`, `PUBLIC_KEY` |
| EmailJS 문의 템플릿 | EmailJS 대시보드 | 문의 템플릿 하나와 본문 변수 |
| 스냅 대상 구역 | `index.html`, `about.html`, `location.html` 등 | 해당 짧은 section의 `snap-section` 클래스 |
| 스냅 조건·플로팅 장바구니 모양 | `css/common.css` | 공통 스냅 블록·`.floating-cart` |
| 플로팅 장바구니 삽입·수량 갱신 | `js/common.js` | 페이지 공통 초기화·storage 이벤트 |
| 출석체크 달력·사용자별 월간 기록 | `mypage.html`, `js/mypage.js`, `css/mypage.css` | 출석 구역·달력 렌더링·기록 키 |
| 출석체크 쿠폰 조건·금액 | `js/coupons.js` | `ATTENDANCE_COUPON_RULES` |
| 주소 검색 CDN·수동 입력 대체 | `checkout.html`, `js/checkout.js`, `css/checkout.css` | 우편번호 스크립트·주소 dialog |
| 배송 그룹별 주문 생성·금액 안분 | `js/orders.js` | `groupItemsByShipmentDate()`, `allocateAmount()` |
| 주문 완료 그룹 표시 | `order-complete.html`, `js/order-complete.js`, `css/order-complete.css` | 주문 템플릿·그룹 금액·예상 출고일 |
| 사이트 화면 문구·푸터 문구 | 각 페이지의 HTML 및 JS | 화면 문구는 안내 원칙을 지키고 기존 푸터 고정 문구 유지 |
