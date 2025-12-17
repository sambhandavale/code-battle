import { useStreamItem } from '@motiadev/stream-client-react';

interface MatchStreamData {
  type: string;
  startTime?: number;
  endTime?: number;
  winner?: string;
}

export const useMatchStream = (matchId: string) => {
  const { data } = useStreamItem<MatchStreamData>({
    streamName: 'match',
    groupId: matchId,
    id: 'message'
  });

  return { 
    gameState: data,
    isRacing: data?.type === 'START_RACE',
    isGameOver: data?.type === 'GAME_OVER',
    winner: data?.winner
  };
};