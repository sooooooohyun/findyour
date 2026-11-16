(() => {
  // 여기에 EmailJS 값을 넣으세요.
  const SERVICE_ID = "service_epo041o";
  const TEMPLATE_ID = "template_36j8m95";
  const VERIFY_TEMPLATE_ID = "";
  const PUBLIC_KEY = "MZ08FlNZfaE79qHk_";
  const VERIFICATION_KEY = "fy_contact_verification";
  const RATE_LIMIT_KEY = "fy_contact_last_attempt";
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const form = document.querySelector("#contact-form");

  if (!form) return;

  const status = document.querySelector("#contact-status");
  const submitButton = document.querySelector("#contact-submit");
  const verificationArea = document.querySelector("[data-email-verification]");
  const verificationStatus = document.querySelector("#verification-status");
  const verificationCode = document.querySelector("#verification-code");
  const verificationSendButton = document.querySelector("#verification-send");
  const verificationConfirmButton = document.querySelector("#verification-confirm");
  const emailField = form.elements.email;
  const typeField = form.elements.type;
  const messageField = form.elements.message;
  const originalButtonText = submitButton.textContent.trim();
  let member = window.FYAuth.getCurrentUser();
  let lastAttemptAt = 0;
  let rateStorageUnavailable = false;

  function setVerificationMessage(message) {
    verificationStatus.textContent = message;
  }

  function readVerification() {
    const saved = sessionStorage.getItem(VERIFICATION_KEY);
    if (saved === null) return null;
    let record;
    try {
      record = JSON.parse(saved);
    } catch (error) {
      console.error("이메일 인증 정보를 읽지 못했습니다.", error);
      throw new Error("이메일 인증 정보를 읽지 못했습니다. 다시 인증해 주세요.");
    }
    if (
      !record ||
      typeof record.email !== "string" ||
      typeof record.hash !== "string" ||
      typeof record.salt !== "string" ||
      !Number.isFinite(record.sentAt) ||
      !Number.isFinite(record.expiresAt) ||
      !Number.isInteger(record.attempts)
    ) {
      throw new Error("이메일 인증 정보가 올바르지 않습니다. 다시 인증해 주세요.");
    }
    return record;
  }

  function writeVerification(record) {
    try {
      sessionStorage.setItem(VERIFICATION_KEY, JSON.stringify(record));
    } catch (error) {
      console.error("이메일 인증 저장 오류:", error);
      throw new Error("인증 정보를 저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.");
    }
  }

  function randomHex(byteLength) {
    const bytes = window.crypto.getRandomValues(new Uint8Array(byteLength));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function hashCode(code, salt) {
    if (!window.crypto?.subtle) {
      throw new Error("이 브라우저에서는 이메일 인증을 지원하지 않습니다.");
    }
    const data = new TextEncoder().encode(`${salt}:${code}`);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }

  function getCurrentVerification() {
    try {
      return readVerification();
    } catch (error) {
      setVerificationMessage(error.message);
      submitButton.disabled = true;
      return null;
    }
  }

  function isVerifiedForCurrentEmail() {
    const record = getCurrentVerification();
    return Boolean(
      record &&
        record.sent &&
        record.verified &&
        !record.locked &&
        record.email === emailField.value.trim().toLowerCase() &&
        Date.now() <= record.expiresAt,
    );
  }

  function updateVerificationState() {
    if (member) {
      verificationArea.hidden = true;
      submitButton.disabled = false;
      return;
    }
    verificationArea.hidden = false;
    submitButton.disabled = !isVerifiedForCurrentEmail();
  }

  function setMemberDefaults() {
    if (!member) return;
    if (!form.elements.name.value) form.elements.name.value = member.name;
    if (!emailField.value) emailField.value = member.email;
    if (!form.elements.tel.value && member.phone) {
      form.elements.tel.value = member.phone;
    }
    verificationArea.hidden = true;
    submitButton.disabled = false;
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

  function getCooldownMessage(record, now) {
    if (!record || !Number.isFinite(record.sentAt)) return "";
    const remaining = Math.ceil((30000 - (now - record.sentAt)) / 1000);
    return remaining > 0 ? `재전송까지 ${remaining}초 남았습니다.` : "";
  }

  function refreshVerificationMessage() {
    if (member) return;
    const record = getCurrentVerification();
    if (!record || record.email !== emailField.value.trim().toLowerCase()) return;
    if (record.locked) {
      setVerificationMessage("인증 시도 횟수를 초과해 인증이 잠겼습니다.");
    } else if (record.verified && Date.now() <= record.expiresAt) {
      setVerificationMessage("이메일 인증이 완료되었습니다.");
    } else if (Date.now() > record.expiresAt) {
      setVerificationMessage("인증 시간이 만료되었습니다. 다시 인증코드를 받아 주세요.");
    } else if (!record.sent) {
      return;
    } else {
      const remaining = Math.ceil((record.expiresAt - Date.now()) / 1000);
      const minutes = Math.floor(remaining / 60);
      const seconds = String(remaining % 60).padStart(2, "0");
      const cooldown = getCooldownMessage(record, Date.now());
      const cooldownText = cooldown ? ` ${cooldown}` : "";
      setVerificationMessage(
        `인증코드 만료까지 ${minutes}분 ${seconds}초 남았습니다.${cooldownText}`,
      );
    }
    updateVerificationState();
  }

  async function sendVerificationCode() {
    if (member) return;
    const email = emailField.value.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      setVerificationMessage("인증받을 이메일 주소를 올바르게 입력해 주세요.");
      emailField.focus();
      return;
    }

    let previous;
    try {
      previous = readVerification();
    } catch (error) {
      setVerificationMessage(error.message);
      return;
    }
    if (previous?.locked) {
      setVerificationMessage("인증 시도 횟수를 초과해 인증이 잠겼습니다.");
      return;
    }
    const cooldown = getCooldownMessage(previous, Date.now());
    if (cooldown) {
      setVerificationMessage(cooldown);
      return;
    }
    if (!SERVICE_ID || !VERIFY_TEMPLATE_ID || !PUBLIC_KEY) {
      setVerificationMessage(
        "EmailJS 설정이 필요합니다. js/contact.js의 VERIFY_TEMPLATE_ID를 입력해 주세요.",
      );
      return;
    }
    if (typeof emailjs === "undefined") {
      setVerificationMessage("EmailJS를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.");
      return;
    }

    verificationSendButton.disabled = true;
    setVerificationMessage("인증코드를 보내고 있습니다.");
    try {
      const now = Date.now();
      const code = String(
        window.crypto.getRandomValues(new Uint32Array(1))[0] % 1000000,
      ).padStart(6, "0");
      const record = {
        email,
        salt: randomHex(16),
        hash: "",
        sentAt: now,
        expiresAt: now + 5 * 60 * 1000,
        attempts: 0,
        verified: false,
        locked: false,
        sent: false,
      };
      record.hash = await hashCode(code, record.salt);
      writeVerification(record);
      await emailjs.send(
        SERVICE_ID,
        VERIFY_TEMPLATE_ID,
        { to_email: email, code },
        { publicKey: PUBLIC_KEY },
      );
      record.sent = true;
      writeVerification(record);
      setVerificationMessage("인증코드를 보냈습니다. 5분 내 입력해 주세요. 재전송까지 30초가 필요합니다.");
      verificationCode.focus();
    } catch (error) {
      setVerificationMessage(
        error.message || "인증코드를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
      console.error("이메일 인증코드 전송 실패:", error);
    } finally {
      verificationSendButton.disabled = false;
      updateVerificationState();
    }
  }

  async function confirmVerificationCode() {
    if (member) return;
    const record = getCurrentVerification();
    if (!record || !record.sent) {
      setVerificationMessage("먼저 인증코드를 받아 주세요.");
      return;
    }
    if (record.email !== emailField.value.trim().toLowerCase()) {
      setVerificationMessage("이메일 주소가 달라졌습니다. 해당 주소로 인증코드를 받아 주세요.");
      return;
    }
    if (record.locked) {
      setVerificationMessage("인증 시도 횟수를 초과해 인증이 잠겼습니다.");
      return;
    }
    if (Date.now() > record.expiresAt) {
      setVerificationMessage("인증 시간이 만료되었습니다. 다시 인증코드를 받아 주세요.");
      return;
    }
    if (!/^\d{6}$/.test(verificationCode.value.trim())) {
      setVerificationMessage("인증코드 6자리를 입력해 주세요.");
      verificationCode.focus();
      return;
    }
    if (record.attempts >= 5) {
      record.locked = true;
      writeVerification(record);
      setVerificationMessage("인증 시도 횟수를 초과해 인증이 잠겼습니다.");
      updateVerificationState();
      return;
    }

    verificationConfirmButton.disabled = true;
    try {
      const enteredHash = await hashCode(verificationCode.value.trim(), record.salt);
      if (enteredHash !== record.hash) {
        record.attempts += 1;
        if (record.attempts > 5) record.locked = true;
        writeVerification(record);
        setVerificationMessage(
          record.locked
            ? "인증 시도 횟수를 초과해 인증이 잠겼습니다."
            : `인증코드가 일치하지 않습니다. 남은 시도 ${5 - record.attempts}회.`,
        );
        return;
      }
      record.verified = true;
      writeVerification(record);
      setVerificationMessage("이메일 인증이 완료되었습니다.");
      updateVerificationState();
    } catch (error) {
      setVerificationMessage(error.message || "인증을 확인하지 못했습니다.");
      console.error("이메일 인증 확인 오류:", error);
    } finally {
      verificationConfirmButton.disabled = false;
    }
  }

  const query = new URLSearchParams(window.location.search);
  const productName = query.get("product");
  if (query.get("type") === "product" && productName) {
    typeField.value = "product";
    messageField.value = `상품명: ${productName.trim()}\n\n`;
  }

  verificationSendButton.addEventListener("click", sendVerificationCode);
  verificationConfirmButton.addEventListener("click", confirmVerificationCode);
  emailField.addEventListener("input", () => {
    if (member) return;
    const record = getCurrentVerification();
    if (record && record.verified && record.email !== emailField.value.trim().toLowerCase()) {
      record.verified = false;
      try {
        writeVerification(record);
      } catch (error) {
        setVerificationMessage(error.message);
      }
      setVerificationMessage("이메일 주소가 변경되어 인증이 해제되었습니다.");
    }
    updateVerificationState();
  });

  form.addEventListener("reset", () => {
    status.textContent = "";
    verificationCode.value = "";
    setMemberDefaults();
    updateVerificationState();
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
    if (!member && !isVerifiedForCurrentEmail()) {
      status.textContent = "문의 전 이메일 인증을 완료해 주세요.";
      verificationCode.focus();
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
      submitButton.textContent = originalButtonText;
      form.removeAttribute("aria-busy");
      updateVerificationState();
    }
  });

  window.addEventListener("fy:auth-updated", () => {
    member = window.FYAuth.getCurrentUser();
    setMemberDefaults();
    updateVerificationState();
  });

  setMemberDefaults();
  updateVerificationState();
  window.setInterval(refreshVerificationMessage, 1000);

  try {
    localStorage.getItem(RATE_LIMIT_KEY);
  } catch (error) {
    rateStorageUnavailable = true;
    console.error("문의 전송 간격 저장 오류:", error);
    status.textContent = "브라우저 저장소를 사용할 수 없어 문의 전송을 제한했습니다.";
  }
})();
