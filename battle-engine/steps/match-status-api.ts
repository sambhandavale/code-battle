import { StepConfig } from 'motia';
import { GameState } from '../src/types';

export const config: StepConfig = {
  name: 'MatchStatusAPI',
  type: 'api',
  path: '/match/:matchId',
  method: 'GET',
  flows: ['CodeDuelFlow'],
  emits: []
};

export const handler = async (req: any, context: any) => {
  const { state, logger } = context;
  const matchId = req.pathParams?.matchId;

  if (!matchId) {
    return { status: 400, body: { error: "Missing matchId" } };
  }

  try {
    // Fetch the game state from the KV store
    const game = await state.get('matches', matchId) as GameState | null;

    if (!game) {
      return { status: 404, body: { error: "Match not found" } };
    }

    // Return the full game state
    return { 
      status: 200, 
      body: { 
        matchId: game.matchId,
        status: game.status,
        players: game.players,
        winnerId: game.winnerId || null,
        startTime: game.startTime || null
      } 
    };

  } catch (error: any) {
    logger.error(`Error fetching match ${matchId}:`, error);
    return { status: 500, body: { error: "Internal Server Error" } };
  }
};