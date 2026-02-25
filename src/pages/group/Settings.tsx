import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { useGroupContext } from "@/lib/UserContext";
import { Avatar } from "@/components/ui/Avatar";
import type { Id } from "../../../convex/_generated/dataModel";
import { useNavigate } from "react-router";

export function Settings() {
  const { group, currentUser } = useGroupContext();
  const navigate = useNavigate();
  const updateSenpai = useMutation(api.groups.updateSenpaiSettings);
  const updateRole = useMutation(api.groups.updateMemberRole);
  const removeMember = useMutation(api.groups.removeMember);
  const leaveGroup = useMutation(api.groups.leaveGroup);
  const transferOwnership = useMutation(api.groups.transferOwnership);

  const currentMember = group.members.find(
    (m) => m.userId === currentUser._id
  );
  const isOwner = currentMember?.role === "owner";
  const isAdmin =
    currentMember?.role === "admin" || currentMember?.role === "owner";

  const [senpaiEnabled, setSenpaiEnabled] = useState(
    group.senpaiEnabled ?? true
  );
  const [senpaiFrequency, setSenpaiFrequency] = useState<
    "quiet" | "normal" | "chatty"
  >(group.senpaiFrequency ?? "normal");
  const [senpaiPersonality, setSenpaiPersonality] = useState(
    group.senpaiPersonality ?? ""
  );
  const [saved, setSaved] = useState(false);

  async function handleSaveSenpai() {
    await updateSenpai({
      groupId: group._id,
      senpaiEnabled,
      senpaiFrequency,
      senpaiPersonality: senpaiPersonality || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const [copied, setCopied] = useState(false);
  function copyInvite() {
    if (group.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "remove" | "leave" | "transfer";
    targetId?: Id<"users">;
    targetName?: string;
  } | null>(null);

  async function handleRoleChange(
    targetUserId: Id<"users">,
    newRole: "admin" | "member"
  ) {
    await updateRole({ groupId: group._id, targetUserId, newRole });
    setMenuOpenFor(null);
  }

  async function handleRemove(targetUserId: Id<"users">) {
    await removeMember({ groupId: group._id, targetUserId });
    setConfirmAction(null);
    setMenuOpenFor(null);
  }

  async function handleLeave() {
    await leaveGroup({ groupId: group._id });
    setConfirmAction(null);
    navigate("/");
  }

  async function handleTransfer(newOwnerId: Id<"users">) {
    await transferOwnership({ groupId: group._id, newOwnerId });
    setConfirmAction(null);
    setMenuOpenFor(null);
  }

  // Sort members: owner first, then admins, then members
  const sortedMembers = [...group.members].sort((a, b) => {
    const order = { owner: 0, admin: 1, member: 2 };
    return (order[a.role] ?? 3) - (order[b.role] ?? 3);
  });

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border bg-bg-secondary px-4 py-3">
        <h2 className="font-display text-lg font-semibold">
          {"\u2699\uFE0F"} Settings
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-md space-y-8">
          {/* Group Info */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Group
            </h3>
            <div className="rounded-xl border border-border bg-bg-surface p-4">
              <p className="font-display text-lg font-semibold">
                {group.name}
              </p>
              <p className="mt-1 text-sm text-text-tertiary">
                {group.members.length} members
              </p>
            </div>
          </section>

          {/* Invite Code */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Invite Code
            </h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-border bg-bg-surface px-4 py-3 font-mono text-sm">
                {group.inviteCode}
              </code>
              <button
                onClick={copyInvite}
                className="rounded-lg border border-border px-4 py-3 text-sm text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </section>

          {/* Members */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Members
            </h3>
            <div className="flex flex-col gap-2">
              {sortedMembers.map((member) => {
                const isSelf = member.userId === currentUser._id;
                const canManage =
                  isOwner && !isSelf && member.role !== "owner";
                const canRemove =
                  !isSelf &&
                  ((isOwner && member.role !== "owner") ||
                    (isAdmin &&
                      !isOwner &&
                      member.role === "member"));

                return (
                  <div
                    key={member._id}
                    className="relative flex items-center gap-3 rounded-lg border border-border bg-bg-surface px-4 py-3"
                  >
                    <Avatar
                      name={member.user?.name ?? "Unknown"}
                      url={member.user?.avatarUrl}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.user?.name ?? "Unknown"}
                        {isSelf && (
                          <span className="ml-1 text-text-tertiary">
                            (you)
                          </span>
                        )}
                      </p>
                      {member.user?.username && (
                        <p className="text-xs text-text-tertiary">
                          @{member.user.username}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        member.role === "owner"
                          ? "bg-trophy-gold/20 text-trophy-gold"
                          : member.role === "admin"
                            ? "bg-accent-bracket/20 text-accent-bracket"
                            : "bg-bg-elevated text-text-tertiary"
                      )}
                    >
                      {member.role}
                    </span>

                    {/* Actions menu button */}
                    {(canManage || canRemove) && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setMenuOpenFor(
                              menuOpenFor === member._id
                                ? null
                                : member._id
                            )
                          }
                          className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-bg-elevated hover:text-text-secondary"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                          </svg>
                        </button>

                        {menuOpenFor === member._id && (
                          <>
                            {/* Backdrop to close menu */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuOpenFor(null)}
                            />
                            <div className="absolute right-0 top-8 z-20 w-48 rounded-lg border border-border bg-bg-surface py-1 shadow-lg">
                              {/* Role change options (owner only) */}
                              {canManage && member.role === "member" && (
                                <button
                                  onClick={() =>
                                    handleRoleChange(
                                      member.userId,
                                      "admin"
                                    )
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-elevated"
                                >
                                  <span className="text-accent-bracket">
                                    +
                                  </span>
                                  Make Admin
                                </button>
                              )}
                              {canManage && member.role === "admin" && (
                                <button
                                  onClick={() =>
                                    handleRoleChange(
                                      member.userId,
                                      "member"
                                    )
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-elevated"
                                >
                                  <span className="text-text-tertiary">
                                    -
                                  </span>
                                  Remove Admin
                                </button>
                              )}
                              {/* Transfer ownership (owner only) */}
                              {isOwner && !isSelf && (
                                <button
                                  onClick={() =>
                                    setConfirmAction({
                                      type: "transfer",
                                      targetId: member.userId,
                                      targetName:
                                        member.user?.name ?? "this user",
                                    })
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-trophy-gold hover:bg-bg-elevated"
                                >
                                  <span>&#x1F451;</span>
                                  Transfer Ownership
                                </button>
                              )}
                              {/* Remove member */}
                              {canRemove && (
                                <>
                                  <div className="my-1 border-t border-border" />
                                  <button
                                    onClick={() =>
                                      setConfirmAction({
                                        type: "remove",
                                        targetId: member.userId,
                                        targetName:
                                          member.user?.name ??
                                          "this user",
                                      })
                                    }
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-status-error hover:bg-bg-elevated"
                                  >
                                    Remove from Group
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Leave group button (non-owners only) */}
            {!isOwner && (
              <button
                onClick={() => setConfirmAction({ type: "leave" })}
                className="mt-4 w-full rounded-lg border border-status-error/30 px-4 py-2.5 text-sm font-medium text-status-error transition-colors hover:bg-status-error/10"
              >
                Leave Group
              </button>
            )}
          </section>

          {/* Senpai Settings */}
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent-senpai">
              Senpai AI
            </h3>
            <div className="space-y-4 rounded-xl border border-accent-senpai/20 bg-accent-senpai/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enabled</span>
                <button
                  onClick={() => setSenpaiEnabled(!senpaiEnabled)}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    senpaiEnabled ? "bg-accent-senpai" : "bg-bg-elevated"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                      senpaiEnabled ? "left-[22px]" : "left-0.5"
                    )}
                  />
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Frequency
                </label>
                <div className="flex gap-2">
                  {(["quiet", "normal", "chatty"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setSenpaiFrequency(f)}
                      className={cn(
                        "flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors",
                        senpaiFrequency === f
                          ? "bg-accent-senpai/20 text-accent-senpai"
                          : "bg-bg-surface text-text-tertiary hover:text-text-secondary"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Personality
                </label>
                <input
                  type="text"
                  value={senpaiPersonality}
                  onChange={(e) => setSenpaiPersonality(e.target.value)}
                  placeholder="e.g., Sarcastic, encouraging, Gen Z..."
                  className="w-full rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-focus focus:outline-none"
                />
              </div>

              <button
                onClick={handleSaveSenpai}
                className="w-full rounded-lg bg-accent-senpai px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-senpai/80"
              >
                {saved ? "Saved!" : "Save Senpai Settings"}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-semibold">
              {confirmAction.type === "remove"
                ? "Remove Member"
                : confirmAction.type === "leave"
                  ? "Leave Group"
                  : "Transfer Ownership"}
            </h3>
            <p className="mt-2 text-sm text-text-secondary">
              {confirmAction.type === "remove"
                ? `Are you sure you want to remove ${confirmAction.targetName} from this group?`
                : confirmAction.type === "leave"
                  ? "Are you sure you want to leave this group? You will need a new invite to rejoin."
                  : `Are you sure you want to transfer ownership to ${confirmAction.targetName}? You will become an admin.`}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setConfirmAction(null);
                  setMenuOpenFor(null);
                }}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-elevated"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === "remove" && confirmAction.targetId) {
                    handleRemove(confirmAction.targetId);
                  } else if (confirmAction.type === "leave") {
                    handleLeave();
                  } else if (
                    confirmAction.type === "transfer" &&
                    confirmAction.targetId
                  ) {
                    handleTransfer(confirmAction.targetId);
                  }
                }}
                className={cn(
                  "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors",
                  confirmAction.type === "transfer"
                    ? "bg-trophy-gold hover:bg-trophy-gold/80"
                    : "bg-status-error hover:bg-status-error/80"
                )}
              >
                {confirmAction.type === "remove"
                  ? "Remove"
                  : confirmAction.type === "leave"
                    ? "Leave"
                    : "Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
