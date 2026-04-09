"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface BreederBioModalProps {
  isOpen: boolean;
  onClose: () => void;
  breederName: string;
  bio: string;
}

export default function BreederBioModal({
  isOpen,
  onClose,
  breederName,
  bio,
}: BreederBioModalProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRevealed(false);
      const timer = setTimeout(() => setRevealed(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="max-w-xs border-0 bg-transparent p-0 shadow-none outline-none sm:max-w-xs"
      >
        <VisuallyHidden>
          <DialogTitle>브리더 소개</DialogTitle>
        </VisuallyHidden>
        <div className="flex items-center justify-center" style={{ perspective: "900px" }}>
          <div className="relative w-full">
            <div
              className={`absolute inset-0 rounded-2xl transition-opacity duration-1000 ${revealed ? "opacity-100" : "opacity-0"}`}
              style={{
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.08)",
              }}
            />

            <div
              className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-1/3 dark:hidden"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 100%)",
                }}
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 dark:hidden"
                style={{
                  background: "linear-gradient(0deg, rgba(0,0,0,0.02) 0%, transparent 100%)",
                }}
              />
              <div
                className={`pointer-events-none absolute inset-0 z-20 bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-300 transition-opacity dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800 ${revealed ? "opacity-0" : "opacity-100"}`}
                style={{ transitionDuration: "1200ms" }}
              />
              <div
                className={`pointer-events-none absolute inset-0 z-30 transition-all ${revealed ? "translate-x-[200%] opacity-0" : "-translate-x-full opacity-60"}`}
                style={{
                  background:
                    "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.5) 55%, transparent 70%)",
                  transitionDuration: "1400ms",
                  transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
              />

              <div
                className={`relative z-10 flex flex-col items-center px-8 py-10 transition-all duration-1000 ${revealed ? "opacity-100" : "scale-95 opacity-0"}`}
                style={{ transitionDelay: "400ms" }}
              >
                {/* Top ornament */}
                <div className="mb-6 flex w-full items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-neutral-300 shadow-[0_1px_0_rgba(255,255,255,0.7)] dark:to-neutral-600 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]" />
                  <div className="h-1.5 w-1.5 rotate-45 border border-neutral-300 shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:border-neutral-600" />
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-neutral-300 shadow-[0_1px_0_rgba(255,255,255,0.7)] dark:to-neutral-600 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]" />
                </div>

                {/* Title */}
                <h2 className="text-[10px] font-medium tracking-[0.35em] text-neutral-500 uppercase dark:text-neutral-400">
                  About Us
                </h2>
                <h1
                  className="mt-1.5 text-xl font-bold tracking-wider text-neutral-800 dark:text-neutral-100"
                  style={{
                    textShadow: "0 1px 1px rgba(255,255,255,0.6), 0 -1px 1px rgba(0,0,0,0.04)",
                  }}
                >
                  {breederName}
                </h1>

                {/* Divider */}
                <div className="my-5 flex items-center gap-2">
                  <div className="h-px w-8 bg-neutral-300 shadow-[0_1px_0_rgba(255,255,255,0.7)] dark:bg-neutral-600 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]" />
                  <div className="h-1 w-1 rounded-full bg-neutral-300 shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:bg-neutral-600" />
                  <div className="h-px w-8 bg-neutral-300 shadow-[0_1px_0_rgba(255,255,255,0.7)] dark:bg-neutral-600 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]" />
                </div>

                {/* Bio */}
                <p className="max-h-60 w-full overflow-y-auto text-center text-sm leading-relaxed font-medium whitespace-pre-wrap text-neutral-600 dark:text-neutral-300">
                  {bio}
                </p>

                {/* Bottom ornament */}
                <div className="mt-6 flex w-full items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-neutral-300 shadow-[0_1px_0_rgba(255,255,255,0.7)] dark:to-neutral-600 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]" />
                  <div className="h-1.5 w-1.5 rotate-45 border border-neutral-300 shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:border-neutral-600" />
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-neutral-300 shadow-[0_1px_0_rgba(255,255,255,0.7)] dark:to-neutral-600 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
