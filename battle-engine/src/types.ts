export interface GameState {
  matchId: string;
  players: string[];
  status: 'WAITING' | 'RACING' | 'FINISHED';
  startTime?: number;
  winnerId?: string;
  problemId?:string;
}

export interface RunnerRequest {
  matchId: string;
  playerId: string;
  code: string;
  action: 'RUN_TESTS' | 'SUBMIT_SOLUTION'; 
}

export interface RunnerResult {
  matchId: string;
  playerId: string;
  action: 'RUN_TESTS' | 'SUBMIT_SOLUTION';
  success: boolean;
  error?: string;
}