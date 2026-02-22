import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, assertGroupMember } from "./lib/permissions";

export const getByChannel = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");

    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, channel.groupId, user._id);

    const splits = await ctx.db
      .query("splits")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();

    return await Promise.all(
      splits.map(async (split) => {
        const items = await ctx.db
          .query("splitItems")
          .withIndex("by_split", (q) => q.eq("splitId", split._id))
          .collect();
        return { ...split, items };
      })
    );
  },
});

export const getBalances = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await assertGroupMember(ctx, args.groupId, user._id);

    return await ctx.db
      .query("splitBalances")
      .withIndex("by_group_unpaid", (q) =>
        q.eq("groupId", args.groupId).eq("isPaid", false)
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    channelId: v.id("channels"),
    name: v.string(),
    totalAmount: v.number(),
    taxAmount: v.optional(v.number()),
    tipAmount: v.optional(v.number()),
    receiptStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");
    await assertGroupMember(ctx, channel.groupId, user._id);

    return await ctx.db.insert("splits", {
      channelId: args.channelId,
      groupId: channel.groupId,
      name: args.name,
      totalAmount: args.totalAmount,
      taxAmount: args.taxAmount,
      tipAmount: args.tipAmount,
      receiptStorageId: args.receiptStorageId,
      createdBy: user._id,
      createdAt: Date.now(),
      status: "claiming",
    });
  },
});

export const addItem = mutation({
  args: {
    splitId: v.id("splits"),
    name: v.string(),
    price: v.number(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const split = await ctx.db.get(args.splitId);
    if (!split) throw new Error("Split not found");
    await assertGroupMember(ctx, split.groupId, user._id);

    return await ctx.db.insert("splitItems", {
      splitId: args.splitId,
      name: args.name,
      price: args.price,
      quantity: args.quantity,
    });
  },
});

export const claimItem = mutation({
  args: { itemId: v.id("splitItems") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Split item not found");

    const split = await ctx.db.get(item.splitId);
    if (!split) throw new Error("Split not found");
    await assertGroupMember(ctx, split.groupId, user._id);

    const claimedBy = item.claimedBy ?? [];
    if (!claimedBy.includes(user._id)) {
      await ctx.db.patch(args.itemId, {
        claimedBy: [...claimedBy, user._id],
      });
    }
  },
});

export const calculateSettlement = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const channel = await ctx.db.get(args.channelId);
    if (!channel) throw new Error("Channel not found");
    await assertGroupMember(ctx, channel.groupId, user._id);

    const splits = await ctx.db
      .query("splits")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();

    // Build a ledger: who owes whom how much across ALL splits
    const balances: Record<string, Record<string, number>> = {};

    for (const split of splits) {
      const items = await ctx.db
        .query("splitItems")
        .withIndex("by_split", (q) => q.eq("splitId", split._id))
        .collect();

      const rsvps = await ctx.db
        .query("eventRsvps")
        .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
        .filter((q) => q.eq(q.field("status"), "going"))
        .collect();

      const goingUserIds = rsvps.map((r) => r.userId);
      const payer = split.createdBy;

      // Calculate each person's share
      const shares: Record<string, number> = {};
      let claimedTotal = 0;

      for (const item of items) {
        if (item.claimedBy && item.claimedBy.length > 0) {
          const perPerson = item.price / item.claimedBy.length;
          for (const userId of item.claimedBy) {
            shares[userId] = (shares[userId] ?? 0) + perPerson;
          }
          claimedTotal += item.price;
        }
      }

      // Unclaimed items split evenly among all going members
      const unclaimedTotal =
        split.totalAmount -
        (split.taxAmount ?? 0) -
        (split.tipAmount ?? 0) -
        claimedTotal;

      if (unclaimedTotal > 0 && goingUserIds.length > 0) {
        const perPerson = unclaimedTotal / goingUserIds.length;
        for (const userId of goingUserIds) {
          shares[userId] = (shares[userId] ?? 0) + perPerson;
        }
      }

      // Add proportional tax and tip
      const shareEntries = Object.entries(shares);
      const totalSubtotal = shareEntries.reduce(
        (sum, [, amt]) => sum + amt,
        0
      );

      if (totalSubtotal > 0) {
        for (const [userId, subtotal] of shareEntries) {
          const proportion = subtotal / totalSubtotal;
          const taxShare = Math.round((split.taxAmount ?? 0) * proportion);
          const tipShare = Math.round((split.tipAmount ?? 0) * proportion);
          shares[userId] = subtotal + taxShare + tipShare;
        }
      }

      // Record debts to payer
      for (const [userId, amount] of Object.entries(shares)) {
        if (userId === payer) continue;
        if (!balances[userId]) balances[userId] = {};
        balances[userId]![payer] = (balances[userId]![payer] ?? 0) + Math.round(amount);
      }
    }

    // Net out balances and write to splitBalances
    const processed = new Set<string>();
    for (const [fromId, debts] of Object.entries(balances)) {
      for (const [toId, amount] of Object.entries(debts)) {
        const pairKey = [fromId, toId].sort().join("-");
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const reverseAmount = balances[toId]?.[fromId] ?? 0;
        const netAmount = amount - reverseAmount;

        if (netAmount > 0) {
          await ctx.db.insert("splitBalances", {
            splitId: splits[0]!._id,
            groupId: channel.groupId,
            fromUserId: fromId as any,
            toUserId: toId as any,
            amount: netAmount,
            isPaid: false,
          });
        } else if (netAmount < 0) {
          await ctx.db.insert("splitBalances", {
            splitId: splits[0]!._id,
            groupId: channel.groupId,
            fromUserId: toId as any,
            toUserId: fromId as any,
            amount: Math.abs(netAmount),
            isPaid: false,
          });
        }
      }
    }

    // Mark all splits as calculated
    for (const split of splits) {
      await ctx.db.patch(split._id, { status: "calculated" });
    }
  },
});

export const markPaid = mutation({
  args: { balanceId: v.id("splitBalances") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const balance = await ctx.db.get(args.balanceId);
    if (!balance) throw new Error("Balance not found");
    await assertGroupMember(ctx, balance.groupId, user._id);

    await ctx.db.patch(args.balanceId, {
      isPaid: true,
      paidAt: Date.now(),
    });
  },
});
