import { connectDB } from "../src/db.js";
import { MatchModel } from "../src/models/Match.js";
const config = {
  name: "MatchExpiryJob",
  type: "cron",
  cron: "*/1 * * * *",
  flows: ["CodeDuelFlow"],
  emits: []
};
const handler = async ({ logger, streams }) => {
  logger.info("CRON HEARTBEAT: Checking for expired matches...");
  await connectDB();
  const now = Date.now();
  const expiredMatches = await MatchModel.find({
    status: "RACING",
    endTime: { $lt: now }
  });
  if (expiredMatches.length > 0) {
    logger.info(`Found ${expiredMatches.length} matches to expire.`);
  } else {
    logger.info("No expired matches found.");
  }
  for (const match of expiredMatches) {
    match.status = "EXPIRED";
    match.winnerId = null;
    await match.save();
    logger.info(`Expiring Match: ${match.matchId}`);
    if (streams.match) {
      await streams.match.set(match.matchId, "message", {
        type: "GAME_OVER",
        winner: null,
        reason: "DRAW_TIME_LIMIT"
      });
    }
  }
};
export {
  config,
  handler
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbWF0Y2gtZXhwaXJ5LmNyb24uc3RlcC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQ3JvbkNvbmZpZyB9IGZyb20gJ21vdGlhJztcclxuaW1wb3J0IHsgY29ubmVjdERCIH0gZnJvbSAnLi4vc3JjL2RiJztcclxuaW1wb3J0IHsgTWF0Y2hNb2RlbCB9IGZyb20gJy4uL3NyYy9tb2RlbHMvTWF0Y2gnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGNvbmZpZzogQ3JvbkNvbmZpZyA9IHtcclxuICBuYW1lOiAnTWF0Y2hFeHBpcnlKb2InLFxyXG4gIHR5cGU6ICdjcm9uJyxcclxuICBjcm9uOiAnKi8xICogKiAqIConLFxyXG4gIGZsb3dzOiBbJ0NvZGVEdWVsRmxvdyddLFxyXG4gIGVtaXRzOiBbXVxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoeyBsb2dnZXIsIHN0cmVhbXMgfTogYW55KSA9PiB7XHJcbiAgbG9nZ2VyLmluZm8oXCJDUk9OIEhFQVJUQkVBVDogQ2hlY2tpbmcgZm9yIGV4cGlyZWQgbWF0Y2hlcy4uLlwiKTtcclxuXHJcbiAgYXdhaXQgY29ubmVjdERCKCk7XHJcbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcclxuXHJcbiAgY29uc3QgZXhwaXJlZE1hdGNoZXMgPSBhd2FpdCBNYXRjaE1vZGVsLmZpbmQoe1xyXG4gICAgICBzdGF0dXM6ICdSQUNJTkcnLFxyXG4gICAgICBlbmRUaW1lOiB7ICRsdDogbm93IH0gXHJcbiAgfSk7XHJcblxyXG4gIGlmIChleHBpcmVkTWF0Y2hlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIGxvZ2dlci5pbmZvKGBGb3VuZCAke2V4cGlyZWRNYXRjaGVzLmxlbmd0aH0gbWF0Y2hlcyB0byBleHBpcmUuYCk7XHJcbiAgfSBlbHNlIHtcclxuICAgICAgbG9nZ2VyLmluZm8oXCJObyBleHBpcmVkIG1hdGNoZXMgZm91bmQuXCIpO1xyXG4gIH1cclxuXHJcbiAgZm9yIChjb25zdCBtYXRjaCBvZiBleHBpcmVkTWF0Y2hlcykge1xyXG4gICAgICBtYXRjaC5zdGF0dXMgPSAnRVhQSVJFRCc7IFxyXG4gICAgICBtYXRjaC53aW5uZXJJZCA9IG51bGw7IFxyXG4gICAgICBhd2FpdCBtYXRjaC5zYXZlKCk7XHJcbiAgICAgIFxyXG4gICAgICBsb2dnZXIuaW5mbyhgRXhwaXJpbmcgTWF0Y2g6ICR7bWF0Y2gubWF0Y2hJZH1gKTtcclxuICAgICAgXHJcbiAgICAgIGlmIChzdHJlYW1zLm1hdGNoKSB7XHJcbiAgICAgICAgICBhd2FpdCBzdHJlYW1zLm1hdGNoLnNldChtYXRjaC5tYXRjaElkLCAnbWVzc2FnZScsIHsgXHJcbiAgICAgICAgICAgICAgdHlwZTogJ0dBTUVfT1ZFUicsIFxyXG4gICAgICAgICAgICAgIHdpbm5lcjogbnVsbCxcclxuICAgICAgICAgICAgICByZWFzb246ICdEUkFXX1RJTUVfTElNSVQnXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gIH1cclxufTsiXSwKICAibWFwcGluZ3MiOiAiQUFDQSxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLGtCQUFrQjtBQUVwQixNQUFNLFNBQXFCO0FBQUEsRUFDaEMsTUFBTTtBQUFBLEVBQ04sTUFBTTtBQUFBLEVBQ04sTUFBTTtBQUFBLEVBQ04sT0FBTyxDQUFDLGNBQWM7QUFBQSxFQUN0QixPQUFPLENBQUM7QUFDVjtBQUVPLE1BQU0sVUFBVSxPQUFPLEVBQUUsUUFBUSxRQUFRLE1BQVc7QUFDekQsU0FBTyxLQUFLLGlEQUFpRDtBQUU3RCxRQUFNLFVBQVU7QUFDaEIsUUFBTSxNQUFNLEtBQUssSUFBSTtBQUVyQixRQUFNLGlCQUFpQixNQUFNLFdBQVcsS0FBSztBQUFBLElBQ3pDLFFBQVE7QUFBQSxJQUNSLFNBQVMsRUFBRSxLQUFLLElBQUk7QUFBQSxFQUN4QixDQUFDO0FBRUQsTUFBSSxlQUFlLFNBQVMsR0FBRztBQUMzQixXQUFPLEtBQUssU0FBUyxlQUFlLE1BQU0scUJBQXFCO0FBQUEsRUFDbkUsT0FBTztBQUNILFdBQU8sS0FBSywyQkFBMkI7QUFBQSxFQUMzQztBQUVBLGFBQVcsU0FBUyxnQkFBZ0I7QUFDaEMsVUFBTSxTQUFTO0FBQ2YsVUFBTSxXQUFXO0FBQ2pCLFVBQU0sTUFBTSxLQUFLO0FBRWpCLFdBQU8sS0FBSyxtQkFBbUIsTUFBTSxPQUFPLEVBQUU7QUFFOUMsUUFBSSxRQUFRLE9BQU87QUFDZixZQUFNLFFBQVEsTUFBTSxJQUFJLE1BQU0sU0FBUyxXQUFXO0FBQUEsUUFDOUMsTUFBTTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsUUFBUTtBQUFBLE1BQ1osQ0FBQztBQUFBLElBQ0w7QUFBQSxFQUNKO0FBQ0Y7IiwKICAibmFtZXMiOiBbXQp9Cg==
