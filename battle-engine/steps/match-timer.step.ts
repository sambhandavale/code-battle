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

  await sleep(duration);

  await connectDB();
  logger.info(`TIMER: Woke up for ${matchId}. Checking status...`);

  const match = await MatchModel.findOneAndUpdate(
      { matchId, status: 'RACING' },
      { $set: { status: 'EXPIRED' } },
      { new: true }
  );

  if (match) {
      logger.info(`TIMER: Time limit exceeded for ${matchId}. Expiring...`);

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