import { StepConfig } from 'motia';
import { connectDB } from '../src/db';
import { MatchModel } from '../src/models/Match';

export const config: StepConfig = {
  name: 'MatchTimer',
  type: 'event',
  subscribes: ['match.started'],
  emits: [],
  flows: ['CodeDuelFlow']
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const handler = async (event: any, { logger, streams }: any) => {
  const payload = event.data || event;
  const { matchId, duration } = payload;

  if (!matchId || !duration) {
      logger.error("TIMER: Missing matchId or duration", payload);
      return;
  }

  logger.info(`TIMER: Started for ${matchId}. Sleeping for ${duration / 1000}s...`);

  // 💤 The "Durable" Wait
  // We wait for the specific duration of THIS match.
  await sleep(duration);

  // ⏰ Wake up! Time is up.
  await connectDB();
  logger.info(`TIMER: Woke up for ${matchId}. Checking status...`);

  // Check if the match is still running
  // We use findOneAndUpdate to atomically close it if it's still RACING
  const match = await MatchModel.findOneAndUpdate(
      { matchId, status: 'RACING' },
      { $set: { status: 'EXPIRED' } },
      { new: true }
  );

  if (match) {
      logger.info(`TIMER: Time limit exceeded for ${matchId}. Expiring...`);

      // Notify Frontend
      if (streams.match) {
          await streams.match.set(matchId, 'message', { 
              type: 'GAME_OVER', 
              winner: null,
              reason: 'TIME_LIMIT'
          });
      }
  } else {
      logger.info(`TIMER: Match ${matchId} was already finished/expired. Doing nothing.`);
  }
};