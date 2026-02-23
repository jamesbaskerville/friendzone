import { useEffect, useRef } from "react";
import { usePaginatedQuery } from "convex/react";
import { useParams } from "react-router";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { MessageBubble } from "./MessageBubble";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Props {
  channelId: Id<"channels">;
}

export function MessageFeed({ channelId }: Props) {
  const { groupId } = useParams();
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.listByChannel,
    { channelId },
    { initialNumItems: 30 }
  );

  const bottomRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  // Messages come in desc order, reverse for display
  const messages = [...results].reverse();

  // Auto-scroll to bottom on initial load & new messages
  useEffect(() => {
    if (messages.length > 0 && status !== "LoadingFirstPage") {
      if (!didInitialScroll.current) {
        bottomRef.current?.scrollIntoView();
        didInitialScroll.current = true;
      } else {
        // Only auto-scroll if user is near the bottom
        const container = bottomRef.current?.parentElement;
        if (container) {
          const isNearBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 150;
          if (isNearBottom) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    }
  }, [messages.length, status]);

  // Reset initial scroll flag when channel changes
  useEffect(() => {
    didInitialScroll.current = false;
  }, [channelId]);

  // Infinite scroll: load older messages when sentinel is visible
  useEffect(() => {
    if (status !== "CanLoadMore") return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore(20);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [status, loadMore]);

  if (status === "LoadingFirstPage") {
    return <LoadingSpinner className="flex-1" />;
  }

  // Group consecutive messages from same author within 5 min
  function isCompact(idx: number) {
    if (idx === 0) return false;
    const prev = messages[idx - 1];
    const curr = messages[idx];
    if (!prev || !curr) return false;
    if (prev.authorId !== curr.authorId) return false;
    if (prev.messageType === "system" || curr.messageType === "system")
      return false;
    return curr.createdAt - prev.createdAt < 5 * 60 * 1000;
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Load more sentinel */}
      <div ref={sentinelRef} className="shrink-0 py-2">
        {status === "LoadingMore" && <LoadingSpinner />}
        {status === "Exhausted" && messages.length > 0 && (
          <p className="text-center text-xs text-text-tertiary py-4">
            Beginning of conversation
          </p>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-text-tertiary text-sm">
            No messages yet. Say something!
          </p>
        </div>
      ) : (
        <div className="flex flex-col py-2">
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              compact={isCompact(i)}
              threadHref={
                msg.threadReplyCount > 0
                  ? `/g/${groupId}/channel/${channelId}/thread/${msg._id}`
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
