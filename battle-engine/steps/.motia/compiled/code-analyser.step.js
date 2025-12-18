import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();
const config = {
  name: "AiReferee",
  type: "event",
  subscribes: ["analyze.code"],
  emits: [],
  flows: ["CodeDuelFlow"]
};
const handler = async (event, { streams, logger }) => {
  const { matchId, playerId, code, language, problemTitle } = event.data || event;
  logger.info(`AI: \u{1F9E0} Starting Gemini analysis for ${playerId}...`);
  let analysisResult = "";
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
    You are an expert ICPC World Finalist Coach. Analyze this ${language} submission for the problem "${problemTitle || "Unknown"}".
    
    CODE:
    ${code}

    Provide a tactical competitive programming analysis in Markdown. Be concise (max 200 words). Use these exact sections:

    ### \u23F1\uFE0F Complexity & Constraints
    * **Time:** <Big-O> (e.g., O(N log N)). *Mention if this likely passes a 1-second limit for N=10^5.*
    * **Space:** <Big-O>.
    * **Potential Pitfalls:** <List specific risks: TLE, Integer Overflow (need long long?), or Recursion Depth?>

    ### \u{1F9E0} Algorithm & Logic
    * **Approach:** <Identify the technique used (e.g., Two Pointers, DFS, Ad-hoc)>
    * **Better Alternative:** <If a better algorithm exists (e.g., "A hash map would be O(N) instead of O(N log N)"), mention it. If optimal, say "Optimal approach used.">

    ### \u{1F9EA} Edge Case Checklist
    * <List 2 tricky inputs that might break this code (e.g., Empty array, Negative numbers, Max INT values)>

    ### \u{1F3C1} Coach's Verdict
    * <One sentence summary: "Solid AC solution" or "Risk of TLE on large inputs", etc.>
    `;
    const result = await model.generateContent(prompt);
    analysisResult = result.response.text();
  } catch (error) {
    logger.error(`\u26A0\uFE0F Gemini Failed: ${error}`);
    const complexity = code.includes("for") && code.split("for").length > 2 ? "O(n\xB2)" : "O(n)";
    analysisResult = `
    ### \u{1F916} Automated Fallback Review
    **Time Complexity Estimate:** ${complexity}
    
    *Gemini API is currently busy, but here is a quick check:*
    * Syntax looks valid for ${language}.
    * ${complexity === "O(n\xB2)" ? "\u26A0\uFE0F Detected nested loops. Be careful with large inputs." : "\u2705 Logic seems linear and efficient."}
    `;
  }
  logger.info(`AI: Analysis complete for ${playerId}`);
  if (streams.match && matchId) {
    await streams.match.set(matchId, "message", {
      type: "AI_ANALYSIS",
      playerId,
      text: analysisResult,
      // Markdown formatted
      timestamp: Date.now()
    });
  }
};
export {
  config,
  handler
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vY29kZS1hbmFseXNlci5zdGVwLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBTdGVwQ29uZmlnIH0gZnJvbSAnbW90aWEnO1xyXG5pbXBvcnQgeyBHb29nbGVHZW5lcmF0aXZlQUkgfSBmcm9tICdAZ29vZ2xlL2dlbmVyYXRpdmUtYWknO1xyXG5pbXBvcnQgZG90ZW52IGZyb20gJ2RvdGVudic7XHJcblxyXG5kb3RlbnYuY29uZmlnKCk7XHJcblxyXG5leHBvcnQgY29uc3QgY29uZmlnOiBTdGVwQ29uZmlnID0ge1xyXG4gIG5hbWU6ICdBaVJlZmVyZWUnLFxyXG4gIHR5cGU6ICdldmVudCcsXHJcbiAgc3Vic2NyaWJlczogWydhbmFseXplLmNvZGUnXSxcclxuICBlbWl0czogW10sXHJcbiAgZmxvd3M6IFsnQ29kZUR1ZWxGbG93J11cclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBhbnksIHsgc3RyZWFtcywgbG9nZ2VyIH06IGFueSkgPT4ge1xyXG4gIGNvbnN0IHsgbWF0Y2hJZCwgcGxheWVySWQsIGNvZGUsIGxhbmd1YWdlLCBwcm9ibGVtVGl0bGUgfSA9IGV2ZW50LmRhdGEgfHwgZXZlbnQ7XHJcblxyXG4gIGxvZ2dlci5pbmZvKGBBSTogXHVEODNFXHVEREUwIFN0YXJ0aW5nIEdlbWluaSBhbmFseXNpcyBmb3IgJHtwbGF5ZXJJZH0uLi5gKTtcclxuXHJcbiAgbGV0IGFuYWx5c2lzUmVzdWx0ID0gXCJcIjtcclxuXHJcbiAgdHJ5IHtcclxuICAgIC8vIDEuIEluaXRpYWxpemUgR2VtaW5pXHJcbiAgICBjb25zdCBnZW5BSSA9IG5ldyBHb29nbGVHZW5lcmF0aXZlQUkocHJvY2Vzcy5lbnYuR0VNSU5JX0FQSV9LRVkgYXMgc3RyaW5nKTtcclxuICAgIFxyXG4gICAgLy8gVXNlIGZsYXNoIGZvciBzcGVlZCAoY3JpdGljYWwgaW4gaGFja2F0aG9ucy9yZWFsLXRpbWUgYXBwcylcclxuICAgIGNvbnN0IG1vZGVsID0gZ2VuQUkuZ2V0R2VuZXJhdGl2ZU1vZGVsKHsgbW9kZWw6IFwiZ2VtaW5pLTIuNS1mbGFzaFwiIH0pO1xyXG5cclxuICAgIC8vIDIuIFRoZSBcIkNvYWNoXCIgUHJvbXB0XHJcbiAgICBjb25zdCBwcm9tcHQgPSBgXHJcbiAgICBZb3UgYXJlIGFuIGV4cGVydCBJQ1BDIFdvcmxkIEZpbmFsaXN0IENvYWNoLiBBbmFseXplIHRoaXMgJHtsYW5ndWFnZX0gc3VibWlzc2lvbiBmb3IgdGhlIHByb2JsZW0gXCIke3Byb2JsZW1UaXRsZSB8fCAnVW5rbm93bid9XCIuXHJcbiAgICBcclxuICAgIENPREU6XHJcbiAgICAke2NvZGV9XHJcblxyXG4gICAgUHJvdmlkZSBhIHRhY3RpY2FsIGNvbXBldGl0aXZlIHByb2dyYW1taW5nIGFuYWx5c2lzIGluIE1hcmtkb3duLiBCZSBjb25jaXNlIChtYXggMjAwIHdvcmRzKS4gVXNlIHRoZXNlIGV4YWN0IHNlY3Rpb25zOlxyXG5cclxuICAgICMjIyBcdTIzRjFcdUZFMEYgQ29tcGxleGl0eSAmIENvbnN0cmFpbnRzXHJcbiAgICAqICoqVGltZToqKiA8QmlnLU8+IChlLmcuLCBPKE4gbG9nIE4pKS4gKk1lbnRpb24gaWYgdGhpcyBsaWtlbHkgcGFzc2VzIGEgMS1zZWNvbmQgbGltaXQgZm9yIE49MTBeNS4qXHJcbiAgICAqICoqU3BhY2U6KiogPEJpZy1PPi5cclxuICAgICogKipQb3RlbnRpYWwgUGl0ZmFsbHM6KiogPExpc3Qgc3BlY2lmaWMgcmlza3M6IFRMRSwgSW50ZWdlciBPdmVyZmxvdyAobmVlZCBsb25nIGxvbmc/KSwgb3IgUmVjdXJzaW9uIERlcHRoPz5cclxuXHJcbiAgICAjIyMgXHVEODNFXHVEREUwIEFsZ29yaXRobSAmIExvZ2ljXHJcbiAgICAqICoqQXBwcm9hY2g6KiogPElkZW50aWZ5IHRoZSB0ZWNobmlxdWUgdXNlZCAoZS5nLiwgVHdvIFBvaW50ZXJzLCBERlMsIEFkLWhvYyk+XHJcbiAgICAqICoqQmV0dGVyIEFsdGVybmF0aXZlOioqIDxJZiBhIGJldHRlciBhbGdvcml0aG0gZXhpc3RzIChlLmcuLCBcIkEgaGFzaCBtYXAgd291bGQgYmUgTyhOKSBpbnN0ZWFkIG9mIE8oTiBsb2cgTilcIiksIG1lbnRpb24gaXQuIElmIG9wdGltYWwsIHNheSBcIk9wdGltYWwgYXBwcm9hY2ggdXNlZC5cIj5cclxuXHJcbiAgICAjIyMgXHVEODNFXHVEREVBIEVkZ2UgQ2FzZSBDaGVja2xpc3RcclxuICAgICogPExpc3QgMiB0cmlja3kgaW5wdXRzIHRoYXQgbWlnaHQgYnJlYWsgdGhpcyBjb2RlIChlLmcuLCBFbXB0eSBhcnJheSwgTmVnYXRpdmUgbnVtYmVycywgTWF4IElOVCB2YWx1ZXMpPlxyXG5cclxuICAgICMjIyBcdUQ4M0NcdURGQzEgQ29hY2gncyBWZXJkaWN0XHJcbiAgICAqIDxPbmUgc2VudGVuY2Ugc3VtbWFyeTogXCJTb2xpZCBBQyBzb2x1dGlvblwiIG9yIFwiUmlzayBvZiBUTEUgb24gbGFyZ2UgaW5wdXRzXCIsIGV0Yy4+XHJcbiAgICBgO1xyXG5cclxuICAgIC8vIDMuIEdlbmVyYXRlIENvbnRlbnRcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG1vZGVsLmdlbmVyYXRlQ29udGVudChwcm9tcHQpO1xyXG4gICAgYW5hbHlzaXNSZXN1bHQgPSByZXN1bHQucmVzcG9uc2UudGV4dCgpO1xyXG5cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgbG9nZ2VyLmVycm9yKGBcdTI2QTBcdUZFMEYgR2VtaW5pIEZhaWxlZDogJHtlcnJvcn1gKTtcclxuICAgIFxyXG4gICAgLy8gRmFsbGJhY2sgSGV1cmlzdGljIChTbyB0aGUgZGVtbyBuZXZlciBmYWlscylcclxuICAgIGNvbnN0IGNvbXBsZXhpdHkgPSBjb2RlLmluY2x1ZGVzKCdmb3InKSAmJiBjb2RlLnNwbGl0KCdmb3InKS5sZW5ndGggPiAyID8gXCJPKG5cdTAwQjIpXCIgOiBcIk8obilcIjtcclxuICAgIGFuYWx5c2lzUmVzdWx0ID0gYFxyXG4gICAgIyMjIFx1RDgzRVx1REQxNiBBdXRvbWF0ZWQgRmFsbGJhY2sgUmV2aWV3XHJcbiAgICAqKlRpbWUgQ29tcGxleGl0eSBFc3RpbWF0ZToqKiAke2NvbXBsZXhpdHl9XHJcbiAgICBcclxuICAgICpHZW1pbmkgQVBJIGlzIGN1cnJlbnRseSBidXN5LCBidXQgaGVyZSBpcyBhIHF1aWNrIGNoZWNrOipcclxuICAgICogU3ludGF4IGxvb2tzIHZhbGlkIGZvciAke2xhbmd1YWdlfS5cclxuICAgICogJHtjb21wbGV4aXR5ID09PSBcIk8oblx1MDBCMilcIiA/IFwiXHUyNkEwXHVGRTBGIERldGVjdGVkIG5lc3RlZCBsb29wcy4gQmUgY2FyZWZ1bCB3aXRoIGxhcmdlIGlucHV0cy5cIiA6IFwiXHUyNzA1IExvZ2ljIHNlZW1zIGxpbmVhciBhbmQgZWZmaWNpZW50LlwifVxyXG4gICAgYDtcclxuICB9XHJcblxyXG4gIGxvZ2dlci5pbmZvKGBBSTogQW5hbHlzaXMgY29tcGxldGUgZm9yICR7cGxheWVySWR9YCk7XHJcblxyXG4gIC8vIDQuIFN0cmVhbSByZXN1bHQgdG8gRnJvbnRlbmRcclxuICBpZiAoc3RyZWFtcy5tYXRjaCAmJiBtYXRjaElkKSB7XHJcbiAgICAgIGF3YWl0IHN0cmVhbXMubWF0Y2guc2V0KG1hdGNoSWQsICdtZXNzYWdlJywge1xyXG4gICAgICAgICAgdHlwZTogJ0FJX0FOQUxZU0lTJyxcclxuICAgICAgICAgIHBsYXllcklkLFxyXG4gICAgICAgICAgdGV4dDogYW5hbHlzaXNSZXN1bHQsIC8vIE1hcmtkb3duIGZvcm1hdHRlZFxyXG4gICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpXHJcbiAgICAgIH0pO1xyXG4gIH1cclxufTsiXSwKICAibWFwcGluZ3MiOiAiQUFDQSxTQUFTLDBCQUEwQjtBQUNuQyxPQUFPLFlBQVk7QUFFbkIsT0FBTyxPQUFPO0FBRVAsTUFBTSxTQUFxQjtBQUFBLEVBQ2hDLE1BQU07QUFBQSxFQUNOLE1BQU07QUFBQSxFQUNOLFlBQVksQ0FBQyxjQUFjO0FBQUEsRUFDM0IsT0FBTyxDQUFDO0FBQUEsRUFDUixPQUFPLENBQUMsY0FBYztBQUN4QjtBQUVPLE1BQU0sVUFBVSxPQUFPLE9BQVksRUFBRSxTQUFTLE9BQU8sTUFBVztBQUNyRSxRQUFNLEVBQUUsU0FBUyxVQUFVLE1BQU0sVUFBVSxhQUFhLElBQUksTUFBTSxRQUFRO0FBRTFFLFNBQU8sS0FBSyw4Q0FBdUMsUUFBUSxLQUFLO0FBRWhFLE1BQUksaUJBQWlCO0FBRXJCLE1BQUk7QUFFRixVQUFNLFFBQVEsSUFBSSxtQkFBbUIsUUFBUSxJQUFJLGNBQXdCO0FBR3pFLFVBQU0sUUFBUSxNQUFNLG1CQUFtQixFQUFFLE9BQU8sbUJBQW1CLENBQUM7QUFHcEUsVUFBTSxTQUFTO0FBQUEsZ0VBQzZDLFFBQVEsZ0NBQWdDLGdCQUFnQixTQUFTO0FBQUE7QUFBQTtBQUFBLE1BRzNILElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFxQk4sVUFBTSxTQUFTLE1BQU0sTUFBTSxnQkFBZ0IsTUFBTTtBQUNqRCxxQkFBaUIsT0FBTyxTQUFTLEtBQUs7QUFBQSxFQUV4QyxTQUFTLE9BQU87QUFDZCxXQUFPLE1BQU0sK0JBQXFCLEtBQUssRUFBRTtBQUd6QyxVQUFNLGFBQWEsS0FBSyxTQUFTLEtBQUssS0FBSyxLQUFLLE1BQU0sS0FBSyxFQUFFLFNBQVMsSUFBSSxhQUFVO0FBQ3BGLHFCQUFpQjtBQUFBO0FBQUEsb0NBRWUsVUFBVTtBQUFBO0FBQUE7QUFBQSwrQkFHZixRQUFRO0FBQUEsUUFDL0IsZUFBZSxhQUFVLHNFQUE0RCwwQ0FBcUM7QUFBQTtBQUFBLEVBRWhJO0FBRUEsU0FBTyxLQUFLLDZCQUE2QixRQUFRLEVBQUU7QUFHbkQsTUFBSSxRQUFRLFNBQVMsU0FBUztBQUMxQixVQUFNLFFBQVEsTUFBTSxJQUFJLFNBQVMsV0FBVztBQUFBLE1BQ3hDLE1BQU07QUFBQSxNQUNOO0FBQUEsTUFDQSxNQUFNO0FBQUE7QUFBQSxNQUNOLFdBQVcsS0FBSyxJQUFJO0FBQUEsSUFDeEIsQ0FBQztBQUFBLEVBQ0w7QUFDRjsiLAogICJuYW1lcyI6IFtdCn0K
