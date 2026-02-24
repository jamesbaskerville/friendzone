import { Link } from "react-router";
import { timeAgo } from "@/lib/channelUtils";

interface Props {
  replyCount: number;
  lastReplyAt?: number;
  href: string;
}

export function ThreadPreview({ replyCount, lastReplyAt, href }: Props) {
  if (replyCount === 0) return null;

  return (
    <Link
      to={href}
      className="mt-1 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-accent-action transition-colors hover:bg-accent-action/10"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span>
        {replyCount} {replyCount === 1 ? "reply" : "replies"}
      </span>
      {lastReplyAt && (
        <span className="text-text-tertiary">{timeAgo(lastReplyAt)}</span>
      )}
    </Link>
  );
}
