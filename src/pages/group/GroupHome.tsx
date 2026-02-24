import { useQuery } from "convex/react";
import { Link } from "react-router";
import { api } from "../../../convex/_generated/api";
import { useGroupContext } from "@/lib/UserContext";
import { getChannelIcon } from "@/lib/channelUtils";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export function GroupHome() {
  const { group } = useGroupContext();
  const presence = useQuery(api.presence.getByGroup, {
    groupId: group._id,
  });
  const channels = useQuery(api.channels.listByGroup, {
    groupId: group._id,
  });

  const onlineMembers = presence?.filter(
    (p) => p.status === "online" && Date.now() - p.lastSeenAt < 60_000
  );

  const activeChannels = channels?.filter((c) => !c.isArchived) ?? [];

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <h1 className="font-display text-3xl font-bold">{group.name}</h1>
          <p className="mt-1 text-text-secondary">
            {group.members.length} members
          </p>
        </div>

        {/* Online members */}
        {onlineMembers && onlineMembers.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent-hangout">
              Online Now
            </h3>
            <div className="flex justify-center gap-3">
              {onlineMembers.map((p) => {
                const member = group.members.find(
                  (m) => m.userId === p.userId
                );
                return (
                  <div key={p._id} className="flex flex-col items-center gap-1">
                    <Avatar
                      name={member?.user?.name ?? "?"}
                      url={member?.user?.avatarUrl}
                      size="md"
                      online
                    />
                    <span className="text-xs text-text-tertiary">
                      {member?.user?.name?.split(" ")[0] ?? "?"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick channel links */}
        {activeChannels.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Channels
            </h3>
            <div className="flex flex-col gap-1.5">
              {activeChannels.slice(0, 6).map((channel) => {
                const accentBg = {
                  hangout: "hover:bg-accent-hangout/10",
                  event: "hover:bg-accent-event/10",
                  bracket: "hover:bg-accent-bracket/10",
                }[channel.type];

                const href =
                  channel.type === "bracket"
                    ? `/g/${group._id}/bracket/${channel._id}`
                    : `/g/${group._id}/channel/${channel._id}`;

                return (
                  <Link
                    key={channel._id}
                    to={href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-left transition-colors",
                      accentBg
                    )}
                  >
                    <span>{getChannelIcon(channel.type)}</span>
                    <span className="text-sm font-medium">{channel.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
