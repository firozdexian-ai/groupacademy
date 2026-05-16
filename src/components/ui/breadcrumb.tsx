import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Navigation Hierarchy Path Tracing Interface (Breadcrumb)
 * Hardened WAI-ARIA compliant tracking protocol managing structural routing node contexts.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode;
  }
>(({ className, ...props }, ref) => (
  <nav 
    ref={ref} 
    aria-label="Breadcrumb navigation network tracks" 
    className={cn("w-full block text-left transform-gpu antialiased", className)} 
    {...props} 
  />
));
Breadcrumb.displayName = "Breadcrumb_Core_Gate_Node";

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<"ol">>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-1.5 break-words font-mono text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground/60 sm:gap-2 select-none pointer-events-auto leading-none",
        className
      )}
      {...props}
    />
  )
);
BreadcrumbList.displayName = "Breadcrumb_Core_List_Node";

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      className={cn("inline-flex items-center gap-1.5 shrink-0 min-w-0 text-left items-center justify-center leading-none", className)}
      {...props}
    />
  )
);
BreadcrumbItem.displayName = "Breadcrumb_Core_Item_Node";

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean;
  }
>(({ asChild, className, ...props }, ref) => {
  const TargetComponentCompositionNode = asChild ? Slot : "a";

  return (
    <TargetComponentCompositionNode
      ref={ref}
      className={cn(
        "transition-colors duration-200 hover:text-primary cursor-pointer outline-none focus-visible:text-primary decoration-primary/20 hover:underline underline-offset-2 shrink-0 inline-block",
        className
      )}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = "Breadcrumb_Core_Link_Node";

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="none"
      aria-current="page"
      className={cn("font-bold text-foreground shrink-0 select-text cursor-text truncate block max-w-[140px] sm:max-w-[200px]", className)}
      {...props}
    />
  )
);
BreadcrumbPage.displayName = "Breadcrumb_Core_Page_Node";

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("text-muted-foreground/30 shrink-0 select-none flex items-center justify-center h-3 w-3 mt-[-1px]", className)}
    {...props}
  >
    {children ?? <ChevronRight className="h-3 w-3 stroke-[2.5]" />}
  </li>
);
BreadcrumbSeparator.displayName = "Breadcrumb_Core_Separator_Node";

const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-4 w-4 items-center justify-center rounded border border-border/40 bg-muted/20 text-muted-foreground/50 shrink-0 select-none", className)}
    {...props}
  >
    <MoreHorizontal className="h-3 w-3 stroke-[2.2]" />
    <span className="sr-only">Platform tracking path trajectory levels compressed</span>
  </span>
);
BreadcrumbEllipsis.displayName = "Breadcrumb_Core_Ellipsis_Node";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};