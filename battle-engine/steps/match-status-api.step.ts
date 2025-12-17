import { StepConfig } from 'motia';
import { connectDB } from '../src/db';
import { MatchModel } from '../src/models/Match';
import Question from '../src/models/Question';

export const config: StepConfig = {
  name: 'MatchStatusAPI',
  type: 'api',
  path: '/match/:matchId',
  method: 'GET',
  flows: ['CodeDuelFlow'],
  emits: []
};

export const handler = async (req: any, context: any) => {
  const { logger } = context;
  const matchId = req.params?.matchId || req.pathParams?.matchId;

  if (!matchId) {
    return { status: 400, body: { error: "Missing matchId" } };
  }

  await connectDB();

  try {
    const game = await MatchModel.findOne({ matchId });

    if (!game) {
      return { status: 404, body: { error: "Match not found" } };
    }

    const problem = await Question.findById(game.problemId);

    const responsePayload = {
      matchId: game.matchId,
      status: game.status, 
      players: game.players,
      winnerId: game.winnerId || null,
      
      startTime: game.startTime || null,
      endTime: game.endTime || null,
      duration: game.duration,

      problem: problem ?? null
    };

    return { 
      status: 200, 
      body: responsePayload
    };

  } catch (error: any) {
    logger.error(`Error fetching match ${matchId}:`, error);
    return { status: 500, body: { error: "Internal Server Error" } };
  }
};