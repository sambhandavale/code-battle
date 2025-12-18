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
  emits: ['player.joined', 'run.code', 'analyze.code'],
  flows: ['CodeDuelFlow']
};

export const handler = async (req: any, context: any) => {
  const { emit, logger, streams } = context;
  await connectDB();

  try {
    const action = req.params?.action || req.pathParams?.action;
    const { playerId, matchId, code, language, time } = req.body || {};

    // --- CREATE MATCH ---
    if (action === 'create') {
        const newMatchId = matchId || `match_${Date.now()}`;
        
        let validDuration = 5;
        if (time && [5, 10, 20].includes(time)) {
            validDuration = time;
        }
        const durationMs = validDuration * 60 * 1000;

        const count = await Question.countDocuments({ time: validDuration });
        if (count === 0) {
            return { status: 500, body: { error: `No questions found for ${validDuration} mins.` } };
        }

        const random = Math.floor(Math.random() * count);
        const randomQuestion = await Question.findOne({ time: validDuration }).skip(random);

        if (!randomQuestion) {
            return { status: 500, body: { error: "Error fetching question." } };
        }

        logger.info(`Creating Match ${newMatchId} with problem: ${randomQuestion.title}`);

        await MatchModel.create({
            matchId: newMatchId,
            players: [playerId],
            status: 'WAITING',
            problemId: randomQuestion._id.toString(),
            duration: durationMs
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

        const problem = await Question.findById(game.problemId);
        logger.info(`DB: Added player ${playerId} to ${matchId}`);
        
        // Notify Engine
        await emit({ topic: 'player.joined', data: { matchId, playerId } });

        if (streams?.match) {
            await streams.match.set(matchId, 'message', { 
                type: 'PLAYER_JOINED', 
                playerId: playerId,
                players: game.players
            });
        }
        
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

    // --- SUBMIT / RUN ---
    if (action === 'submit' || action === 'run') {
        const requestType = req.body?.type || (action === 'run' ? 'RUN_TESTS' : 'SUBMIT_SOLUTION');
        
        const match = await MatchModel.findOne({ matchId });
        if (!match) return { status: 404, body: { error: "Match not found" } };

        // Validation: Only allow SUBMIT if RACING. (Run is allowed for practice)
        if (requestType === 'SUBMIT_SOLUTION' && match.status !== 'RACING') {
             return { status: 400, body: { error: `Cannot submit. Match is ${match.status}` } };
        }

        const jobData: RunnerRequest = { 
            matchId, 
            playerId, 
            code, 
            action: requestType,
            // @ts-ignore
            language: language || 'python', 
            version: '3.10.0'
        };
        
        logger.info(`API: Queueing ${requestType} for ${playerId}`);
        
        await emit({ topic: 'run.code', data: jobData });
        return { status: 200, body: { msg: "Code queued" } };
    }

    if (action === 'analyze') {
        const { code, language, problemTitle } = req.body;

        if (!code) {
             return { status: 400, body: { error: "No code provided for analysis." } };
        }

        // Emit an event to trigger the AI Worker
        // We don't wait for the AI here (it's async). We just say "Analysis Started".
        await emit({ 
            topic: 'analyze.code', 
            data: { 
                matchId, // Optional: if you want to broadcast to the match room
                playerId, // The user asking for help
                code,
                language: language || 'python',
                problemTitle: problemTitle || 'Unknown Problem'
            } 
        });

        return { 
            status: 200, 
            body: { msg: "Analysis started. Watch the stream for results." } 
        };
    }

    return { status: 400, body: { error: "Invalid Action" } };

  } catch (error: any) {
    logger.error("API Error", error);
    return { status: 500, body: { error: error.message } };
  }
};