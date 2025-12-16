import { StepConfig } from 'motia';
import { connectDB } from '../src/db';
import { MatchModel } from '../src/models/Match';
import { RunnerRequest, RunnerResult } from '../src/types';
import Question from '../src/models/Question';

export const config: StepConfig = {
  name: 'CodeRunner',
  type: 'event',
  subscribes: ['run.code'],
  emits: ['code.processed'],
  flows: ['CodeDuelFlow']
};

enum Verdict {
  ACCEPTED = "Accepted",
  WRONG_ANSWER = "Wrong Answer",
  COMPILE_ERROR = "Compilation Error",
  RUNTIME_ERROR = "Runtime Error",
}

export const handler = async (event: any, { emit, logger }: any) => {
  await connectDB(); // Must connect since we query DB now

  const data = (event.data || event) as RunnerRequest & { language?: string, version?: string };
  const { matchId, playerId, code, action, language = "python", version = "3.10.0" } = data;

  let success = true;
  let errorMsg = undefined;

  try {
    // 1. Find the Problem ID from the Match
    const match = await MatchModel.findOne({ matchId });
    if (!match) throw new Error("Match not found");

    // 2. Fetch the Question and Test Cases
    const question = await Question.findById(match.problemId);
    if (!question) throw new Error("Question not found");

    logger.info(`⚖️ JUDGE: Evaluator started for ${playerId} on '${question.title}' (${question.test_cases.length} cases)`);

    // 3. Run Test Cases
    for (let i = 0; i < question.test_cases.length; i++) {
        const testCase = question.test_cases[i];
        
        // Helper function to call Piston
        const result = await runPiston(code, language, version, testCase);

        if (result.status !== Verdict.ACCEPTED) {
            success = false;
            errorMsg = `Test Case ${i + 1} Failed: ${result.status}`;
            if (result.output) errorMsg += ` (Output: ${result.output})`;
            if (result.stderr) errorMsg += ` (Error: ${result.stderr})`;
            
            logger.warn(`❌ ${playerId}: ${errorMsg}`);
            break; 
        }
    }

  } catch (err: any) {
    success = false;
    errorMsg = `System Error: ${err.message}`;
    logger.error(errorMsg);
  }

  logger.info(`⚖️ VERDICT for ${playerId}: ${success ? "PASSED ALL" : "FAILED"}`);

  // 4. Report Result
  const resultData: RunnerResult = {
    matchId,
    playerId,
    action: action as 'RUN_TESTS' | 'SUBMIT_SOLUTION',
    success,
    error: errorMsg
  };

  await emit({ topic: 'code.processed', data: resultData });
};

// --- Piston Helper ---
async function runPiston(code: string, language: string, version: string, testCase: any) {
    const payload = {
        language,
        version,
        files: [{ name: 'main', content: code }],
        stdin: testCase.input,
        run_timeout: 3000,
        compile_timeout: 10000,
    };

    try {
        const response = await fetch("https://emkc.org/api/v2/piston/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data: any = await response.json();

        if (data.compile && data.compile.code !== 0) return { status: Verdict.COMPILE_ERROR, stderr: data.compile.stderr };
        if (data.run && data.run.code !== 0) return { status: Verdict.RUNTIME_ERROR, stderr: data.run.stderr };

        const actual = (data.run.stdout || "").trim();
        const expected = testCase.output.map((o: string) => o.trim());
        
        // Check if output matches ANY of the valid outputs
        const isCorrect = expected.includes(actual);
        
        return { 
            status: isCorrect ? Verdict.ACCEPTED : Verdict.WRONG_ANSWER, 
            output: actual 
        };

    } catch (e) {
        return { status: Verdict.RUNTIME_ERROR, stderr: "API Fail" };
    }
}