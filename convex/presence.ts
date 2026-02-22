import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, assertGroupMember } from "./lib/permissions";

export const getByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, args.groupId, user._id);

    return await ctx.db
      .query("presence")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});

export const heartbeat = mutation({
  args: {
    groupId: v.id("groups"),
    channelId: v.optional(v.id("channels")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user_group", (q) =>
        q.eq("userId", user._id).eq("groupId", args.groupId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "online",
        channelId: args.channelId,
        lastSeenAt: now,
      });
    } else {
      await ctx.db.insert("presence", {
        userId: user._id,
        groupId: args.groupId,
        channelId: args.channelId,
        status: "online",
        lastSeenAt: now,
      });
    }

    // Also update lastActiveAt on groupMembers for watercooler logic
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id)
      )
      .first();

    if (membership) {
      await ctx.db.patch(membership._id, { lastActiveAt: now });
    }
  },
});
