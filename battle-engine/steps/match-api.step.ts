import { StepConfig } from 'motia';
import { connectDB } from '../src/db';
import { MatchModel } from '../src/models/Match';
import { RunnerRequest } from '../src/types';
import Question from '../src/models/Question';

export const config: StepConfig = {
  name: 'MatchAPI',
  type: 'api',
  path: '/match/:action',
  method: 'POST',
  emits: ['player.joined', 'run.code'],
  flows: ['CodeDuelFlow']
};

export const handler = async (req: any, context: any) => {
  const { emit, logger } = context;
  await connectDB();

  try {
    const action = req.params?.action || req.pathParams?.action;
    const { playerId, matchId, code, language, time } = req.body || {};

    // --- CREATE MATCH ---
    if (action === 'create') {
        const newMatchId = matchId || `match_${Date.now()}`;
        
        // 1. Calculate Duration
        let validDuration = 5;
        if (time && [5, 10, 20].includes(time)) {
            validDuration = time;
        }
        const durationMs = validDuration * 60 * 1000;

        // 2. Select Random Question (FIXED LOGIC)
        // FILTER THE COUNT: Only count questions that match the time
        const count = await Question.countDocuments({ time: validDuration });

        if (count === 0) {
            return { status: 500, body: { error: `No questions found for ${validDuration} minutes. Please seed data.` } };
        }

        // Generate random index based on the FILTERED count
        const random = Math.floor(Math.random() * count);

        // Find one with the same filter and skip
        const randomQuestion = await Question.findOne({ time: validDuration }).skip(random);

        if (!randomQuestion) {
            // This should theoretically not happen if count > 0, but good safety
            return { status: 500, body: { error: "Error fetching question." } };
        }

        logger.info(`🎲 Creating Match ${newMatchId} with problem: ${randomQuestion.title} (${validDuration} mins)`);

        // 3. Create Match
        await MatchModel.create({
            matchId: newMatchId,
            players: [playerId],
            status: 'WAITING',
            problemId: randomQuestion._id.toString(),
            duration: durationMs // Save choice
        });
        
        return { 
            status: 200, 
            body: { 
                matchId: newMatchId, 
                msg: "Match Created", 
                durationMinutes: validDuration,
                problemTitle: randomQuestion.title 
            } 
        };
    }

    // --- JOIN MATCH --- 
    if (action === 'join') {
        const game = await MatchModel.findOne({ matchId });
        if (!game) return { status: 404, body: { error: "Match not found" } };

        if (!game.players.includes(playerId)) {
            game.players.push(playerId);
            await game.save();
        }

        // Return problem details AND duration so UI can set the clock
        const problem = await Question.findById(game.problemId);

        logger.info(`DB: Added player ${playerId} to ${matchId}`);
        await emit({ topic: 'player.joined', data: { matchId, playerId } });
        
        return { 
            status: 200, 
            body: { 
                msg: "Joined", 
                state: game,
                durationMs: game.duration, 
                problem: { title: problem?.title, description: problem?.description } 
            } 
        };
    }

    // --- SUBMIT CODE ---
    if (action === 'submit') {
        const requestType = req.body?.type || 'SUBMIT_SOLUTION';
        
        const match = await MatchModel.findOne({ matchId });
        if (!match) return { status: 404, body: { error: "Match not found" } };

        if (match.status !== 'RACING') {
             return { status: 400, body: { error: `Cannot submit. Match is ${match.status}` } };
        }

        // --- DYNAMIC TIMER CHECK ---
        // If endTime exists, use it. Otherwise calc from start + duration.
        const deadline = match.endTime || ((match.startTime || 0) + match.duration);
        
        if (Date.now() > deadline) {
            return { status: 400, body: { error: "⏰ Time Limit Exceeded! The match has ended." } };
        }

        // Proceed to Runner
        const jobData: RunnerRequest = { 
            matchId, 
            playerId, 
            code, 
            action: requestType, 
            // @ts-ignore
            language: language || 'python', 
            version: '3.10.0'
        };
        await emit({ topic: 'run.code', data: jobData });
        return { status: 200, body: { msg: "Code queued" } };
    }

    return { status: 400, body: { error: "Invalid Action" } };

  } catch (error: any) {
    logger.error("API Error", error);
    return { status: 500, body: { error: error.message } };
  }
};