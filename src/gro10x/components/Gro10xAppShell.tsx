import { ReactNode } from "react";
import { Outlet, useMatch } from "react-router-dom";
import { Gro10xBottomNav } from "./Gro10xBottomNav";
import { Gro10xTopBar } from "./Gro10xTopBar";
import { GRO10X_BG, GRO10X_TEXT } from "../lib/tokens";

interface Props {
  children?: ReactNode;
  hideBottomNav?: boolean;
}

export function Gro10xAppShell({ children, hideBottomNav }: Props) {
  // Hide the bottom nav inside agent chat threads so the chat input owns
  // the bottom edge (avoids the double-bar collision).
  const isChat = !!useMatch("/gro10x/c/:agentKey");
  const showNav = !hideBottomNav && !isChat;

  return (
    <div className={`min-h-[100dvh] ${GRO10X_BG} ${GRO10X_TEXT} flex flex-col`}>
      <Gro10xTopBar />
      <main
        className={`flex-1 ${
          showNav ? "pb-[calc(64px+env(safe-area-inset-bottom))]" : "pb-[env(safe-area-inset-bottom)]"
        }`}
      >
        {children ?? <Outlet />}
      </main>
      {showNav && <Gro10xBottomNav />}
    </div>
  );
}
