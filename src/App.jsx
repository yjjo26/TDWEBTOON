import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import NovelListPage from "./pages/NovelListPage";
import NovelDetailPage from "./pages/NovelDetailPage";
import SynopsisTab from "./pages/tabs/SynopsisTab";
import CharactersTab from "./pages/tabs/CharactersTab";
import BackgroundsTab from "./pages/tabs/BackgroundsTab";
import EpisodesTab from "./pages/tabs/EpisodesTab";
import LogsTab from "./pages/tabs/LogsTab";

export default function App() {
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
          path="/novels/:novelId"
          element={
            <ProtectedRoute>
              <NovelDetailPage />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="synopsis" replace />} />
          <Route path="synopsis" element={<SynopsisTab />} />
          <Route path="characters" element={<CharactersTab />} />
          <Route path="backgrounds" element={<BackgroundsTab />} />
          <Route path="episodes" element={<EpisodesTab />} />
          <Route path="logs" element={<LogsTab />} />
        </Route>
        <Route path="*" element={<Navigate to="/novels" replace />} />
      </Routes>
    </AuthProvider>
  );
}
