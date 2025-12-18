'use client';

import { MotiaStreamProvider } from '@motiadev/stream-client-react';

export function Providers({ children }: { children: React.ReactNode }) {
  const wsUrl = process.env.WS_GATEWAY_URL;

  if (!wsUrl) {
    console.warn('WS URL is missing. Check your .env file.');
  }

  return (
    <MotiaStreamProvider address={wsUrl || "ws://localhost:3000"}>
      {children}
    </MotiaStreamProvider>
  );
}