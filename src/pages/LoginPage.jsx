import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    if (login(pw)) {
      navigate("/novels", { replace: true });
    } else {
      setError("비밀번호가 일치하지 않습니다.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800">소설 작업실</h1>
          <p className="text-sm text-slate-500 mt-1">
            계속하려면 비밀번호를 입력하세요.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-600">비밀번호</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="••••"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2.5 transition"
        >
          로그인
        </button>

        <p className="text-xs text-slate-400 text-center">
          (개발용 임시 비밀번호: <code>1234</code>)
        </p>
      </form>
    </div>
  );
}
