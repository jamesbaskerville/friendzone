import { useEffect, useState, useMemo, useCallback } from "react";
import { Outlet, useParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { GroupContext, buildMemberMap } from "@/lib/UserContext";
import { GroupSidebar } from "@/components/sidebar/GroupSidebar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function GroupLayout() {
  const { groupId: groupIdParam } = useParams();
  const groupId = groupIdParam as Id<"groups">;

  const group = useQuery(api.groups.getById, { groupId });
  const currentUser = useQuery(api.users.me);
  const heartbeat = useMutation(api.presence.heartbeat);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Presence heartbeat
  useEffect(() => {
    if (!groupId) return;
    heartbeat({ groupId }).catch(() => {});
    const interval = setInterval(() => {
      heartbeat({ groupId }).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [groupId, heartbeat]);

  const memberMap = useMemo(
    () => (group ? buildMemberMap(group.members) : new Map()),
    [group]
  );

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (!group || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <GroupContext.Provider value={{ currentUser, group, memberMap }}>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="bg-bg-secondary hidden w-64 shrink-0 border-r border-border md:flex md:flex-col">
          <GroupSidebar
            groupId={groupId}
            groupName={group.name}
          />
        </aside>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeSidebar}
              />
              <motion.aside
                className="bg-bg-secondary fixed inset-y-0 left-0 z-50 flex w-72 flex-col md:hidden"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <GroupSidebar
                  groupId={groupId}
                  groupName={group.name}
                  onClose={closeSidebar}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-text-secondary hover:text-text-primary"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="font-display truncate text-lg font-semibold">
              {group.name}
            </h1>
          </div>

          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </GroupContext.Provider>
  );
}
