import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

type Page = "dashboard" | "history" | "settings";

interface MainLayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function MainLayout({ children, currentPage, onNavigate }: MainLayoutProps) {
  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="flex-1 overflow-y-auto">
        <div className="drag-region h-10 shrink-0" />
        <div className="px-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
