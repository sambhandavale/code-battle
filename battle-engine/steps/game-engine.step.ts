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
  const { streams, logger, topic } = context; 
  await connectDB();
  
  // Normalize payload (sometimes Motia wraps it in data, sometimes it is direct)
  const payload = event.data || event; 
  const matchId = payload.matchId;

  if (!matchId) {
    logger.error("ENGINE: Missing matchId in event", payload);
    return;
  }

  // Determine which type of event triggered this step
  const isJoinEvent = (topic === 'player.joined') || (payload.playerId && !payload.action);
  const isCodeEvent = (topic === 'code.processed') || (payload.action !== undefined);

  // ---------------------------------------------------------
  // 1. PLAYER JOIN & RACE START LOGIC
  // ---------------------------------------------------------
  if (isJoinEvent) {
    // Note: The immediate "Player Joined" notification is sent by MatchAPI.
    // This block is strictly for checking if we should START the race.
    
    const preMatch = await MatchModel.findOne({ matchId });
    
    // Check if we are waiting and now have enough players (2)
    if (preMatch && preMatch.status === 'WAITING' && preMatch.players.length >= 2) {
        logger.info(`ENGINE: Match ${matchId} has 2 players. Starting Race...`);

        const now = Date.now();
        const endTime = now + preMatch.duration;

        // Atomic Update: Only update if status is still 'WAITING'
        // This prevents double-starts if multiple events come in quickly
        const updatedGame = await MatchModel.findOneAndUpdate(
            { matchId, status: 'WAITING' },
            { $set: { status: 'RACING', startTime: now, endTime: endTime } },
            { new: true }
        );

        if (updatedGame) {
             logger.info(`RACE STARTED! Ends at: ${new Date(endTime).toISOString()}`);
             
             // Broadcast START_RACE to all clients
             if (streams.match) {
                await streams.match.set(matchId, 'message', { 
                    type: 'START_RACE', 
                    startTime: now, 
                    endTime: endTime 
                });
             }
        }
    }
  }

  // ---------------------------------------------------------
  // 2. CODE EXECUTION FEEDBACK & WIN LOGIC
  // ---------------------------------------------------------
  if (isCodeEvent) {
     const result = payload; 
     logger.info(`ENGINE: Result for ${matchId} (${result.action}) - Success: ${result.success}`);

     // A. Always Stream Feedback (For both 'RUN_TESTS' and 'SUBMIT_SOLUTION')
     // This allows the frontend to show specific test case results (Pass/Fail)
     // without ending the game.
     if (streams.match) {
         await streams.match.set(matchId, 'message', { 
            type: 'CODE_FEEDBACK',
            playerId: result.playerId,
            action: result.action,      // 'RUN_TESTS' or 'SUBMIT_SOLUTION'
            success: result.success,    // Did it pass the specific tests run?
            error: result.error,        // Compile/Runtime errors
            results: result.results,    // Detailed array of test case results
            timestamp: Date.now()
         });
     }

     // B. Handle Win Condition
     // Only if action is SUBMIT_SOLUTION and it was completely successful
     if (result.action === 'SUBMIT_SOLUTION' && result.success) {
        logger.info(`Attempting to declare winner: ${result.playerId}...`);

        // Atomic Update: Only set winner if match is currently RACING.
        // This prevents a second submission from overwriting the winner 
        // if two players submit milliseconds apart.
        const winningGame = await MatchModel.findOneAndUpdate(
            { matchId, status: 'RACING' },
            { $set: { status: 'FINISHED', winnerId: result.playerId } },
            { new: true }
        );

        if (winningGame) {
            logger.info(`MATCH FINISHED! Winner is ${result.playerId}`);
            
            // Broadcast GAME_OVER to all clients
            if (streams.match) {
                await streams.match.set(matchId, 'message', { 
                    type: 'GAME_OVER', 
                    winner: result.playerId 
                });
            }
        } else {
            // If update failed, it means the match was already finished
            const currentMatch = await MatchModel.findOne({ matchId });
            logger.warn(`WINNER UPDATE IGNORED (Match is ${currentMatch?.status})`, { 
                matchId, 
                ignoredWinner: result.playerId 
            });
        }
     }
  }
};