import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { PushChainProviders } from '../providers/PushChainProviders';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PushChainProviders>
      <Component {...pageProps} />
    </PushChainProviders>
  );
}