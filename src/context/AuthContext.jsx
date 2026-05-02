import { createContext, useContext, useState } from "react";

// 다중 사용자 인증 (비밀번호 단일 매칭 → 사용자 식별)
// 추후 Cloudflare Access / 토큰 인증 등으로 교체 예정.

const AuthContext = createContext(null);

// 비밀번호 → 사용자 매핑
const USERS = {
  moody1111: { id: "moody", name: "무디", initials: "무", color: "#4F46E5" },
  cube1111: { id: "cube", name: "큐브", initials: "큐", color: "#059669" },
};

const SESSION_KEY = "td:user";

function loadUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const login = (password) => {
    const u = USERS[password];
    if (u) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
      setUser(u);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ authed: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
