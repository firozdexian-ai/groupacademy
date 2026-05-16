import * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Workspace Spatial Orchestration Suite (Resizable)
 * Hardened grid splitting matrix unifiying structural layout parameters across vertical and horizontal configurations.
 * Version: Launch Candidate · Phase Z0 Multi-Direction Sync Hardened
 */
const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col select-none antialiased transform-gpu",
      className,
    )}
    {...props}
  />
);
ResizablePanelGroup.displayName = "Resizable_Core_Group_Node";

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex w-1 items-center justify-center bg-transparent transition-colors duration-150 group outline-none focus-visible:outline-none shrink-0 z-10",
      "hover:bg-primary/5 data-[resize-handle-active]:bg-primary/10",
      "data-[panel-group-direction=vertical]:h-1 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:cursor-row-resize cursor-col-resize",
      className,
    )}
    {...props}
  >
    {/* HUD LEVEL 1: ACCESSIBLE ORIENTATION SYNCED INNER DIVIDER LINE */}
    <div
      className={cn(
        "bg-border/60 transition-colors duration-150 h-full w-px pointer-events-none select-none shrink-0 block",
        "group-hover:bg-primary/40 group-data-[resize-handle-active]:bg-primary",
        "group-data-[panel-group-direction=vertical]:h-px group-data-[panel-group-direction=vertical]:w-full",
      )}
    />

    {/* HUD LEVEL 2: STRUCTURAL GRAB TACTILE DRAG FEEDBACK CONTROLLER TABS */}
    {withHandle && (
      <div
        className={cn(
          "absolute z-50 flex h-6 w-3.5 items-center justify-center rounded-xs border border-border/60 bg-popover text-muted-foreground/40 shadow-xs transition-colors duration-150 pointer-events-none select-none group-hover:text-primary group-hover:border-primary/40 group-data-[resize-handle-active]:border-primary group-data-[resize-handle-active]:text-primary transform-gpu shrink-0",
          "group-data-[panel-group-direction=vertical]:rotate-90",
        )}
      >
        <GripVertical className="h-3 w-3 stroke-[2.2] shrink-0" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
);
ResizableHandle.displayName = "Resizable_Core_Resize_Handle_Node";

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
