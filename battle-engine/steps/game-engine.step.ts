import { StepConfig } from 'motia';
import { connectDB } from '../src/db';
import { MatchModel } from '../src/models/Match';

export const config: StepConfig = {
  name: 'GameEngine',
  type: 'event',
  subscribes: ['player.joined', 'code.processed'],
  emits: [],
  flows: ['CodeDuelFlow']
};

export const handler = async (event: any, context: any) => {
  const { streams, logger, traceId, topic } = context; 
  await connectDB();
  
  const payload = event.data || event; 
  const matchId = payload.matchId;

  if (!matchId) {
    logger.error("❌ ENGINE: Missing matchId", payload);
    return;
  }

  // Robust Topic Detection
  const isJoinEvent = (topic === 'player.joined') || (payload.playerId && !payload.action);
  const isCodeEvent = (topic === 'code.processed') || (payload.action !== undefined);

  // --- 1. START RACE LOGIC ---
  if (isJoinEvent) {
    const preMatch = await MatchModel.findOne({ matchId });
    if (preMatch && preMatch.status === 'WAITING' && preMatch.players.length >= 2) {
        const now = Date.now();
        const endTime = now + preMatch.duration;

        const updatedGame = await MatchModel.findOneAndUpdate(
            { matchId, status: 'WAITING' },
            { $set: { status: 'RACING', startTime: now, endTime: endTime } },
            { new: true }
        );

        if (updatedGame) {
             logger.info(`🚀 RACE STARTED! Ends at: ${new Date(endTime).toISOString()}`);
             if (streams.match) {
                await streams.match.set(traceId || matchId, 'message', { 
                    type: 'START_RACE', startTime: now, endTime: endTime 
                });
             }
        }
    }
  }

  // --- 2. FINISH RACE LOGIC ---
  if (isCodeEvent) {
     const result = payload; 
     logger.info(`🏁 ENGINE: Received Code Result for ${matchId}`, { 
         player: result.playerId, 
         success: result.success, 
         action: result.action 
     });

     if (result.action === 'SUBMIT_SOLUTION' && result.success) {
        logger.info(`🏆 Attempting to declare winner: ${result.playerId}...`);

        // 1. Try to Update
        const winningGame = await MatchModel.findOneAndUpdate(
            { matchId, status: 'RACING' }, // Condition: Must be RACING
            { $set: { status: 'FINISHED', winnerId: result.playerId } },
            { new: true }
        );

        // 2. Did it work?
        if (winningGame) {
            logger.info(`🎉 MATCH FINISHED! Winner is ${result.playerId}`);
            if (streams.match) {
                await streams.match.set(traceId || matchId, 'message', { 
                    type: 'GAME_OVER', winner: result.playerId 
                });
            }
        } else {
            // 3. DEBUGGING FAILURE
            const currentMatch = await MatchModel.findOne({ matchId });
            logger.warn(`⚠️ WINNER UPDATE FAILED!`, {
                expectedStatus: 'RACING',
                actualStatus: currentMatch?.status,
                matchId: matchId
            });
        }
     }
  }
};