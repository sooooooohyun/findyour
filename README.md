# FIND YOUR __ EmailJS 설정

문의 폼은 EmailJS를 통해 브라우저에서 이메일을 전송합니다. 실제 전송 전 아래 값과 EmailJS 템플릿을 설정해야 합니다.

## 설정 순서

1. EmailJS 계정을 만들고 Email Services에서 Gmail 서비스를 연결합니다.
2. Email Templates에서 템플릿을 만들고 **To email**에 문의를 받을 이메일 주소를 입력합니다.
3. 템플릿 제목과 본문에 아래 변수명을 사용합니다.
4. Account의 Public Key를 확인합니다.
5. EmailJS 보안 설정의 Allowed Origins에 사이트 도메인을 등록합니다. 로컬 미리보기 주소도 필요한 경우 추가합니다.
6. `js/contact.js` 상단의 `SERVICE_ID`, `TEMPLATE_ID`, `PUBLIC_KEY`에 각각 서비스 ID, 템플릿 ID, Public Key를 입력합니다.
7. 인증코드용 템플릿을 별도로 만들고 `js/contact.js`의 `VERIFY_TEMPLATE_ID`에 그 템플릿 ID를 입력합니다.

## 템플릿 예시

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

보내는 변수명은 `name`, `tel`, `email`, `type`, `message`, `agree`입니다. 받는 이메일은 코드에 저장하지 말고 EmailJS 템플릿의 **To email**에서 지정하세요. Public Key는 정적 사이트에서 사용하는 공개 키이며, EmailJS의 도메인 제한 설정을 함께 적용해야 합니다.

## 비회원 이메일 인증 템플릿

문의 템플릿과 다른 인증 전용 템플릿을 생성하세요. 템플릿의 **To email**에는 `{{to_email}}`을 입력하고 본문에는 아래처럼 인증코드를 표시합니다.

```text
FIND YOUR __ 이메일 인증코드: {{code}}
5분 안에 문의 페이지에 입력해 주세요.
```

인증 템플릿 변수는 `to_email`, `code`입니다. 인증 템플릿의 ID만 `VERIFY_TEMPLATE_ID`에 넣으세요. 비회원은 인증 후 문의를 보낼 수 있고, 로그인한 회원은 인증 단계를 건너뜁니다. 인증코드는 브라우저에서 생성되고 해시로 현재 탭의 `sessionStorage`에만 보관됩니다. 정적 사이트 방식이므로 서버 검증이 없어 완전한 보안을 제공하지 않습니다.
