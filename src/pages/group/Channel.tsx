import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { getChannelIcon } from "@/lib/channelUtils";
import { MessageFeed } from "@/components/chat/MessageFeed";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { EventHeader } from "@/components/events/EventHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function Channel() {
  const { channelId: channelIdParam } = useParams();
  const channelId = channelIdParam as Id<"channels">;

  const channel = useQuery(api.channels.getById, { channelId });

  if (!channel) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const accentText = {
    hangout: "text-accent-hangout",
    event: "text-accent-event",
    bracket: "text-accent-bracket",
  }[channel.type];

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-bg-secondary px-4 py-3">
        <span className={cn("text-lg", accentText)}>
          {getChannelIcon(channel.type)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display truncate text-lg font-semibold">
            {channel.name}
          </h2>
          {channel.type === "event" && channel.eventDate && (
            <p className="text-text-tertiary text-xs">
              {new Date(channel.eventDate).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
              {channel.eventLocation && ` \u00B7 ${channel.eventLocation}`}
            </p>
          )}
        </div>
      </header>

      {channel.type === "event" && <EventHeader channel={channel} />}

      <MessageFeed channelId={channelId} />
      <MessageComposer channelId={channelId} />
    </div>
  );
}
