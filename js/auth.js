(() => {
  const USERS_KEY = "fy_users";
  const SESSION_KEY = "fy_session";

  function readJSON(key, fallback) {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error(`회원 저장값을 읽지 못했습니다 (${key}).`, error);
      throw new Error("회원 정보를 읽을 수 없습니다. 브라우저 저장 데이터를 확인해 주세요.");
    }
  }

  function getCrypto() {
    if (!window.crypto?.subtle || !window.crypto.getRandomValues) {
      throw new Error("이 브라우저에서는 안전한 비밀번호 처리를 지원하지 않습니다.");
    }
    return window.crypto;
  }

  function randomHex(byteLength) {
    const bytes = getCrypto().getRandomValues(new Uint8Array(byteLength));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function hashPassword(password, salt) {
    // 학습용 구현이며 실제 서비스의 인증 보안으로 사용할 수 없습니다.
    const input = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await getCrypto().subtle.digest("SHA-256", input);
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }

  function toPublicUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
    };
  }

  async function signup({ name, email, password, phone }) {
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new Error("이름과 올바른 이메일 주소를 입력해 주세요.");
    }
    if (password.length < 8) {
      throw new Error("비밀번호는 8자 이상 입력해 주세요.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const users = readJSON(USERS_KEY, []);
    if (users.some((user) => user.email === normalizedEmail)) {
      const error = new Error("이미 가입된 이메일입니다.");
      error.code = "EMAIL_EXISTS";
      throw error;
    }

    const salt = randomHex(16);
    const user = {
      id: randomHex(16),
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      salt,
      passwordHash: await hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    };
    const updatedUsers = [...users, user];

    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
    } catch (error) {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      throw error;
    }

    return toPublicUser(user);
  }

  async function login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = readJSON(USERS_KEY, []);
    const user = users.find((item) => item.email === normalizedEmail);
    if (!user || (await hashPassword(password, user.salt)) !== user.passwordHash) {
      const error = new Error("이메일 또는 비밀번호를 확인해 주세요.");
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
    return toPublicUser(user);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getCurrentUser() {
    const session = readJSON(SESSION_KEY, null);
    if (!session || typeof session.userId !== "string") return null;
    const users = readJSON(USERS_KEY, []);
    const user = users.find((item) => item.id === session.userId);
    return user ? toPublicUser(user) : null;
  }

  window.FYAuth = Object.freeze({
    signup,
    login,
    logout,
    getCurrentUser,
  });
})();
