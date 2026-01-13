"use client";

import { createContext, useContext, ReactNode } from "react";

interface ModalContextValue {
  navigateAway: (url: string) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({
  children,
  navigateAway,
}: {
  children: ReactNode;
  navigateAway: (url: string) => void;
}) {
  return <ModalContext.Provider value={{ navigateAway }}>{children}</ModalContext.Provider>;
}

export function useModalContext() {
  return useContext(ModalContext);
}
