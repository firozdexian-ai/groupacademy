import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

/**
 * Platform Logic: Spatial Orchestration Protocol
 * Orchestrates flexible workspace nodes with precision drag-physics and technical visual feedback.
 */
const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col transition-all duration-500",
      className,
    )}
    {...props}
  />
);

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
      "relative flex w-1.5 items-center justify-center bg-transparent transition-all duration-300 group",
      "hover:bg-primary/5 data-[resize-handle-active]:bg-primary/10",
      "data-[panel-group-direction=vertical]:h-1.5 data-[panel-group-direction=vertical]:w-full",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
      className,
    )}
    {...props}
  >
    {/* Internal Divider Lane */}
    <div
      className={cn(
        "bg-border/40 transition-colors group-hover:bg-primary/40 group-data-[resize-handle-active]:bg-primary",
        "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        "h-full w-px",
      )}
    />

    {withHandle && (
      <div
        className={cn(
          "z-50 flex h-7 w-4 items-center justify-center rounded-lg border border-border/40 bg-background/80 backdrop-blur-md shadow-lg transition-all duration-300",
          "group-hover:border-primary/40 group-hover:scale-110 group-data-[resize-handle-active]:scale-125 group-data-[resize-handle-active]:shadow-primary/20",
          "data-[panel-group-direction=vertical]:rotate-90",
        )}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground/60 group-hover:text-primary transition-colors" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
