import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ButtonProps, buttonVariants } from "@/components/ui/button";

/**
 * GroUp Academy: Authoritative Data Registry Sequence Navigation Protocol (Pagination)
 * Hardened WAI-ARIA compliant pagination tracker providing pixel-perfect horizontal lines and zero layout shifts.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="Pagination data grid tracker"
    className={cn("mx-auto flex w-full justify-center select-none antialiased transform-gpu", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination_Core_Gate_Node";

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn("flex flex-row items-center gap-1.5 p-0 m-0 list-none border-none bg-transparent", className)}
      {...props}
    />
  ),
);
PaginationContent.displayName = "Pagination_Core_Content_Node";

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("list-none p-0 m-0 shrink-0 inline-flex items-center justify-center leading-none", className)}
    {...props}
  />
));
PaginationItem.displayName = "Pagination_Core_Item_Node";

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">;

const PaginationLink = ({ className, isActive, size, ...props }: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    data-active={isActive}
    className={cn(
      buttonVariants({
        variant: isActive ? "default" : "ghost",
        size: size || "icon",
      }),
      "h-8 min-w-[32px] rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer select-none leading-none pt-0.5",
      "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:pointer-events-none",
      className,
    )}
    {...props}
  />
);
PaginationLink.displayName = "Pagination_Core_Link_Node";

const PaginationPrevious = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Shift current page view backward to previous index block"
    size="default"
    className={cn(
      "h-8 px-2.5 rounded-lg gap-1.5 font-mono text-xs text-muted-foreground/80 hover:text-foreground border border-border/40 bg-background/50",
      className,
    )}
    {...props}
  >
    <ChevronLeft className="h-4 w-4 stroke-[2.5] shrink-0" />
    <span className="hidden sm:inline-block leading-none">Back</span>
  </PaginationLink>
);
PaginationPrevious.displayName = "Pagination_Core_Previous_Trigger_Node";

const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Shift current page view forward to next index block"
    size="default"
    className={cn(
      "h-8 px-2.5 rounded-lg gap-1.5 font-mono text-xs text-muted-foreground/80 hover:text-foreground border border-border/40 bg-background/50",
      className,
    )}
    {...props}
  >
    <span className="hidden sm:inline-block leading-none">Forward</span>
    <ChevronRight className="h-4 w-4 stroke-[2.5] shrink-0" />
  </PaginationLink>
);
PaginationNext.displayName = "Pagination_Core_Next_Trigger_Node";

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    aria-hidden="true"
    className={cn(
      "flex h-8 w-8 items-center justify-center text-muted-foreground/30 select-none pointer-events-none shrink-0",
      className,
    )}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4 stroke-[2.2]" />
    <span className="sr-only">Data registry index tracking sequence layers compressed</span>
  </span>
);
PaginationEllipsis.displayName = "Pagination_Core_Ellipsis_Node";

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
