import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Gro10xBottomNav } from "./Gro10xBottomNav";
import { GRO10X_BG, GRO10X_TEXT } from "../lib/tokens";

interface Props {
  children?: ReactNode;
  hideBottomNav?: boolean;
}

export function Gro10xAppShell({ children, hideBottomNav }: Props) {
  return (
    <div className={`min-h-[100dvh] ${GRO10X_BG} ${GRO10X_TEXT} flex flex-col`}>
      <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))]">
        {children ?? <Outlet />}
      </main>
      {!hideBottomNav && <Gro10xBottomNav />}
    </div>
  );
}
