/**
 * ChannelIcon — small colored circle indicating the sales channel.
 * Renders a colored badge with an emoji and letter for each channel.
 * Props: channel — one of "shopify", "amazon", "website", "instagram"
 */

const CHANNEL_CONFIG: Record<string, { bg: string; label: string; emoji: string }> = {
  shopify: { bg: "bg-green-500", label: "S", emoji: "🛍️" },
  amazon: { bg: "bg-orange-500", label: "A", emoji: "📦" },
  website: { bg: "bg-blue-500", label: "W", emoji: "🌐" },
  instagram: { bg: "bg-pink-500", label: "I", emoji: "📷" },
};

interface ChannelIconProps {
  channel: string;
}

export default function ChannelIcon({ channel }: ChannelIconProps) {
  const config = CHANNEL_CONFIG[channel] ?? { bg: "bg-gray-400", label: "?", emoji: "?" };

  return (
    <span
      title={channel.charAt(0).toUpperCase() + channel.slice(1)}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold ${config.bg}`}
    >
      {config.label}
    </span>
  );
}
