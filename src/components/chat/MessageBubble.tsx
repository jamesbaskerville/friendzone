import { useState } from "react";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/channelUtils";
import { Avatar } from "@/components/ui/Avatar";
import { ThreadPreview } from "./ThreadPreview";
import { ReactionBar } from "./ReactionBar";
import { useGroupContext } from "@/lib/UserContext";

interface Props {
  message: Doc<"messages">;
  compact?: boolean;
  threadHref?: string;
}

export function MessageBubble({ message, compact, threadHref }: Props) {
  const { currentUser, memberMap } = useGroupContext();
  const author = memberMap.get(message.authorId as string);
  const isOwn = message.authorId === currentUser._id;

  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(message.body);
  const [showActions, setShowActions] = useState(false);

  const editMessage = useMutation(api.messages.edit);
  const removeMessage = useMutation(api.messages.remove);

  async function handleEdit() {
    if (!editBody.trim()) return;
    await editMessage({ messageId: message._id, body: editBody.trim() });
    setEditing(false);
  }

  // Deleted messages
  if (message.isDeleted) {
    return (
      <div className="px-4 py-1">
        <p className="text-text-tertiary text-sm italic">
          Message deleted
        </p>
      </div>
    );
  }

  // System messages
  if (message.messageType === "system") {
    return (
      <div className="flex justify-center px-4 py-2">
        <p className="text-text-tertiary text-xs">{message.body}</p>
      </div>
    );
  }

  // Senpai messages
  const isSenpai = message.messageType === "senpai";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative px-4 py-1 transition-colors hover:bg-bg-surface/50",
        isSenpai && "border-l-2 border-accent-senpai bg-accent-senpai/5"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-3">
        {!compact ? (
          <div className="mt-0.5 shrink-0">
            <Avatar
              name={isSenpai ? "Senpai" : author?.name ?? "Unknown"}
              url={!isSenpai ? author?.avatarUrl : undefined}
              size="sm"
            />
          </div>
        ) : (
          <div className="w-7 shrink-0" />
        )}

        <div className="min-w-0 flex-1">
          {!compact && (
            <div className="mb-0.5 flex items-baseline gap-2">
              <span
                className={cn(
                  "text-sm font-semibold",
                  isSenpai ? "text-accent-senpai" : "text-text-primary"
                )}
              >
                {isSenpai ? "Senpai" : author?.name ?? "Unknown"}
              </span>
              <span className="text-text-tertiary text-xs">
                {timeAgo(message.createdAt)}
              </span>
              {message.editedAt && (
                <span className="text-text-tertiary text-xs">(edited)</span>
              )}
            </div>
          )}

          {editing ? (
            <div className="flex gap-2">
              <input
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEdit();
                  if (e.key === "Escape") setEditing(false);
                }}
                autoFocus
                className="flex-1 rounded border border-border bg-bg-surface px-2 py-1 text-sm text-text-primary focus:border-border-focus focus:outline-none"
              />
              <button
                onClick={handleEdit}
                className="text-xs text-accent-action hover:underline"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-text-tertiary hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {message.messageType === "game_score" ? (
                <div className="inline-block rounded-lg bg-bg-elevated px-3 py-2">
                  <p className="font-mono text-sm whitespace-pre-wrap">
                    {message.body}
                  </p>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap break-words text-text-primary">
                  {message.body}
                </p>
              )}

              {threadHref && message.threadReplyCount > 0 && (
                <ThreadPreview
                  replyCount={message.threadReplyCount}
                  lastReplyAt={message.threadLastReplyAt}
                  href={threadHref}
                />
              )}

              <ReactionBar messageId={message._id} />
            </>
          )}
        </div>

        {/* Action buttons */}
        {isOwn && showActions && !editing && (
          <div className="absolute right-3 top-1 flex items-center gap-1 rounded-md border border-border bg-bg-elevated px-1 py-0.5 shadow-lg">
            <button
              onClick={() => {
                setEditing(true);
                setEditBody(message.body);
              }}
              className="rounded p-1 text-xs text-text-secondary hover:bg-bg-surface hover:text-text-primary"
              title="Edit"
            >
              {"\u270F\uFE0F"}
            </button>
            <button
              onClick={() => removeMessage({ messageId: message._id })}
              className="rounded p-1 text-xs text-text-secondary hover:bg-bg-surface hover:text-accent-action"
              title="Delete"
            >
              {"\u{1F5D1}\uFE0F"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
