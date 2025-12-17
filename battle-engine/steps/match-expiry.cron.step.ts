import { CronConfig } from 'motia';
import { connectDB } from '../src/db';
import { MatchModel } from '../src/models/Match';

export const config: CronConfig = {
  name: 'MatchExpiryJob',
  type: 'cron',
  cron: '*/1 * * * *',
  flows: ['CodeDuelFlow'],
  emits: []
};

export const handler = async ({ logger, streams }: any) => {
  logger.info("CRON HEARTBEAT: Checking for expired matches...");

  await connectDB();
  const now = Date.now();

  const expiredMatches = await MatchModel.find({
      status: 'RACING',
      endTime: { $lt: now } 
  });

  if (expiredMatches.length > 0) {
      logger.info(`Found ${expiredMatches.length} matches to expire.`);
  } else {
      logger.info("No expired matches found.");
  }

  for (const match of expiredMatches) {
      match.status = 'EXPIRED'; 
      match.winnerId = null; 
      await match.save();
      
      logger.info(`Expiring Match: ${match.matchId}`);
      
      if (streams.match) {
          await streams.match.set(match.matchId, 'message', { 
              type: 'GAME_OVER', 
              winner: null,
              reason: 'DRAW_TIME_LIMIT'
          });
      }
  }
};