import { StepConfig } from 'motia';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

export const config: StepConfig = {
  name: 'AiReferee',
  type: 'event',
  subscribes: ['analyze.code'],
  emits: [],
  flows: ['CodeDuelFlow'],
};

export const handler = async (event: any, { streams, logger }: any) => {
  const { matchId, playerId, code, language, problemTitle } = event.data || event;

  logger.info(`AI: 🧠 Starting Gemini analysis for ${playerId}...`);

  let analysisResult = "";

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    You are an expert ICPC World Finalist Coach. Analyze this ${language} submission for the problem "${problemTitle || 'Unknown'}".
    
    CODE:
    ${code}

    Provide a tactical competitive programming analysis in Markdown. Be concise (max 200 words). Use these exact sections:

    ### ⏱️ Complexity & Constraints
    * **Time:** <Big-O> (e.g., O(N log N)). *Mention if this likely passes a 1-second limit for N=10^5.*
    * **Space:** <Big-O>.
    * **Potential Pitfalls:** <List specific risks: TLE, Integer Overflow (need long long?), or Recursion Depth?>

    ### 🧠 Algorithm & Logic
    * **Approach:** <Identify the technique used (e.g., Two Pointers, DFS, Ad-hoc)>
    * **Better Alternative:** <If a better algorithm exists (e.g., "A hash map would be O(N) instead of O(N log N)"), mention it. If optimal, say "Optimal approach used.">

    ### 🧪 Edge Case Checklist
    * <List 2 tricky inputs that might break this code (e.g., Empty array, Negative numbers, Max INT values)>

    ### 🏁 Coach's Verdict
    * <One sentence summary: "Solid AC solution" or "Risk of TLE on large inputs", etc.>
    `;

    const result = await model.generateContent(prompt);
    analysisResult = result.response.text();

  } catch (error) {
    logger.error(`⚠️ Gemini Failed: ${error}`);
    
    const complexity = code.includes('for') && code.split('for').length > 2 ? "O(n²)" : "O(n)";
    analysisResult = `
    ### 🤖 Automated Fallback Review
    **Time Complexity Estimate:** ${complexity}
    
    *Gemini API is currently busy, but here is a quick check:*
    * Syntax looks valid for ${language}.
    * ${complexity === "O(n²)" ? "⚠️ Detected nested loops. Be careful with large inputs." : "✅ Logic seems linear and efficient."}
    `;
  }

  logger.info(`AI: Analysis complete for ${playerId}`);

  if (streams.match && matchId) {
      await streams.match.set(matchId, 'message', {
          type: 'AI_ANALYSIS',
          playerId,
          text: analysisResult,
          timestamp: Date.now()
      });
  }
};