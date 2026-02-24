import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/channelUtils";
import { Avatar } from "@/components/ui/Avatar";
import { ThreadPreview } from "./ThreadPreview";
import { ReactionBar } from "./ReactionBar";
import { ReactionPicker } from "./ReactionPicker";
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
  const [showPicker, setShowPicker] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const editMessage = useMutation(api.messages.edit);
  const removeMessage = useMutation(api.messages.remove);
  const addReaction = useMutation(api.reactions.add);

  async function handleEdit() {
    if (!editBody.trim()) return;
    await editMessage({ messageId: message._id, body: editBody.trim() });
    setEditing(false);
  }

  // Deleted messages
  if (message.isDeleted) {
    return (
      <div className={cn("px-4 py-1", isOwn ? "text-right" : "text-left")}>
        <p className="text-text-tertiary text-sm italic">
          Message deleted
        </p>
      </div>
    );
  }

  // System messages — always centered
  if (message.messageType === "system") {
    return (
      <div className="flex justify-center px-4 py-2">
        <p className="text-text-tertiary text-xs">{message.body}</p>
      </div>
    );
  }

  const isSenpai = message.messageType === "senpai";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative px-4 py-1 transition-colors",
        isSenpai && "border-l-2 border-accent-senpai bg-accent-senpai/5"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={cn(
          "flex gap-3 max-w-[85%]",
          isOwn && !isSenpai ? "ml-auto flex-row-reverse" : ""
        )}
      >
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

        <div
          className={cn(
            "min-w-0 flex-1 flex flex-col",
            isOwn && !isSenpai ? "items-end" : "items-start"
          )}
        >
          {!compact && (
            <div
              className={cn(
                "mb-0.5 flex items-baseline gap-2",
                isOwn && !isSenpai ? "flex-row-reverse" : ""
              )}
            >
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
            <div className="flex gap-2 w-full">
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
              {/* Bubble + side actions wrapper */}
              <div
                className={cn(
                  "relative flex items-center gap-1",
                  isOwn && !isSenpai ? "flex-row-reverse" : ""
                )}
              >
                {/* Message bubble with overlapping reactions */}
                <div className="relative mb-1">
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2",
                      isOwn && !isSenpai
                        ? "bg-accent-hangout/20 rounded-br-sm"
                        : "bg-bg-elevated rounded-bl-sm"
                    )}
                  >
                    {message.messageType === "game_score" ? (
                      <p className="font-mono text-sm whitespace-pre-wrap">
                        {message.body}
                      </p>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words text-text-primary">
                        {message.body}
                      </p>
                    )}
                  </div>

                  {/* Reaction pills overlapping the bubble bottom */}
                  <ReactionBar
                    messageId={message._id}
                    isOwn={isOwn && !isSenpai}
                  />
                </div>

                {/* Side hover actions (Messenger style) */}
                {showActions && !editing && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      ref={emojiButtonRef}
                      onClick={() => setShowPicker(!showPicker)}
                      className="rounded-full p-1 text-text-tertiary hover:bg-bg-surface hover:text-text-secondary"
                      title="React"
                    >
                      <span className="text-xs">{"\u263A\uFE0F"}</span>
                    </button>
                    {isOwn && (
                      <>
                        <button
                          onClick={() => {
                            setEditing(true);
                            setEditBody(message.body);
                          }}
                          className="rounded-full p-1 text-text-tertiary hover:bg-bg-surface hover:text-text-secondary"
                          title="Edit"
                        >
                          <span className="text-xs">{"\u270F\uFE0F"}</span>
                        </button>
                        <button
                          onClick={() =>
                            removeMessage({ messageId: message._id })
                          }
                          className="rounded-full p-1 text-text-tertiary hover:bg-bg-surface hover:text-accent-action"
                          title="Delete"
                        >
                          <span className="text-xs">{"\u{1F5D1}\uFE0F"}</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Emoji picker */}
                {showPicker && (
                  <ReactionPicker
                    onSelect={(emoji) => {
                      addReaction({ messageId: message._id, emoji });
                      setShowPicker(false);
                    }}
                    onClose={() => setShowPicker(false)}
                    anchorRef={emojiButtonRef}
                    isOwn={isOwn && !isSenpai}
                  />
                )}
              </div>

              {threadHref && message.threadReplyCount > 0 && (
                <ThreadPreview
                  replyCount={message.threadReplyCount}
                  lastReplyAt={message.threadLastReplyAt}
                  href={threadHref}
                />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
