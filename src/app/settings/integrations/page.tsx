/**
 * Integrations page — server component.
 * Shows 4 integration cards (Shopify, Amazon, Courier, AI Engine) in a 2x2 grid
 * and a system architecture diagram built with HTML/CSS divs.
 * Interactive "Configure" button on Shopify uses a client island; others are disabled or link to /intelligence.
 */

import Link from "next/link";
import ShopifyConfigureButton from "@/components/integrations/ShopifyConfigureButton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntegrationCard {
  id: string;
  title: string;
  description: string;
  iconLabel: string;
  accentColor: string;
  iconBg: string;
  iconText: string;
  badgeLabel: string;
  badgeCls: string;
  action: "shopify" | "disabled" | "intelligence";
}

// ---------------------------------------------------------------------------
// Static card data
// ---------------------------------------------------------------------------

const CARDS: IntegrationCard[] = [
  {
    id: "shopify",
    title: "Shopify",
    description: "Sync orders, inventory, and products in real-time via webhooks",
    iconLabel: "S",
    accentColor: "border-l-green-500",
    iconBg: "bg-green-100",
    iconText: "text-green-700",
    badgeLabel: "Ready to Connect",
    badgeCls: "bg-yellow-100 text-yellow-800",
    action: "shopify",
  },
  {
    id: "amazon",
    title: "Amazon Seller Central",
    description: "Import orders from Amazon marketplace",
    iconLabel: "A",
    accentColor: "border-l-orange-500",
    iconBg: "bg-orange-100",
    iconText: "text-orange-700",
    badgeLabel: "Phase 2",
    badgeCls: "bg-gray-100 text-gray-600",
    action: "disabled",
  },
  {
    id: "courier",
    title: "Courier Partners",
    description: "Delhivery, Shiprocket, BlueDart — automated label generation and tracking",
    iconLabel: "C",
    accentColor: "border-l-blue-500",
    iconBg: "bg-blue-100",
    iconText: "text-blue-700",
    badgeLabel: "Phase 2",
    badgeCls: "bg-gray-100 text-gray-600",
    action: "disabled",
  },
  {
    id: "ai",
    title: "Demand Intelligence Engine",
    description: "ML-powered demand forecasting and restock recommendations",
    iconLabel: "AI",
    accentColor: "border-l-purple-500",
    iconBg: "bg-purple-100",
    iconText: "text-purple-700",
    badgeLabel: "Connected",
    badgeCls: "bg-green-100 text-green-800",
    action: "intelligence",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect your sales channels, courier partners, and data sources
        </p>
      </div>

      {/* 2x2 Integration cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CARDS.map((card) => (
          <div
            key={card.id}
            className={`bg-white rounded-lg shadow-sm border border-gray-100 border-l-4 ${card.accentColor} p-6 flex flex-col gap-4`}
          >
            {/* Top row: icon + badge */}
            <div className="flex items-center justify-between">
              <div
                className={`w-11 h-11 rounded-full ${card.iconBg} ${card.iconText} flex items-center justify-center font-bold text-sm select-none`}
              >
                {card.iconLabel}
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${card.badgeCls}`}
              >
                {card.badgeLabel}
              </span>
            </div>

            {/* Title + description */}
            <div>
              <h2 className="text-base font-semibold text-gray-900">{card.title}</h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{card.description}</p>
            </div>

            {/* Action button */}
            <div className="mt-auto">
              {card.action === "shopify" && <ShopifyConfigureButton />}

              {card.action === "disabled" && (
                <button
                  disabled
                  className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-md cursor-not-allowed"
                >
                  Configure
                </button>
              )}

              {card.action === "intelligence" && (
                <Link
                  href="/intelligence"
                  className="inline-block px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                >
                  View Dashboard
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* System Architecture Diagram */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-2">System Architecture</h2>
        <p className="text-xs text-gray-400 mb-6">
          How FulfilPro connects sales channels, fulfilment engine, couriers, and AI forecasting
        </p>

        <ArchitectureDiagram />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Architecture diagram — pure HTML/CSS with Tailwind
// ---------------------------------------------------------------------------

function ArchitectureDiagram() {
  const channelSources = ["Shopify", "Amazon", "Website", "Instagram"];
  const couriers = ["Delhivery", "Shiprocket", "BlueDart"];

  return (
    <div className="flex flex-col items-center gap-6 overflow-x-auto">
      {/* Main row: Sources → Engine → Couriers */}
      <div className="flex items-center gap-0 min-w-max">
        {/* Sales channels box */}
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50 w-40">
          <p className="text-xs font-semibold text-gray-600 mb-3 text-center uppercase tracking-wide">
            Sales Channels
          </p>
          <div className="space-y-2">
            {channelSources.map((src) => (
              <div
                key={src}
                className="text-xs text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 text-center"
              >
                {src}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow + label: webhook */}
        <div className="flex flex-col items-center mx-2">
          <span className="text-xs text-gray-400 mb-1">webhook</span>
          <div className="flex items-center">
            <div className="w-10 border-t-2 border-dashed border-gray-400" />
            <span className="text-gray-500 text-base">→</span>
          </div>
        </div>

        {/* FulfilPro engine box */}
        <div className="border-2 border-blue-400 rounded-lg p-4 bg-blue-50 w-44">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">FulfilPro</p>
          </div>
          <p className="text-xs text-blue-700 text-center">Engine</p>
          <div className="mt-3 space-y-1">
            {["Order Routing", "Inventory Mgmt", "Warehouse Ops"].map((f) => (
              <div
                key={f}
                className="text-xs text-blue-800 bg-blue-100 rounded px-2 py-0.5 text-center"
              >
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow + label: API */}
        <div className="flex flex-col items-center mx-2">
          <span className="text-xs text-gray-400 mb-1">API</span>
          <div className="flex items-center">
            <div className="w-10 border-t-2 border-dashed border-gray-400" />
            <span className="text-gray-500 text-base">→</span>
          </div>
        </div>

        {/* Couriers box */}
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50 w-40">
          <p className="text-xs font-semibold text-gray-600 mb-3 text-center uppercase tracking-wide">
            Couriers
          </p>
          <div className="space-y-2">
            {couriers.map((c) => (
              <div
                key={c}
                className="text-xs text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 text-center"
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Downward arrow from engine to AI */}
      <div className="flex flex-col items-center" style={{ marginLeft: "160px" }}>
        <div className="w-0.5 h-6 bg-gray-400" />
        <span className="text-gray-500 text-base leading-none">↓</span>
      </div>

      {/* AI / ML box */}
      <div
        className="border-2 border-purple-400 rounded-lg p-4 bg-purple-50 w-44 text-center"
        style={{ marginLeft: "160px" }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <p className="text-xs font-bold text-purple-800 uppercase tracking-wide">AI / ML</p>
        </div>
        <p className="text-xs text-purple-700">Demand Forecast</p>
        <p className="text-xs text-purple-600 mt-1">Restock Recommendations</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-400 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-6 border-t-2 border-dashed border-gray-400 inline-block" />
          Real-time data flow
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-400" />
          Core engine
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-purple-400" />
          AI layer
        </span>
      </div>
    </div>
  );
}
