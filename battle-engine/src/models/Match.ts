import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  matchId: string;
  players: string[];
  status: 'WAITING' | 'RACING' | 'FINISHED' | 'EXPIRED';
  problemId: string;
  winnerId?: string;
  startTime?: number;
  duration: number; // Duration in milliseconds
  endTime?: number; // Exact timestamp when the match ends
}

const MatchSchema = new Schema<IMatch>({
  matchId: { type: String, required: true, unique: true },
  players: [{ type: String }],
  status: { 
      type: String, 
      enum: ['WAITING', 'RACING', 'FINISHED', 'EXPIRED'], 
      default: 'WAITING' 
  },
  problemId: { type: String, default: 'two-sum' },
  winnerId: { type: String },
  startTime: { type: Number },
  duration: { type: Number, default: 300000 }, // Default 5 mins (300,000 ms)
  endTime: { type: Number }
}, { timestamps: true });

// Prevent overwrite during hot-reload
export const MatchModel = mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);