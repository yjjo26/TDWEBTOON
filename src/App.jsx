import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import NovelListPage from "./pages/NovelListPage";
import NovelDetailPage from "./pages/NovelDetailPage";
import PlotTab from "./pages/tabs/PlotTab";
import CharactersTab from "./pages/tabs/CharactersTab";
import SettingsTab from "./pages/tabs/SettingsTab";
import EpisodesTab from "./pages/tabs/EpisodesTab";
import LogTab from "./pages/tabs/LogTab";

// 테마는 다크 고정. 밀도/사이드바만 사용자 설정.
function applyHtmlAttrs() {
  const density = localStorage.getItem("td:density") || "standard";
  document.documentElement.setAttribute("data-theme", "dark");
  document.documentElement.setAttribute("data-density", density);
}

export default function App() {
  useEffect(() => {
    applyHtmlAttrs();
    const onStorage = (e) => {
      if (e.key && e.key.startsWith("td:")) applyHtmlAttrs();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("td:settings-changed", applyHtmlAttrs);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("td:settings-changed", applyHtmlAttrs);
    };
  }, []);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/novels" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/novels"
          element={
            <ProtectedRoute>
              <NovelListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/novels/:slug"
          element={
            <ProtectedRoute>
              <NovelDetailPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="plot" replace />} />
          <Route path="plot" element={<PlotTab />} />
          <Route path="characters" element={<CharactersTab />} />
          <Route path="settings" element={<SettingsTab />} />
          <Route path="episodes" element={<EpisodesTab />} />
          <Route path="log" element={<LogTab />} />
        </Route>
        <Route path="*" element={<Navigate to="/novels" replace />} />
      </Routes>
    </AuthProvider>
  );
}
