import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "archive-past-events",
  { hourUTC: 6, minuteUTC: 0 },
  internal.events.archivePastEvents
);

export default crons;
