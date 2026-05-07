"use client";
import { ChatProvider } from "../context/ChatContext";
import { LanguageProvider } from "../context/LanguageContext";
import ChatWidget from "./ChatWidget";
import { ReactNode } from "react";

/**
 * Client-side providers wrapper.
 * Kept separate from layout.tsx so the root layout remains a Server Component,
 * which enables Next.js metadata exports and proper SSR.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ChatProvider>
        {children}
        <ChatWidget />
      </ChatProvider>
    </LanguageProvider>
  );
}
