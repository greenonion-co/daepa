"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface LineageCertificateCardProps {
  isOpen: boolean;
  onClose: () => void;
  ownerName: string;
  parentName: string;
}

const LineageCertificateCard = ({
  isOpen,
  onClose,
  ownerName,
  parentName,
}: LineageCertificateCardProps) => {
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
        className="max-w-xs border-0 bg-transparent p-0 shadow-none sm:max-w-xs"
      >
        <VisuallyHidden>
          <DialogTitle>혈통인증서</DialogTitle>
        </VisuallyHidden>
        <div className="flex items-center justify-center" style={{ perspective: "900px" }}>
          <div className="relative w-full">
            {/* Layered shadow for depth */}
            <div
              className={`absolute inset-0 rounded-2xl transition-opacity duration-1000 ${revealed ? "opacity-100" : "opacity-0"}`}
              style={{
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.08)",
              }}
            />

            {/* Card */}
            <div
              className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
              }}
            >
              {/* Inner top highlight — lit from above */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-1/3 dark:hidden"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 100%)",
                }}
              />
              {/* Inner bottom shadow — recessed feel */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 dark:hidden"
                style={{
                  background: "linear-gradient(0deg, rgba(0,0,0,0.02) 0%, transparent 100%)",
                }}
              />
              {/* Reveal cover */}
              <div
                className={`pointer-events-none absolute inset-0 z-20 bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-300 transition-opacity dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800 ${revealed ? "opacity-0" : "opacity-100"}`}
                style={{ transitionDuration: "1200ms" }}
              />

              {/* Shine sweep on reveal */}
              <div
                className={`pointer-events-none absolute inset-0 z-30 transition-all ${revealed ? "translate-x-[200%] opacity-0" : "-translate-x-full opacity-60"}`}
                style={{
                  background:
                    "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.5) 55%, transparent 70%)",
                  transitionDuration: "1400ms",
                  transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
              />

              {/* Card content */}
              <div
                className={`relative z-10 flex flex-col items-center px-8 py-10 transition-all duration-1000 ${revealed ? "opacity-100" : "scale-95 opacity-0"}`}
                style={{ transitionDelay: "400ms" }}
              >
                {/* Top ornament — embossed */}
                <div className="mb-6 flex w-full items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-neutral-300 shadow-[0_1px_0_rgba(255,255,255,0.7)] dark:to-neutral-600 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]" />
                  <div className="h-1.5 w-1.5 rotate-45 border border-neutral-300 shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:border-neutral-600" />
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-neutral-300 shadow-[0_1px_0_rgba(255,255,255,0.7)] dark:to-neutral-600 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]" />
                </div>

                {/* Title */}
                <h2 className="text-[10px] font-medium tracking-[0.35em] text-neutral-500 uppercase dark:text-neutral-400">
                  Certificate of Lineage
                </h2>
                <h1
                  className="mt-1.5 text-xl font-bold tracking-wider text-neutral-800 dark:text-neutral-100"
                  style={{
                    textShadow: "0 1px 1px rgba(255,255,255,0.6), 0 -1px 1px rgba(0,0,0,0.04)",
                  }}
                >
                  혈통인증서
                </h1>

                {/* Divider */}
                <div className="my-5 flex items-center gap-2">
                  <div className="h-px w-8 bg-neutral-300 shadow-[0_1px_0_rgba(255,255,255,0.7)] dark:bg-neutral-600 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]" />
                  <div className="h-1 w-1 rounded-full bg-neutral-300 shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:bg-neutral-600" />
                  <div className="h-px w-8 bg-neutral-300 shadow-[0_1px_0_rgba(255,255,255,0.7)] dark:bg-neutral-600 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]" />
                </div>

                {/* Body */}
                <div className="w-full space-y-5 text-center">
                  <div>
                    <p className="text-[9px] font-semibold tracking-[0.25em] text-neutral-400 uppercase dark:text-neutral-500">
                      Original Breeder
                    </p>
                    <p className="mt-1.5 text-base font-bold text-neutral-800 dark:text-neutral-100">
                      {ownerName}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] font-semibold tracking-[0.25em] text-neutral-400 uppercase dark:text-neutral-500">
                      Parent
                    </p>
                    <p className="mt-1.5 text-base font-bold text-neutral-800 dark:text-neutral-100">
                      {parentName}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-5 flex items-center gap-2">
                  <div className="h-px w-8 bg-neutral-300 shadow-[0_1px_0_rgba(255,255,255,0.7)] dark:bg-neutral-600 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]" />
                  <div className="h-1 w-1 rounded-full bg-neutral-300 shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:bg-neutral-600" />
                  <div className="h-px w-8 bg-neutral-300 shadow-[0_1px_0_rgba(255,255,255,0.7)] dark:bg-neutral-600 dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]" />
                </div>

                {/* Statement */}
                <p className="max-w-[220px] text-center text-[11px] leading-relaxed font-medium text-neutral-500 dark:text-neutral-400">
                  부모 개체의 브리더로부터
                  <br />
                  혈통과 소유권을 인증받은 개체입니다.
                </p>

                {/* Bottom ornament — embossed */}
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
};

export default LineageCertificateCard;
