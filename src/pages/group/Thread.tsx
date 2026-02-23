import { Link, useParams } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function Thread() {
  const { groupId, channelId: channelIdParam, messageId: messageIdParam } =
    useParams();
  const channelId = channelIdParam as Id<"channels">;
  const messageId = messageIdParam as Id<"messages">;

  const parentMessage = useQuery(api.messages.getById, { messageId });
  const replies = useQuery(api.messages.listThread, {
    parentMessageId: messageId,
  });

  if (!parentMessage || replies === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-border bg-bg-secondary px-4 py-3">
        <Link
          to={`/g/${groupId}/channel/${channelId}`}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="font-display text-lg font-semibold">Thread</h2>
        <span className="text-text-tertiary text-sm">
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Parent message */}
        <div className="border-b border-border py-2">
          <MessageBubble message={parentMessage} />
        </div>

        {/* Replies */}
        {replies.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-text-tertiary text-sm">No replies yet</p>
          </div>
        ) : (
          <div className="flex flex-col py-2">
            {replies.map((reply) => (
              <MessageBubble key={reply._id} message={reply} />
            ))}
          </div>
        )}
      </div>

      <MessageComposer
        channelId={channelId}
        threadParentId={messageId}
        placeholder="Reply in thread..."
      />
    </div>
  );
}
