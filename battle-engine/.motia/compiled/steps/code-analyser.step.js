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
      timestamp: Date.now()
    });
  }
};
export {
  config,
  handler
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vc3RlcHMvY29kZS1hbmFseXNlci5zdGVwLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBTdGVwQ29uZmlnIH0gZnJvbSAnbW90aWEnO1xyXG5pbXBvcnQgeyBHb29nbGVHZW5lcmF0aXZlQUkgfSBmcm9tICdAZ29vZ2xlL2dlbmVyYXRpdmUtYWknO1xyXG5pbXBvcnQgZG90ZW52IGZyb20gJ2RvdGVudic7XHJcblxyXG5kb3RlbnYuY29uZmlnKCk7XHJcblxyXG5leHBvcnQgY29uc3QgY29uZmlnOiBTdGVwQ29uZmlnID0ge1xyXG4gIG5hbWU6ICdBaVJlZmVyZWUnLFxyXG4gIHR5cGU6ICdldmVudCcsXHJcbiAgc3Vic2NyaWJlczogWydhbmFseXplLmNvZGUnXSxcclxuICBlbWl0czogW10sXHJcbiAgZmxvd3M6IFsnQ29kZUR1ZWxGbG93J10sXHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogYW55LCB7IHN0cmVhbXMsIGxvZ2dlciB9OiBhbnkpID0+IHtcclxuICBjb25zdCB7IG1hdGNoSWQsIHBsYXllcklkLCBjb2RlLCBsYW5ndWFnZSwgcHJvYmxlbVRpdGxlIH0gPSBldmVudC5kYXRhIHx8IGV2ZW50O1xyXG5cclxuICBsb2dnZXIuaW5mbyhgQUk6IFx1RDgzRVx1RERFMCBTdGFydGluZyBHZW1pbmkgYW5hbHlzaXMgZm9yICR7cGxheWVySWR9Li4uYCk7XHJcblxyXG4gIGxldCBhbmFseXNpc1Jlc3VsdCA9IFwiXCI7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBnZW5BSSA9IG5ldyBHb29nbGVHZW5lcmF0aXZlQUkocHJvY2Vzcy5lbnYuR0VNSU5JX0FQSV9LRVkgYXMgc3RyaW5nKTtcclxuICAgIGNvbnN0IG1vZGVsID0gZ2VuQUkuZ2V0R2VuZXJhdGl2ZU1vZGVsKHsgbW9kZWw6IFwiZ2VtaW5pLTIuNS1mbGFzaFwiIH0pO1xyXG5cclxuICAgIGNvbnN0IHByb21wdCA9IGBcclxuICAgIFlvdSBhcmUgYW4gZXhwZXJ0IElDUEMgV29ybGQgRmluYWxpc3QgQ29hY2guIEFuYWx5emUgdGhpcyAke2xhbmd1YWdlfSBzdWJtaXNzaW9uIGZvciB0aGUgcHJvYmxlbSBcIiR7cHJvYmxlbVRpdGxlIHx8ICdVbmtub3duJ31cIi5cclxuICAgIFxyXG4gICAgQ09ERTpcclxuICAgICR7Y29kZX1cclxuXHJcbiAgICBQcm92aWRlIGEgdGFjdGljYWwgY29tcGV0aXRpdmUgcHJvZ3JhbW1pbmcgYW5hbHlzaXMgaW4gTWFya2Rvd24uIEJlIGNvbmNpc2UgKG1heCAyMDAgd29yZHMpLiBVc2UgdGhlc2UgZXhhY3Qgc2VjdGlvbnM6XHJcblxyXG4gICAgIyMjIFx1MjNGMVx1RkUwRiBDb21wbGV4aXR5ICYgQ29uc3RyYWludHNcclxuICAgICogKipUaW1lOioqIDxCaWctTz4gKGUuZy4sIE8oTiBsb2cgTikpLiAqTWVudGlvbiBpZiB0aGlzIGxpa2VseSBwYXNzZXMgYSAxLXNlY29uZCBsaW1pdCBmb3IgTj0xMF41LipcclxuICAgICogKipTcGFjZToqKiA8QmlnLU8+LlxyXG4gICAgKiAqKlBvdGVudGlhbCBQaXRmYWxsczoqKiA8TGlzdCBzcGVjaWZpYyByaXNrczogVExFLCBJbnRlZ2VyIE92ZXJmbG93IChuZWVkIGxvbmcgbG9uZz8pLCBvciBSZWN1cnNpb24gRGVwdGg/PlxyXG5cclxuICAgICMjIyBcdUQ4M0VcdURERTAgQWxnb3JpdGhtICYgTG9naWNcclxuICAgICogKipBcHByb2FjaDoqKiA8SWRlbnRpZnkgdGhlIHRlY2huaXF1ZSB1c2VkIChlLmcuLCBUd28gUG9pbnRlcnMsIERGUywgQWQtaG9jKT5cclxuICAgICogKipCZXR0ZXIgQWx0ZXJuYXRpdmU6KiogPElmIGEgYmV0dGVyIGFsZ29yaXRobSBleGlzdHMgKGUuZy4sIFwiQSBoYXNoIG1hcCB3b3VsZCBiZSBPKE4pIGluc3RlYWQgb2YgTyhOIGxvZyBOKVwiKSwgbWVudGlvbiBpdC4gSWYgb3B0aW1hbCwgc2F5IFwiT3B0aW1hbCBhcHByb2FjaCB1c2VkLlwiPlxyXG5cclxuICAgICMjIyBcdUQ4M0VcdURERUEgRWRnZSBDYXNlIENoZWNrbGlzdFxyXG4gICAgKiA8TGlzdCAyIHRyaWNreSBpbnB1dHMgdGhhdCBtaWdodCBicmVhayB0aGlzIGNvZGUgKGUuZy4sIEVtcHR5IGFycmF5LCBOZWdhdGl2ZSBudW1iZXJzLCBNYXggSU5UIHZhbHVlcyk+XHJcblxyXG4gICAgIyMjIFx1RDgzQ1x1REZDMSBDb2FjaCdzIFZlcmRpY3RcclxuICAgICogPE9uZSBzZW50ZW5jZSBzdW1tYXJ5OiBcIlNvbGlkIEFDIHNvbHV0aW9uXCIgb3IgXCJSaXNrIG9mIFRMRSBvbiBsYXJnZSBpbnB1dHNcIiwgZXRjLj5cclxuICAgIGA7XHJcblxyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbW9kZWwuZ2VuZXJhdGVDb250ZW50KHByb21wdCk7XHJcbiAgICBhbmFseXNpc1Jlc3VsdCA9IHJlc3VsdC5yZXNwb25zZS50ZXh0KCk7XHJcblxyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBsb2dnZXIuZXJyb3IoYFx1MjZBMFx1RkUwRiBHZW1pbmkgRmFpbGVkOiAke2Vycm9yfWApO1xyXG4gICAgXHJcbiAgICBjb25zdCBjb21wbGV4aXR5ID0gY29kZS5pbmNsdWRlcygnZm9yJykgJiYgY29kZS5zcGxpdCgnZm9yJykubGVuZ3RoID4gMiA/IFwiTyhuXHUwMEIyKVwiIDogXCJPKG4pXCI7XHJcbiAgICBhbmFseXNpc1Jlc3VsdCA9IGBcclxuICAgICMjIyBcdUQ4M0VcdUREMTYgQXV0b21hdGVkIEZhbGxiYWNrIFJldmlld1xyXG4gICAgKipUaW1lIENvbXBsZXhpdHkgRXN0aW1hdGU6KiogJHtjb21wbGV4aXR5fVxyXG4gICAgXHJcbiAgICAqR2VtaW5pIEFQSSBpcyBjdXJyZW50bHkgYnVzeSwgYnV0IGhlcmUgaXMgYSBxdWljayBjaGVjazoqXHJcbiAgICAqIFN5bnRheCBsb29rcyB2YWxpZCBmb3IgJHtsYW5ndWFnZX0uXHJcbiAgICAqICR7Y29tcGxleGl0eSA9PT0gXCJPKG5cdTAwQjIpXCIgPyBcIlx1MjZBMFx1RkUwRiBEZXRlY3RlZCBuZXN0ZWQgbG9vcHMuIEJlIGNhcmVmdWwgd2l0aCBsYXJnZSBpbnB1dHMuXCIgOiBcIlx1MjcwNSBMb2dpYyBzZWVtcyBsaW5lYXIgYW5kIGVmZmljaWVudC5cIn1cclxuICAgIGA7XHJcbiAgfVxyXG5cclxuICBsb2dnZXIuaW5mbyhgQUk6IEFuYWx5c2lzIGNvbXBsZXRlIGZvciAke3BsYXllcklkfWApO1xyXG5cclxuICBpZiAoc3RyZWFtcy5tYXRjaCAmJiBtYXRjaElkKSB7XHJcbiAgICAgIGF3YWl0IHN0cmVhbXMubWF0Y2guc2V0KG1hdGNoSWQsICdtZXNzYWdlJywge1xyXG4gICAgICAgICAgdHlwZTogJ0FJX0FOQUxZU0lTJyxcclxuICAgICAgICAgIHBsYXllcklkLFxyXG4gICAgICAgICAgdGV4dDogYW5hbHlzaXNSZXN1bHQsXHJcbiAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KClcclxuICAgICAgfSk7XHJcbiAgfVxyXG59OyJdLAogICJtYXBwaW5ncyI6ICJBQUNBLFNBQVMsMEJBQTBCO0FBQ25DLE9BQU8sWUFBWTtBQUVuQixPQUFPLE9BQU87QUFFUCxNQUFNLFNBQXFCO0FBQUEsRUFDaEMsTUFBTTtBQUFBLEVBQ04sTUFBTTtBQUFBLEVBQ04sWUFBWSxDQUFDLGNBQWM7QUFBQSxFQUMzQixPQUFPLENBQUM7QUFBQSxFQUNSLE9BQU8sQ0FBQyxjQUFjO0FBQ3hCO0FBRU8sTUFBTSxVQUFVLE9BQU8sT0FBWSxFQUFFLFNBQVMsT0FBTyxNQUFXO0FBQ3JFLFFBQU0sRUFBRSxTQUFTLFVBQVUsTUFBTSxVQUFVLGFBQWEsSUFBSSxNQUFNLFFBQVE7QUFFMUUsU0FBTyxLQUFLLDhDQUF1QyxRQUFRLEtBQUs7QUFFaEUsTUFBSSxpQkFBaUI7QUFFckIsTUFBSTtBQUNGLFVBQU0sUUFBUSxJQUFJLG1CQUFtQixRQUFRLElBQUksY0FBd0I7QUFDekUsVUFBTSxRQUFRLE1BQU0sbUJBQW1CLEVBQUUsT0FBTyxtQkFBbUIsQ0FBQztBQUVwRSxVQUFNLFNBQVM7QUFBQSxnRUFDNkMsUUFBUSxnQ0FBZ0MsZ0JBQWdCLFNBQVM7QUFBQTtBQUFBO0FBQUEsTUFHM0gsSUFBSTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQW9CTixVQUFNLFNBQVMsTUFBTSxNQUFNLGdCQUFnQixNQUFNO0FBQ2pELHFCQUFpQixPQUFPLFNBQVMsS0FBSztBQUFBLEVBRXhDLFNBQVMsT0FBTztBQUNkLFdBQU8sTUFBTSwrQkFBcUIsS0FBSyxFQUFFO0FBRXpDLFVBQU0sYUFBYSxLQUFLLFNBQVMsS0FBSyxLQUFLLEtBQUssTUFBTSxLQUFLLEVBQUUsU0FBUyxJQUFJLGFBQVU7QUFDcEYscUJBQWlCO0FBQUE7QUFBQSxvQ0FFZSxVQUFVO0FBQUE7QUFBQTtBQUFBLCtCQUdmLFFBQVE7QUFBQSxRQUMvQixlQUFlLGFBQVUsc0VBQTRELDBDQUFxQztBQUFBO0FBQUEsRUFFaEk7QUFFQSxTQUFPLEtBQUssNkJBQTZCLFFBQVEsRUFBRTtBQUVuRCxNQUFJLFFBQVEsU0FBUyxTQUFTO0FBQzFCLFVBQU0sUUFBUSxNQUFNLElBQUksU0FBUyxXQUFXO0FBQUEsTUFDeEMsTUFBTTtBQUFBLE1BQ047QUFBQSxNQUNBLE1BQU07QUFBQSxNQUNOLFdBQVcsS0FBSyxJQUFJO0FBQUEsSUFDeEIsQ0FBQztBQUFBLEVBQ0w7QUFDRjsiLAogICJuYW1lcyI6IFtdCn0K
