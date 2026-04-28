import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Navigation Compatibility Layer
 * CTO Reference: Authoritative wrapper for state-aware link artifacts.
 * Restores legacy 'activeClassName' support for high-intensity UI styling.
 */

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(
            "transition-all duration-300", // Neural baseline transition
            className,
            isActive && activeClassName,
            isPending && pendingClassName,
          )
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink_Identity_Node";

export { NavLink };
