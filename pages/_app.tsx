import { ThemeProvider } from "@/components/themeProvider";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

// Define the window interface extension for electronAPI
declare global {
  interface Window {
    electronAPI: {
      on: (channel: string, callback: (event: Electron.IpcRendererEvent, data: any) => void) => void;
      send: (channel: string, data?: any) => void;
      off: (channel: string, callback: (event: Electron.IpcRendererEvent, data: any) => void) => void;
      removeAllListeners: (channel: string) => void;
    }
  }
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
