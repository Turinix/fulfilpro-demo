"use client";

/**
 * AppShell — client-side shell that manages sidebar open/close state.
 * Wraps Sidebar + TopBar so layout.tsx can remain a server component.
 * Children are rendered in the main content area with correct offsets.
 */

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuClick={() => setSidebarOpen(true)} />
      <main className="min-h-screen bg-gray-50 md:pl-60 pt-16">
        <div className="p-6">{children}</div>
      </main>
    </>
  );
}
