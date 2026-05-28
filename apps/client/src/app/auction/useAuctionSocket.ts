"use client";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { tokenStorage } from "@/lib/tokenStorage";
import type {
  AuctionCanceledEvent,
  AuctionEndedEvent,
  AuctionStartedEvent,
  AuctionStateWire,
  BidAcceptedEvent,
  BidRejectedEvent,
} from "./types";

function resolveWsBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_BASE_URL;
  if (explicit) return explicit;
  const apiBase = process.env.NEXT_PUBLIC_SERVER_BASE_URL ?? "http://localhost:4000";
  return apiBase;
}

interface UseAuctionSocketOptions {
  shareToken: string;
  onState?: (state: AuctionStateWire) => void;
  onBidAccepted?: (event: BidAcceptedEvent) => void;
  onBidRejected?: (event: BidRejectedEvent) => void;
  onEnded?: (event: AuctionEndedEvent) => void;
  onCanceled?: (event: AuctionCanceledEvent) => void;
  onStarted?: (event: AuctionStartedEvent) => void;
  onServerTime?: (serverNowMs: number) => void;
}

export function useAuctionSocket(opts: UseAuctionSocketOptions) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const base = resolveWsBaseUrl();
    const token = tokenStorage.getToken() ?? undefined;
    const socket = io(`${base}/auction`, {
      transports: ["websocket"],
      autoConnect: true,
      auth: token ? { token } : undefined,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("auction:join", { shareToken: opts.shareToken, token });
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on("auction:state", (state: AuctionStateWire) => {
      optsRef.current.onState?.(state);
    });
    socket.on("auction:bid_accepted", (event: BidAcceptedEvent) => {
      optsRef.current.onBidAccepted?.(event);
    });
    socket.on("auction:bid_rejected", (event: BidRejectedEvent) => {
      optsRef.current.onBidRejected?.(event);
    });
    socket.on("auction:ended", (event: AuctionEndedEvent) => {
      optsRef.current.onEnded?.(event);
    });
    socket.on("auction:cancelled", (event: AuctionCanceledEvent) => {
      optsRef.current.onCanceled?.(event);
    });
    socket.on("auction:started", (event: AuctionStartedEvent) => {
      optsRef.current.onStarted?.(event);
    });
    socket.on("auction:server_time", (data: { serverNowMs: number }) => {
      optsRef.current.onServerTime?.(data.serverNowMs);
    });

    return () => {
      socket.emit("auction:leave", { shareToken: opts.shareToken });
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
    // shareToken만 의존성에 — 콜백은 ref로 안정 참조
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.shareToken]);

  function placeBid(amount: number) {
    const socket = socketRef.current;
    if (!socket) return;
    const token = tokenStorage.getToken() ?? undefined;
    socket.emit("auction:bid", {
      shareToken: opts.shareToken,
      amount,
      token,
    });
  }

  return { connected, placeBid };
}
