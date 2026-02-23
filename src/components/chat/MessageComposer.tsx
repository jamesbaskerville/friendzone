import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface Props {
  channelId: Id<"channels">;
  threadParentId?: Id<"messages">;
  placeholder?: string;
}

export function MessageComposer({ channelId, threadParentId, placeholder }: Props) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const send = useMutation(api.messages.send);

  async function handleSubmit() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await send({ channelId, body: text, threadParentId });
      setBody("");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-border bg-bg-secondary p-3">
      <div className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Type a message..."}
          rows={1}
          className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
          style={{
            height: "auto",
            overflow: body.includes("\n") ? "auto" : "hidden",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = Math.min(target.scrollHeight, 128) + "px";
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!body.trim() || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-action text-text-primary transition-colors hover:bg-accent-action/80 disabled:opacity-40"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
