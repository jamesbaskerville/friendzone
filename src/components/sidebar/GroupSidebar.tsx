import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { ChannelSidebarItem } from "./ChannelSidebarItem";
import { Modal } from "@/components/ui/Modal";

interface Props {
  groupId: Id<"groups">;
  groupName: string;
  onClose?: () => void;
}

type ChannelType = "hangout" | "event" | "bracket";

const SECTIONS: { type: ChannelType; label: string; accent: string }[] = [
  { type: "hangout", label: "Hangout", accent: "text-accent-hangout" },
  { type: "event", label: "Events", accent: "text-accent-event" },
  { type: "bracket", label: "Brackets", accent: "text-accent-bracket" },
];

export function GroupSidebar({ groupId, groupName, onClose }: Props) {
  const channels = useQuery(api.channels.listByGroup, { groupId });
  const createChannel = useMutation(api.channels.create);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ChannelType>("hangout");
  const [bracketQuestion, setBracketQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const activeChannels = channels?.filter((c) => !c.isArchived) ?? [];
  const archivedChannels = channels?.filter((c) => c.isArchived) ?? [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await createChannel({
        groupId,
        name: newName.trim(),
        type: newType,
        bracketQuestion:
          newType === "bracket" ? bracketQuestion.trim() || undefined : undefined,
      });
      setShowCreate(false);
      setNewName("");
      setBracketQuestion("");
    } finally {
      setLoading(false);
    }
  }

  const navLinks = [
    { to: `/g/${groupId}/hall-of-fame`, label: "Hall of Fame", icon: "\u{1F3C5}" },
    { to: `/g/${groupId}/media`, label: "Media", icon: "\u{1F4F7}" },
    { to: `/g/${groupId}/splits`, label: "Splits", icon: "\u{1F4B0}" },
    { to: `/g/${groupId}/settings`, label: "Settings", icon: "\u2699\uFE0F" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border p-4">
        <Link
          to={`/g/${groupId}`}
          className="font-display text-lg font-semibold truncate hover:text-accent-hangout transition-colors"
          onClick={onClose}
        >
          {groupName}
        </Link>
        <Link
          to="/"
          className="text-text-tertiary hover:text-text-primary text-xs transition-colors"
        >
          All groups
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {SECTIONS.map(({ type, label, accent }) => {
          const sectionChannels = activeChannels.filter(
            (c) => c.type === type
          );
          if (sectionChannels.length === 0 && type !== "hangout") return null;
          return (
            <div key={type} className="mb-4">
              <h3
                className={cn(
                  "mb-1 px-3 text-xs font-semibold uppercase tracking-wider",
                  accent
                )}
              >
                {label}
              </h3>
              <div className="flex flex-col gap-0.5">
                {sectionChannels.map((channel) => (
                  <div key={channel._id} onClick={onClose}>
                    <ChannelSidebarItem channel={channel} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {archivedChannels.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="mb-1 flex items-center gap-1 px-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary hover:text-text-secondary"
            >
              <span
                className={cn(
                  "transition-transform text-[10px]",
                  showArchived && "rotate-90"
                )}
              >
                {"\u25B6"}
              </span>
              Archived ({archivedChannels.length})
            </button>
            {showArchived && (
              <div className="flex flex-col gap-0.5">
                {archivedChannels.map((channel) => (
                  <div key={channel._id} onClick={onClose}>
                    <ChannelSidebarItem channel={channel} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setShowCreate(true)}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-tertiary transition-colors hover:bg-bg-surface hover:text-text-secondary"
        >
          <span className="text-lg leading-none">+</span>
          New Channel
        </button>
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex flex-col gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Channel"
      >
        <form onSubmit={handleCreate}>
          <div className="mb-4 flex gap-2">
            {(["hangout", "event", "bracket"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNewType(t)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  newType === t
                    ? t === "hangout"
                      ? "bg-accent-hangout/20 text-accent-hangout"
                      : t === "event"
                        ? "bg-accent-event/20 text-accent-event"
                        : "bg-accent-bracket/20 text-accent-bracket"
                    : "text-text-tertiary hover:text-text-secondary"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Channel name"
            autoFocus
            className="mb-3 w-full rounded-lg border border-border bg-bg-surface px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
          />
          {newType === "bracket" && (
            <input
              type="text"
              value={bracketQuestion}
              onChange={(e) => setBracketQuestion(e.target.value)}
              placeholder="Bracket question (e.g., Best pizza place?)"
              className="mb-3 w-full rounded-lg border border-border bg-bg-surface px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
            />
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newName.trim()}
              className="rounded-lg bg-accent-action px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-accent-action/80 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
