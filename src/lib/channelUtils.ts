export const CHANNEL_ACCENTS = {
  hangout: "accent-hangout",
  event: "accent-event",
  bracket: "accent-bracket",
} as const;

export const CHANNEL_ICONS = {
  hangout: "\u{1F4AC}",
  event: "\u{1F4C5}",
  bracket: "\u{1F3C6}",
} as const;

export type ChannelType = keyof typeof CHANNEL_ACCENTS;

export function getAccentClass(type: ChannelType) {
  return CHANNEL_ACCENTS[type];
}

export function getChannelIcon(type: ChannelType) {
  return CHANNEL_ICONS[type];
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
