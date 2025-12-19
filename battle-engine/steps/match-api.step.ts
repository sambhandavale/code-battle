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
    // const action = req.params?.action || req.pathParams?.action;
    // const { playerId, matchId, code, language, time } = req.body || {};

    let bodyData = req.body;
    
    if (typeof bodyData === 'string') {
        try {
            bodyData = JSON.parse(bodyData);
        } catch (e) {
            logger.error("JSON Parse Error:", e);
            return { status: 400, body: { error: "Invalid JSON body" } };
        }
    }
    
    // Ensure it's an object (handles null/undefined)
    bodyData = bodyData || {}; 

    // Now use bodyData instead of req.body for destructuring
    const { playerId, matchId, code, language, time, problemTitle } = bodyData;
    // ---------------------------------------------------------

    const action = req.params?.action || req.pathParams?.action;

    // Debugging: Log what the server actually sees
    logger.info(`API Hit: ${action}`, { 
        receivedCode: !!code, 
        bodyType: typeof req.body 
    });

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

    if (action === 'join') {
        let game = await MatchModel.findOneAndUpdate(
            { matchId, status: 'WAITING' },
            { $addToSet: { players: playerId } },
            { new: true } 
        );

        if (!game) {
            game = await MatchModel.findOne({ matchId });
            
            if (!game) {
                return { status: 404, body: { error: "Match not found" } };
            }

            const isAlreadyIn = game.players.includes(playerId);
            
            if (!isAlreadyIn) {
                return { status: 400, body: { error: `Cannot join. Match is ${game.status}` } };
            }
        }

        const problem = await Question.findById(game.problemId);
        logger.info(`DB: Player ${playerId} active in ${matchId}`);
        
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

    if (action === 'submit' || action === 'run') {
        const requestType = req.body?.type || (action === 'run' ? 'RUN_TESTS' : 'SUBMIT_SOLUTION');
        
        const match = await MatchModel.findOne({ matchId });
        if (!match) return { status: 404, body: { error: "Match not found" } };

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

        await emit({ 
            topic: 'analyze.code', 
            data: { 
                matchId,
                playerId,
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