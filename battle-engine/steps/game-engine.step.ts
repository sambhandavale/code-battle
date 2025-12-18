import { StepConfig } from 'motia';
import { connectDB } from '../src/db';
import { MatchModel } from '../src/models/Match';

export const config: StepConfig = {
  name: 'GameEngine',
  type: 'event',
  subscribes: ['player.joined', 'code.processed'],
  emits: ['match.started'], // 👈 NEW: Triggers the timer
  flows: ['CodeDuelFlow']
};

export const handler = async (event: any, context: any) => {
  const { streams, logger, topic, emit } = context; 
  await connectDB();
  
  const payload = event.data || event; 
  const matchId = payload.matchId;

  if (!matchId) {
    logger.error("ENGINE: Missing matchId in event", payload);
    return;
  }

  const isJoinEvent = (topic === 'player.joined') || (payload.playerId && !payload.action);
  const isCodeEvent = (topic === 'code.processed') || (payload.action !== undefined);

  // ---------------------------------------------------------
  // 1. PLAYER JOIN & RACE START LOGIC
  // ---------------------------------------------------------
  if (isJoinEvent) {
    const preMatch = await MatchModel.findOne({ matchId });
    
    // Check if we are waiting and now have enough players (2)
    if (preMatch && preMatch.status === 'WAITING' && preMatch.players.length >= 2) {
        logger.info(`ENGINE: Match ${matchId} has 2 players. Starting Race...`);

        const now = Date.now();
        const endTime = now + preMatch.duration;

        const updatedGame = await MatchModel.findOneAndUpdate(
            { matchId, status: 'WAITING' },
            { $set: { status: 'RACING', startTime: now, endTime: endTime } },
            { new: true }
        );

        if (updatedGame) {
             logger.info(`RACE STARTED! Ends at: ${new Date(endTime).toISOString()}`);
             
             // A. Broadcast START to Frontend
             if (streams.match) {
                await streams.match.set(matchId, 'message', { 
                    type: 'START_RACE', 
                    startTime: now, 
                    endTime: endTime 
                });
             }

             // B. Start the Durable Timer (Replaces Cron)
             await emit({ 
                 topic: 'match.started', 
                 data: { matchId, duration: preMatch.duration } 
             });
        }
    }
  }

  // ---------------------------------------------------------
  // 2. CODE EXECUTION FEEDBACK & WIN LOGIC
  // ---------------------------------------------------------
  if (isCodeEvent) {
     const result = payload; 
     logger.info(`ENGINE: Result for ${matchId} (${result.action}) - Success: ${result.success}`);

     // Always Stream Feedback
     if (streams.match) {
         await streams.match.set(matchId, 'message', { 
            type: 'CODE_FEEDBACK',
            playerId: result.playerId,
            action: result.action,
            success: result.success,
            error: result.error,
            results: result.results,
            timestamp: Date.now()
         });
     }

     // Handle Win Condition
     if (result.action === 'SUBMIT_SOLUTION' && result.success) {
        // Atomic Win Claim
        const winningGame = await MatchModel.findOneAndUpdate(
            { matchId, status: 'RACING' },
            { $set: { status: 'FINISHED', winnerId: result.playerId } },
            { new: true }
        );

        if (winningGame) {
            logger.info(`MATCH FINISHED! Winner is ${result.playerId}`);
            if (streams.match) {
                await streams.match.set(matchId, 'message', { 
                    type: 'GAME_OVER', 
                    winner: result.playerId,
                    reason: 'SOLVED'
                });
            }
        }
     }
  }
};