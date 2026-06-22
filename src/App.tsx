import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { HomePage } from "./pages/HomePage";
import { ActorPage } from "./pages/ActorPage";
import { useAttackStore } from "./store/useAttackStore";

export default function App() {
  const load = useAttackStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/actor/:groupId" element={<ActorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
