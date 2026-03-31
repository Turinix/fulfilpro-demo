"use client";

/**
 * TopBar — 64px top navigation bar with hamburger (mobile), dynamic page title, and user info.
 * Derives the page title from the current pathname.
 * Props: onMenuClick — toggles the mobile sidebar.
 */

import { usePathname } from "next/navigation";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/orders": "Orders",
  "/production": "Production",
  "/inventory": "Inventory",
  "/warehouse": "Warehouse",
  "/returns": "Returns",
  "/intelligence": "Demand Intelligence",
  "/settings/integrations": "Settings — Integrations",
};

function getPageTitle(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith("/orders/")) return "Order Detail";
  if (pathname.startsWith("/warehouse/pick/")) return "Pick List";
  if (pathname.startsWith("/warehouse/pack/")) return "Pack Order";
  if (pathname.startsWith("/warehouse/dispatch")) return "Dispatch Queue";
  if (pathname.startsWith("/returns/")) return "Return Detail";
  return "FulfilPro";
}

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="fixed top-0 left-0 right-0 md:left-60 h-16 bg-white border-b border-gray-200 z-20 flex items-center px-4 gap-4">
      {/* Hamburger — mobile only */}
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Open navigation menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page Title */}
      <h1 className="flex-1 text-base font-semibold text-gray-900">{title}</h1>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          type="button"
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors relative"
          aria-label="Notifications"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Red dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            KM
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-700">Karan M.</span>
        </div>
      </div>
    </header>
  );
}
