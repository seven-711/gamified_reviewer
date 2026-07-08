"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface AlertOptions {
  title?: string;
  emoji?: string;
  buttonText?: string;
}

interface AlertState {
  isOpen: boolean;
  message: string;
  title?: string;
  emoji?: string;
  buttonText?: string;
  resolve?: () => void;
}

interface AlertContextProps {
  showAlert: (message: string, options?: AlertOptions) => Promise<void>;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

// Regex to capture emoji at the beginning of a string
const emojiRegex = /^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F6FF}]+)\s*(.*)$/u;

function parseAlertMessage(msg: string): { emoji?: string; cleanMessage: string } {
  const match = msg.match(emojiRegex);
  if (match) {
    return {
      emoji: match[1],
      cleanMessage: match[2],
    };
  }
  return { cleanMessage: msg };
}

function getMascotForMessage(message: string, emoji?: string): string {
  const msgLower = message.toLowerCase();
  
  if (emoji === "❌" || msgLower.includes("fail") || msgLower.includes("error")) {
    return "/emoji/sorrytoomad.webp";
  }
  if (emoji === "😢" || msgLower.includes("oh no") || msgLower.includes("missed") || msgLower.includes("lost")) {
    return "/emoji/wahhh.webp";
  }
  if (
    emoji === "🎉" ||
    emoji === "🌅" ||
    msgLower.includes("success") ||
    msgLower.includes("completed") ||
    msgLower.includes("received") ||
    msgLower.includes("refilled") ||
    msgLower.includes("purchased")
  ) {
    return "/emoji/ohyeah.webp";
  }
  if (
    emoji === "❤️" ||
    emoji === "❄️" ||
    msgLower.includes("not enough") ||
    msgLower.includes("already")
  ) {
    return "/emoji/hmm.webp";
  }
  
  return "/emoji/general.webp";
}

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState | null>(null);

  const showAlert = useCallback((message: string, options?: AlertOptions) => {
    return new Promise<void>((resolve) => {
      const parsed = parseAlertMessage(message);
      setAlertState({
        isOpen: true,
        message: parsed.cleanMessage,
        title: options?.title || (options?.emoji || parsed.emoji ? undefined : "Alert"),
        emoji: options?.emoji || parsed.emoji,
        buttonText: options?.buttonText || "CONTINUE",
        resolve,
      });
    });
  }, []);

  const handleClose = () => {
    if (alertState?.resolve) {
      alertState.resolve();
    }
    setAlertState(null);
  };

  const mascot = alertState
    ? getMascotForMessage(alertState.message, alertState.emoji)
    : "/emoji/general.webp";

  const isError =
    alertState?.emoji === "❌" ||
    alertState?.message.toLowerCase().includes("fail") ||
    alertState?.message.toLowerCase().includes("error");

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alertState && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-snow-white border-2 border-cloud-gray border-b-8 rounded-[24px] w-full max-w-[420px] p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-none animate-scale-in relative text-center font-din-round">
            
            {/* Mascot and Emoji Header */}
            <div className="flex flex-col items-center gap-5">
              <div className="w-[110px] h-[110px] relative shrink-0">
                <Image 
                  src={mascot} 
                  alt="Mascot Alert" 
                  fill 
                  sizes="110px"
                  className="object-contain drop-shadow-md"
                  unoptimized
                />
                {alertState.emoji && (
                  <span className="absolute -bottom-2 -right-2 text-3xl bg-snow-white p-2 rounded-full border-2 border-cloud-gray shadow-sm">
                    {alertState.emoji}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col gap-2 font-din-round">
                {alertState.title && (
                  <h3 className="font-feather text-2xl md:text-[26px] text-charcoal font-bold leading-tight tracking-wide">
                    {alertState.title}
                  </h3>
                )}
                <p className="text-graphite text-body leading-relaxed max-w-[340px] mx-auto tracking-wide whitespace-pre-line">
                  {alertState.message}
                </p>
              </div>
            </div>

            {/* Close / Action Button */}
            <div className="w-full mt-2">
              <Button
                onClick={handleClose}
                fullWidth
                variant={isError ? "danger" : "primary"}
              >
                {alertState.buttonText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
