"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";
import React from "react";

// Wagmi Config 설정
const config = getDefaultConfig({
  appName: "Web3 Rhythm Game Tester",
  projectId: "5735c21eec2cb971d0a5116957066ebe",
  // 여기에 실제 RainbowKit Project ID를 넣어주세요.
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});

// React Query Client 설정
const queryClient = new QueryClient();

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
