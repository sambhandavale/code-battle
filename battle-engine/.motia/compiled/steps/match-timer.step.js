import { connectDB } from "../src/db.js";
import { MatchModel } from "../src/models/Match.js";
const config = {
  name: "MatchTimer",
  type: "event",
  subscribes: ["match.started"],
  emits: [],
  flows: ["CodeDuelFlow"]
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const handler = async (event, { logger, streams }) => {
  const payload = event.data || event;
  const { matchId, duration } = payload;
  if (!matchId || !duration) {
    logger.error("TIMER: Missing matchId or duration", payload);
    return;
  }
  logger.info(`TIMER: Started for ${matchId}. Sleeping for ${duration / 1e3}s...`);
  await sleep(duration);
  await connectDB();
  logger.info(`TIMER: Woke up for ${matchId}. Checking status...`);
  const match = await MatchModel.findOneAndUpdate(
    { matchId, status: "RACING" },
    { $set: { status: "EXPIRED" } },
    { new: true }
  );
  if (match) {
    logger.info(`TIMER: Time limit exceeded for ${matchId}. Expiring...`);
    if (streams.match) {
      await streams.match.set(matchId, "message", {
        type: "GAME_OVER",
        winner: null,
        reason: "TIME_LIMIT"
      });
    }
  } else {
    logger.info(`TIMER: Match ${matchId} was already finished/expired. Doing nothing.`);
  }
};
export {
  config,
  handler
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3RlcHMvbWF0Y2gtdGltZXIuc3RlcC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgU3RlcENvbmZpZyB9IGZyb20gJ21vdGlhJztcclxuaW1wb3J0IHsgY29ubmVjdERCIH0gZnJvbSAnLi4vc3JjL2RiJztcclxuaW1wb3J0IHsgTWF0Y2hNb2RlbCB9IGZyb20gJy4uL3NyYy9tb2RlbHMvTWF0Y2gnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGNvbmZpZzogU3RlcENvbmZpZyA9IHtcclxuICBuYW1lOiAnTWF0Y2hUaW1lcicsXHJcbiAgdHlwZTogJ2V2ZW50JyxcclxuICBzdWJzY3JpYmVzOiBbJ21hdGNoLnN0YXJ0ZWQnXSxcclxuICBlbWl0czogW10sXHJcbiAgZmxvd3M6IFsnQ29kZUR1ZWxGbG93J11cclxufTtcclxuXHJcbmNvbnN0IHNsZWVwID0gKG1zOiBudW1iZXIpID0+IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XHJcblxyXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogYW55LCB7IGxvZ2dlciwgc3RyZWFtcyB9OiBhbnkpID0+IHtcclxuICBjb25zdCBwYXlsb2FkID0gZXZlbnQuZGF0YSB8fCBldmVudDtcclxuICBjb25zdCB7IG1hdGNoSWQsIGR1cmF0aW9uIH0gPSBwYXlsb2FkO1xyXG5cclxuICBpZiAoIW1hdGNoSWQgfHwgIWR1cmF0aW9uKSB7XHJcbiAgICAgIGxvZ2dlci5lcnJvcihcIlRJTUVSOiBNaXNzaW5nIG1hdGNoSWQgb3IgZHVyYXRpb25cIiwgcGF5bG9hZCk7XHJcbiAgICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGxvZ2dlci5pbmZvKGBUSU1FUjogU3RhcnRlZCBmb3IgJHttYXRjaElkfS4gU2xlZXBpbmcgZm9yICR7ZHVyYXRpb24gLyAxMDAwfXMuLi5gKTtcclxuXHJcbiAgYXdhaXQgc2xlZXAoZHVyYXRpb24pO1xyXG5cclxuICBhd2FpdCBjb25uZWN0REIoKTtcclxuICBsb2dnZXIuaW5mbyhgVElNRVI6IFdva2UgdXAgZm9yICR7bWF0Y2hJZH0uIENoZWNraW5nIHN0YXR1cy4uLmApO1xyXG5cclxuICBjb25zdCBtYXRjaCA9IGF3YWl0IE1hdGNoTW9kZWwuZmluZE9uZUFuZFVwZGF0ZShcclxuICAgICAgeyBtYXRjaElkLCBzdGF0dXM6ICdSQUNJTkcnIH0sXHJcbiAgICAgIHsgJHNldDogeyBzdGF0dXM6ICdFWFBJUkVEJyB9IH0sXHJcbiAgICAgIHsgbmV3OiB0cnVlIH1cclxuICApO1xyXG5cclxuICBpZiAobWF0Y2gpIHtcclxuICAgICAgbG9nZ2VyLmluZm8oYFRJTUVSOiBUaW1lIGxpbWl0IGV4Y2VlZGVkIGZvciAke21hdGNoSWR9LiBFeHBpcmluZy4uLmApO1xyXG5cclxuICAgICAgaWYgKHN0cmVhbXMubWF0Y2gpIHtcclxuICAgICAgICAgIGF3YWl0IHN0cmVhbXMubWF0Y2guc2V0KG1hdGNoSWQsICdtZXNzYWdlJywgeyBcclxuICAgICAgICAgICAgICB0eXBlOiAnR0FNRV9PVkVSJywgXHJcbiAgICAgICAgICAgICAgd2lubmVyOiBudWxsLFxyXG4gICAgICAgICAgICAgIHJlYXNvbjogJ1RJTUVfTElNSVQnXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICAgIGxvZ2dlci5pbmZvKGBUSU1FUjogTWF0Y2ggJHttYXRjaElkfSB3YXMgYWxyZWFkeSBmaW5pc2hlZC9leHBpcmVkLiBEb2luZyBub3RoaW5nLmApO1xyXG4gIH1cclxufTsiXSwKICAibWFwcGluZ3MiOiAiQUFDQSxTQUFTLGlCQUFpQjtBQUMxQixTQUFTLGtCQUFrQjtBQUVwQixNQUFNLFNBQXFCO0FBQUEsRUFDaEMsTUFBTTtBQUFBLEVBQ04sTUFBTTtBQUFBLEVBQ04sWUFBWSxDQUFDLGVBQWU7QUFBQSxFQUM1QixPQUFPLENBQUM7QUFBQSxFQUNSLE9BQU8sQ0FBQyxjQUFjO0FBQ3hCO0FBRUEsTUFBTSxRQUFRLENBQUMsT0FBZSxJQUFJLFFBQVEsQ0FBQyxZQUFZLFdBQVcsU0FBUyxFQUFFLENBQUM7QUFFdkUsTUFBTSxVQUFVLE9BQU8sT0FBWSxFQUFFLFFBQVEsUUFBUSxNQUFXO0FBQ3JFLFFBQU0sVUFBVSxNQUFNLFFBQVE7QUFDOUIsUUFBTSxFQUFFLFNBQVMsU0FBUyxJQUFJO0FBRTlCLE1BQUksQ0FBQyxXQUFXLENBQUMsVUFBVTtBQUN2QixXQUFPLE1BQU0sc0NBQXNDLE9BQU87QUFDMUQ7QUFBQSxFQUNKO0FBRUEsU0FBTyxLQUFLLHNCQUFzQixPQUFPLGtCQUFrQixXQUFXLEdBQUksTUFBTTtBQUVoRixRQUFNLE1BQU0sUUFBUTtBQUVwQixRQUFNLFVBQVU7QUFDaEIsU0FBTyxLQUFLLHNCQUFzQixPQUFPLHNCQUFzQjtBQUUvRCxRQUFNLFFBQVEsTUFBTSxXQUFXO0FBQUEsSUFDM0IsRUFBRSxTQUFTLFFBQVEsU0FBUztBQUFBLElBQzVCLEVBQUUsTUFBTSxFQUFFLFFBQVEsVUFBVSxFQUFFO0FBQUEsSUFDOUIsRUFBRSxLQUFLLEtBQUs7QUFBQSxFQUNoQjtBQUVBLE1BQUksT0FBTztBQUNQLFdBQU8sS0FBSyxrQ0FBa0MsT0FBTyxlQUFlO0FBRXBFLFFBQUksUUFBUSxPQUFPO0FBQ2YsWUFBTSxRQUFRLE1BQU0sSUFBSSxTQUFTLFdBQVc7QUFBQSxRQUN4QyxNQUFNO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixRQUFRO0FBQUEsTUFDWixDQUFDO0FBQUEsSUFDTDtBQUFBLEVBQ0osT0FBTztBQUNILFdBQU8sS0FBSyxnQkFBZ0IsT0FBTywrQ0FBK0M7QUFBQSxFQUN0RjtBQUNGOyIsCiAgIm5hbWVzIjogW10KfQo=
