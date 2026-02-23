import { createContext, useContext } from "react";
import type { Doc } from "../../convex/_generated/dataModel";

type MemberWithUser = Doc<"groupMembers"> & {
  user: Doc<"users"> | null;
};

interface GroupContextValue {
  currentUser: Doc<"users">;
  group: Doc<"groups"> & { members: MemberWithUser[] };
  memberMap: Map<string, Doc<"users">>;
}

export const GroupContext = createContext<GroupContextValue | null>(null);

export function useGroupContext() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroupContext must be used within GroupLayout");
  return ctx;
}

export function buildMemberMap(
  members: MemberWithUser[]
): Map<string, Doc<"users">> {
  const map = new Map<string, Doc<"users">>();
  for (const m of members) {
    if (m.user) {
      map.set(m.user._id as string, m.user);
    }
  }
  return map;
}
