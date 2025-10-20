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
import { ThemeProvider } from "./providers/ThemeProvider.tsx";

// Create a client for React Query
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <PushChainProviders>
                <App />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    className:
                      "border border-border/60 bg-card/85 text-card-foreground shadow-[0_20px_45px_-20px_rgba(129,54,255,0.45)] backdrop-blur-xl rounded-2xl px-4 py-3",
                    style: {
                      background: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                    },
                    success: {
                      iconTheme: {
                        primary: "hsl(var(--primary))",
                        secondary: "hsl(var(--primary-foreground))",
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: "hsl(var(--destructive))",
                        secondary: "hsl(var(--destructive-foreground))",
                      },
                    },
                  }}
                />
              </PushChainProviders>
            </ThemeProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
