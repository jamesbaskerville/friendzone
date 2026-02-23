import { useState } from "react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { RsvpBar } from "./RsvpBar";
import { Checklist } from "./Checklist";

interface Props {
  channel: Doc<"channels">;
}

export function EventHeader({ channel }: Props) {
  const [showChecklist, setShowChecklist] = useState(false);

  const eventDate = channel.eventDate
    ? new Date(channel.eventDate)
    : null;
  const isUpcoming = eventDate && eventDate.getTime() > Date.now();
  const daysUntil = eventDate
    ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="border-b border-border bg-accent-event/5">
      <div className="px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {eventDate && (
              <div className="rounded-lg bg-accent-event/20 px-3 py-1.5 text-center">
                <div className="text-xs font-medium uppercase text-accent-event">
                  {eventDate.toLocaleDateString(undefined, { month: "short" })}
                </div>
                <div className="text-lg font-bold text-accent-event">
                  {eventDate.getDate()}
                </div>
              </div>
            )}
            <div>
              {channel.eventLocation && (
                <p className="text-sm text-text-secondary">
                  {"\u{1F4CD}"} {channel.eventLocation}
                </p>
              )}
              {isUpcoming && daysUntil !== null && daysUntil > 0 && (
                <p className="text-xs text-accent-event">
                  {daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowChecklist(!showChecklist)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
          >
            {showChecklist ? "Hide" : "Checklist"}
          </button>
        </div>

        <RsvpBar channelId={channel._id} />
      </div>

      {showChecklist && (
        <div className="border-t border-border px-4 py-3">
          <Checklist channelId={channel._id} />
        </div>
      )}
    </div>
  );
}
