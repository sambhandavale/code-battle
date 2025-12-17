import { StreamConfig } from 'motia';
import { z } from 'zod';

export const config: StreamConfig = {
  name: 'match',
  schema: z.object({
    type: z.string(),
    startTime: z.number().optional(),
    endTime: z.number().optional(),
    winner: z.string().optional(),
    error: z.string().optional(),
    msg: z.string().optional()
  }),
  baseConfig: { storageType: 'default' }
};