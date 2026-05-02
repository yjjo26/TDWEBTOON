import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  const submit = (e) => {
    e?.preventDefault();
    if (!pw) {
      setErr("비밀번호를 입력해주세요");
      return;
    }
    if (login(pw)) {
      navigate("/novels", { replace: true });
    } else {
      setErr("비밀번호가 일치하지 않습니다");
    }
  };

  return (
    <div
      className="login-bg page-in"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 380,
          maxWidth: "100%",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-1)",
          borderRadius: "var(--r-2xl)",
          boxShadow: "var(--shadow-lg)",
          padding: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--r-xl)",
              background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              marginBottom: 16,
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <Icon name="feather" size={26} stroke={2} />
          </div>
          <h1
            className="serif"
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            소설 작업실
          </h1>
          <p
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--ink-3)",
              marginTop: 6,
              whiteSpace: "nowrap",
            }}
          >
            이야기를 함께 쌓는 공간
          </p>
        </div>

        <form onSubmit={submit}>
          <label
            style={{
              display: "block",
              fontSize: "var(--fs-sm)",
              fontWeight: 600,
              color: "var(--ink-2)",
              marginBottom: 8,
            }}
          >
            비밀번호
          </label>
          <div style={{ position: "relative" }}>
            <Icon
              name="lock"
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-4)",
                pointerEvents: "none",
              }}
            />
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setErr("");
              }}
              className="input"
              placeholder="••••••••"
              style={{ paddingLeft: 38, paddingRight: 44, height: 44 }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              title={show ? "숨기기" : "보이기"}
              data-tooltip={show ? "숨기기" : "보이기"}
              aria-label={show ? "숨기기" : "보이기"}
              className="icon-btn sm"
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              <Icon name={show ? "eyeOff" : "eye"} size={14} />
            </button>
          </div>
          {err && (
            <div
              style={{
                fontSize: "var(--fs-xs)",
                color: "var(--danger)",
                marginTop: 6,
              }}
            >
              {err}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              marginTop: 20,
              padding: "12px 16px",
              background: "var(--accent)",
              color: "white",
              fontSize: "var(--fs-base)",
              fontWeight: 700,
              borderRadius: "var(--r-md)",
              boxShadow: "var(--shadow-glow)",
              transition: "all var(--dur-fast) var(--ease-out)",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "var(--accent-hover)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "var(--accent)")
            }
          >
            들어가기
          </button>
        </form>

        <p
          style={{
            fontSize: "var(--fs-xs)",
            color: "var(--ink-4)",
            textAlign: "center",
            marginTop: 20,
          }}
        >
          공동 작업자는 공유받은 비밀번호로 입장하세요
        </p>
      </div>
    </div>
  );
}
