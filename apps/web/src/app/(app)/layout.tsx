import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DesktopTitleBar } from "@/components/desktop/title-bar";
import { DesktopBridge } from "@/components/desktop/desktop-bridge";
import { WebCompanionProvider } from "@/components/companion/web-companion-provider";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <WebCompanionProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <DesktopTitleBar />
        <DesktopBridge />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="cue-scroll flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </div>
    </WebCompanionProvider>
  );
}
