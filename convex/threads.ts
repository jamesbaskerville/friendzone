import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/permissions";

export const promoteToFork = mutation({
  args: {
    parentMessageId: v.id("messages"),
    channelName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const parentMessage = await ctx.db.get(args.parentMessageId);
    if (!parentMessage) throw new Error("Parent message not found");

    const parentChannel = await ctx.db.get(parentMessage.channelId);
    if (!parentChannel) throw new Error("Parent channel not found");

    const forkChannelId = await ctx.db.insert("channels", {
      groupId: parentChannel.groupId,
      name: args.channelName,
      type: "hangout",
      createdBy: user._id,
      createdAt: Date.now(),
      parentChannelId: parentChannel._id,
      parentMessageId: args.parentMessageId,
      forkDepth: parentChannel.forkDepth + 1,
      isArchived: false,
    });

    const threadReplies = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) =>
        q.eq("threadParentId", args.parentMessageId)
      )
      .collect();

    for (const reply of threadReplies) {
      await ctx.db.patch(reply._id, {
        channelId: forkChannelId,
        threadParentId: undefined,
      });
    }

    await ctx.db.patch(args.parentMessageId, {
      forkedToChannelId: forkChannelId,
      threadReplyCount: 0,
    });

    return forkChannelId;
  },
});
