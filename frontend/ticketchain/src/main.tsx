import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App.tsx";
import "./index.css";
import { PushChainProviders } from "./providers/PushChainProvider.tsx";
import { wagmiConfig } from "./lib/wagmi";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";

// Create a client for React Query
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <PushChainProviders>
              <App />
              <Toaster />
            </PushChainProviders>
          </QueryClientProvider>
        </WagmiProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
