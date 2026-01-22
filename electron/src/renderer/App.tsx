import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MainLayout } from "./components/layout/MainLayout";
import { Dashboard } from "./components/dashboard/Dashboard";
import { HistoryView } from "./components/history/HistoryView";
import { SettingsPage } from "./components/settings/SettingsPage";
import { useDictation } from "./hooks/useDictation";

type Page = "dashboard" | "history" | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  useDictation(); // Initialize real-time listeners

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "1") setPage("dashboard");
      if (e.ctrlKey && e.key === "2") setPage("history");
      if (e.ctrlKey && e.key === "3") setPage("settings");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <MainLayout currentPage={page} onNavigate={setPage}>
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="h-full"
        >
          {page === "dashboard" && <Dashboard />}
          {page === "history" && <HistoryView />}
          {page === "settings" && <SettingsPage />}
        </motion.div>
      </AnimatePresence>
    </MainLayout>
  );
}
