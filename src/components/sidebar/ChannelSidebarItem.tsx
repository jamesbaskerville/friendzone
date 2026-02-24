import { Link, useParams } from "react-router";
import { cn } from "@/lib/utils";
import { getChannelIcon } from "@/lib/channelUtils";
import type { Doc } from "../../../convex/_generated/dataModel";

interface Props {
  channel: Doc<"channels">;
}

export function ChannelSidebarItem({ channel }: Props) {
  const { channelId, bracketId } = useParams();
  const isActive =
    channelId === channel._id || bracketId === channel._id;

  const href =
    channel.type === "bracket"
      ? `/g/${channel.groupId}/bracket/${channel._id}`
      : `/g/${channel.groupId}/channel/${channel._id}`;

  const accentColor = {
    hangout: "text-accent-hangout",
    event: "text-accent-event",
    bracket: "text-accent-bracket",
  }[channel.type];

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-bg-elevated text-text-primary"
          : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
      )}
    >
      <span className={cn("text-base", accentColor)}>
        {getChannelIcon(channel.type)}
      </span>
      <span className={cn("truncate", channel.isArchived && "line-through opacity-50")}>
        {channel.name}
      </span>
    </Link>
  );
}
