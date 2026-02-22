import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, assertGroupMember } from "./lib/permissions";

export const getByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, args.groupId, user._id);

    return await ctx.db
      .query("hallOfFame")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .collect();
  },
});

export const getByGroupInternal = internalQuery({
  args: {
    groupId: v.id("groups"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("hallOfFame")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .take(args.limit);
  },
});
