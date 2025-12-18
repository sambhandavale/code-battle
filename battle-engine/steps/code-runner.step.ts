import { StepConfig } from 'motia';
import { connectDB } from '../src/db';
import { MatchModel } from '../src/models/Match';
import { RunnerRequest, RunnerResult } from '../src/types';
import Question from '../src/models/Question';
import { languages } from '../src/utils/lang';

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const handler = async (event: any, { emit, logger }: any) => {
  await connectDB();

  const data = (event.data || event) as RunnerRequest & { language?: string, version?: string };
  const { matchId, playerId, code, action, language = "python", version = "3.10.0" } = data;

  let overallSuccess = true;
  let errorMsg = undefined;
  
  const testResults: any[] = [];

  try {
    const match = await MatchModel.findOne({ matchId });
    if (!match) throw new Error("Match not found");

    const question = await Question.findById(match.problemId);
    if (!question) throw new Error("Question not found");

    let casesToRun = question.test_cases;
    
    if (action === 'RUN_TESTS') {
        const limit = Math.ceil(casesToRun.length * 0.25) || 1; 
        casesToRun = casesToRun.slice(0, limit);
        logger.info(`JUDGE: Running subset (${limit}/${question.test_cases.length}) for ${playerId}`);
    } else {
        logger.info(`JUDGE: Running ALL (${casesToRun.length}) for ${playerId} submission`);
    }

    for (let i = 0; i < casesToRun.length; i++) {
        const testCase = casesToRun[i];
        
        // Pass logger to runPiston so we can see logs in the Workbench
        const result = await runPiston(code, language, version, testCase, logger);

        const caseResult = {
            id: i + 1,
            input: testCase.input,
            expected: testCase.output,
            actual: result.output || result.stderr,
            status: result.status,
            passed: result.status === Verdict.ACCEPTED
        };
        
        testResults.push(caseResult);

        if (result.status !== Verdict.ACCEPTED) {
            overallSuccess = false;
            if (result.status === Verdict.COMPILE_ERROR) {
                errorMsg = result.stderr;
                break; 
            }
        }

        if (i < casesToRun.length - 1) {
            await sleep(300);
        }
    }

  } catch (err: any) {
    overallSuccess = false;
    errorMsg = `System Error: ${err.message}`;
    logger.error(errorMsg);
  }

  const resultData = {
    matchId,
    playerId,
    action: action as 'RUN_TESTS' | 'SUBMIT_SOLUTION',
    success: overallSuccess && !errorMsg,
    error: errorMsg,
    results: testResults
  };

  logger.info(`VERDICT for ${playerId}: ${resultData.success ? "PASSED" : "FAILED"}`);
  await emit({ topic: 'code.processed', data: resultData });
};

// 👇 UPDATED: Added logger parameter and detailed error logging
async function runPiston(code: string, language: string, version: string, testCase: any, logger?: any) {
    const pistonLang = languages.find((lang)=>lang.pistonLang == language)?.pistonLang
    const ver = languages.find((lang)=>lang.pistonLang == language)?.version;

    const payload = {
        language: pistonLang,
        version: ver || "*", // Piston often fails if version doesn't match exactly, '*' is safer
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

        // 1. Check if HTTP Request failed (e.g. 400 Bad Request, 500 Server Error)
        if (!response.ok) {
            const text = await response.text();
            if (logger) logger.error(`PISTON HTTP ERROR ${response.status}: ${text}`);
            return { status: Verdict.RUNTIME_ERROR, stderr: `API HTTP ${response.status}: ${text}` };
        }

        const data: any = await response.json();

        // 2. Check for Piston-specific error structure
        if (data.message) {
             if (logger) logger.error("PISTON ERROR MESSAGE:", data.message);
             return { status: Verdict.RUNTIME_ERROR, stderr: data.message };
        }

        if (data.compile && data.compile.code !== 0) {
            return { status: Verdict.COMPILE_ERROR, stderr: data.compile.stderr };
        }
        
        if (data.run && data.run.code !== 0) {
            // Signal code is killed or exited with error
            return { status: Verdict.RUNTIME_ERROR, stderr: data.run.stderr || `Exited with code ${data.run.code}` };
        }

        const actual = (data.run.stdout || "").trim();
        const expected = testCase.output.map((o: string) => o.trim());
        
        const isCorrect = expected.includes(actual);
        
        return { 
            status: isCorrect ? Verdict.ACCEPTED : Verdict.WRONG_ANSWER, 
            output: actual 
        };

    } catch (e: any) {
        if (logger) {
            logger.error("PISTON EXCEPTION:", e.message);
            // Log payload to see what broke it
            logger.error("Payload sent:", JSON.stringify(payload));
        }
        return { status: Verdict.RUNTIME_ERROR, stderr: `API Exception: ${e.message}` };
    }
}