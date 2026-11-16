(() => {
  const signupForm = document.querySelector("#signup-form");
  const loginForm = document.querySelector("#login-form");

  function setFieldError(form, fieldName, message) {
    const input = form.elements[fieldName];
    const error = form.querySelector(`[data-error-for="${fieldName}"]`);
    if (!input || !error) return;
    error.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function clearErrors(form) {
    form.querySelectorAll("[data-error-for]").forEach((error) => {
      setFieldError(form, error.dataset.errorFor, "");
    });
  }

  signupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors(signupForm);
    const status = document.querySelector("#signup-status");
    const formData = new FormData(signupForm);
    const name = String(formData.get("name")).trim();
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));
    const confirmation = String(formData.get("confirm-password"));
    const phone = String(formData.get("phone"));
    let valid = true;

    if (!name) {
      setFieldError(signupForm, "name", "이름을 입력해 주세요.");
      valid = false;
    }
    if (!email || !signupForm.elements.email.validity.valid) {
      setFieldError(signupForm, "email", "올바른 이메일 주소를 입력해 주세요.");
      valid = false;
    }
    if (password.length < 8) {
      setFieldError(signupForm, "password", "비밀번호는 8자 이상 입력해 주세요.");
      valid = false;
    }
    if (password !== confirmation) {
      setFieldError(signupForm, "confirm-password", "비밀번호가 일치하지 않습니다.");
      valid = false;
    }
    if (!signupForm.elements.agree.checked) {
      setFieldError(signupForm, "agree", "개인정보 처리에 동의해 주세요.");
      valid = false;
    }
    if (!valid) return;

    const submitButton = signupForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    status.textContent = "가입 정보를 저장하고 있습니다.";
    try {
      const user = await window.FYAuth.signup({ name, email, password, phone });
      if (window.FYCoupons) {
        window.FYCoupons.issueInitialCoupons(user);
      }
      window.dispatchEvent(new Event("fy:auth-updated"));
      status.textContent =
        "가입이 완료되었습니다. 첫 가입 쿠폰과 첫 구매 쿠폰을 쿠폰함에 발급했습니다.";
    } catch (error) {
      if (error.code === "EMAIL_EXISTS") {
        setFieldError(signupForm, "email", error.message);
        status.textContent = "";
        signupForm.elements.email.focus();
      } else {
        status.textContent = error.message || "가입 처리 중 오류가 발생했습니다.";
        console.error("회원가입 오류:", error);
      }
    } finally {
      submitButton.disabled = false;
    }
  });

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors(loginForm);
    const status = document.querySelector("#login-status");
    if (!loginForm.reportValidity()) return;

    const email = loginForm.elements.email.value.trim();
    const password = loginForm.elements.password.value;
    const submitButton = loginForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    status.textContent = "로그인하고 있습니다.";
    try {
      await window.FYAuth.login(email, password);
      window.location.href = "mypage.html";
    } catch (error) {
      if (error.code === "INVALID_CREDENTIALS") {
        status.textContent = error.message;
      } else {
        status.textContent = error.message || "로그인 처리 중 오류가 발생했습니다.";
        console.error("로그인 오류:", error);
      }
    } finally {
      submitButton.disabled = false;
    }
  });
})();
