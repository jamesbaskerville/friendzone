import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function getUserByClerkId(
  ctx: QueryCtx | MutationCtx,
  clerkId: string
) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .first();

  if (!user) throw new Error("User not found");
  return user;
}

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return getUserByClerkId(ctx, identity.subject);
}

export async function assertGroupMember(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<"groups">,
  userId: Id<"users">
) {
  const membership = await ctx.db
    .query("groupMembers")
    .withIndex("by_group_user", (q) =>
      q.eq("groupId", groupId).eq("userId", userId)
    )
    .first();

  if (!membership) throw new Error("Not a member of this group");
  return membership;
}

export async function assertGroupAdmin(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<"groups">,
  userId: Id<"users">
) {
  const membership = await assertGroupMember(ctx, groupId, userId);
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new Error("Admin access required");
  }
  return membership;
}

export async function assertGroupOwner(
  ctx: QueryCtx | MutationCtx,
  groupId: Id<"groups">,
  userId: Id<"users">
) {
  const membership = await assertGroupMember(ctx, groupId, userId);
  if (membership.role !== "owner") {
    throw new Error("Owner access required");
  }
  return membership;
}
