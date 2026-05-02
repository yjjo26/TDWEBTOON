import { createContext, useContext, useEffect, useState } from "react";

// 임시 더미 인증 — 추후 Firebase Auth 로 교체 예정.
// 현재는 비밀번호 한 개로만 통과시키는 방식 (sessionStorage 에 로그인 상태 저장).

const AuthContext = createContext(null);

const PASSWORD = "1234"; // TODO: Firebase 도입 시 제거
const SESSION_KEY = "novel_app_auth_v1";

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, authed ? "1" : "0");
  }, [authed]);

  const login = (password) => {
    if (password === PASSWORD) {
      setAuthed(true);
      return true;
    }
    return false;
  };

  const logout = () => setAuthed(false);

  return (
    <AuthContext.Provider value={{ authed, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
