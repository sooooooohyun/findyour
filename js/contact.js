(() => {
  // 여기에 EmailJS 값을 넣으세요.
  const SERVICE_ID = "service_epo041o";
  const TEMPLATE_ID = "template_36j8m95";
  const PUBLIC_KEY = "MZ08FlNZfaE79qHk_";
  const RATE_LIMIT_KEY = "fy_contact_last_attempt";
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const form = document.querySelector("#contact-form");

  if (!form) return;

  const status = document.querySelector("#contact-status");
  const submitButton = document.querySelector("#contact-submit");
  const emailField = form.elements.email;
  const typeField = form.elements.type;
  const messageField = form.elements.message;
  const originalButtonText = submitButton.textContent.trim();
  let member = window.FYAuth.getCurrentUser();
  let lastAttemptAt = 0;
  let rateStorageUnavailable = false;

  function setMemberDefaults() {
    if (!member) return;
    if (!form.elements.name.value) form.elements.name.value = member.name;
    if (!emailField.value) emailField.value = member.email;
    if (!form.elements.tel.value && member.phone) {
      form.elements.tel.value = member.phone;
    }
  }

  function getLastAttemptAt() {
    try {
      const saved = Number(localStorage.getItem(RATE_LIMIT_KEY));
      return Number.isFinite(saved)
        ? Math.max(lastAttemptAt, saved)
        : lastAttemptAt;
    } catch (error) {
      rateStorageUnavailable = true;
      console.error("문의 전송 간격 저장 오류:", error);
      return lastAttemptAt;
    }
  }

  function recordAttempt(timestamp) {
    lastAttemptAt = timestamp;
    try {
      localStorage.setItem(RATE_LIMIT_KEY, String(timestamp));
      rateStorageUnavailable = false;
    } catch (error) {
      rateStorageUnavailable = true;
      console.error("문의 전송 간격 저장 오류:", error);
    }
  }

  const query = new URLSearchParams(window.location.search);
  const productName = query.get("product");
  if (query.get("type") === "product" && productName) {
    typeField.value = "product";
    messageField.value = `상품명: ${productName.trim()}\n\n`;
  }

  form.addEventListener("reset", () => {
    status.textContent = "";
    setMemberDefaults();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    if (!form.reportValidity()) return;

    const name = form.elements.name.value.trim();
    const tel = form.elements.tel.value.trim();
    const email = emailField.value.trim();
    const message = messageField.value.trim();
    const agreement = form.elements.agree.checked;
    if (!name) {
      status.textContent = "이름을 입력해 주세요.";
      form.elements.name.focus();
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      status.textContent = "이메일 주소를 올바른 형식으로 입력해 주세요.";
      emailField.focus();
      return;
    }
    if (message.length < 10) {
      status.textContent = "문의 내용은 10자 이상 입력해 주세요.";
      messageField.focus();
      return;
    }
    if (form.elements.website.value.trim()) {
      status.textContent = "요청을 확인할 수 없습니다. 내용을 확인해 다시 시도해 주세요.";
      return;
    }
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      status.textContent =
        "EmailJS 설정이 완료되지 않았습니다. js/contact.js의 설정값을 입력해 주세요.";
      return;
    }
    if (typeof emailjs === "undefined") {
      status.textContent = "EmailJS를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.";
      return;
    }
    if (rateStorageUnavailable) {
      status.textContent = "브라우저 저장소를 사용할 수 없어 문의 전송을 제한했습니다.";
      return;
    }

    const now = Date.now();
    const elapsed = now - getLastAttemptAt();
    if (elapsed < 30000) {
      const remaining = Math.ceil((30000 - elapsed) / 1000);
      status.textContent =
        `스팸 방지를 위해 전송 간격을 제한하고 있습니다. ${remaining}초 후 다시 시도해 주세요.`;
      return;
    }
    recordAttempt(now);
    if (rateStorageUnavailable) {
      status.textContent = "전송 간격을 저장할 수 없어 문의를 보내지 않았습니다.";
      return;
    }

    const templateParams = {
      name,
      tel,
      email,
      type: typeField.options[typeField.selectedIndex].textContent.trim(),
      message,
      agree: agreement ? "동의" : "미동의",
    };

    submitButton.disabled = true;
    submitButton.textContent = "보내는 중…";
    form.setAttribute("aria-busy", "true");
    status.textContent = "문의 내용을 보내고 있습니다.";
    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, {
        publicKey: PUBLIC_KEY,
      });
      form.reset();
      status.textContent = "문의가 성공적으로 전송되었습니다. 빠른 시일 내에 답변드리겠습니다.";
    } catch (error) {
      console.error("EmailJS 문의 전송 실패:", error);
      status.textContent =
        "문의 전송에 실패했습니다. 잠시 후 다시 시도해 주세요. 문제가 계속되면 고객센터로 문의해 주세요.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      form.removeAttribute("aria-busy");
    }
  });

  window.addEventListener("fy:auth-updated", () => {
    member = window.FYAuth.getCurrentUser();
    setMemberDefaults();
  });

  setMemberDefaults();

  try {
    localStorage.getItem(RATE_LIMIT_KEY);
  } catch (error) {
    rateStorageUnavailable = true;
    console.error("문의 전송 간격 저장 오류:", error);
    status.textContent = "브라우저 저장소를 사용할 수 없어 문의 전송을 제한했습니다.";
  }
})();
