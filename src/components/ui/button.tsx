import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Platform Logic: Interaction Nodes
 * Standardized button system with kinetic scaling and technical typography.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-30 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] selection:bg-transparent",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30",
        destructive: "bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600",
        outline:
          "border-2 border-border/60 bg-transparent hover:bg-muted/50 hover:border-primary/40 hover:text-primary",
        secondary: "bg-muted/50 text-foreground border border-border/40 hover:bg-muted hover:border-border",
        ghost: "hover:bg-primary/10 hover:text-primary border border-transparent",
        link: "text-primary underline-offset-8 hover:underline lowercase tracking-normal text-sm font-bold",
        glass: "bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 shadow-2xl",
      },
      size: {
        default: "h-12 px-8 py-2",
        sm: "h-10 rounded-xl px-4",
        lg: "h-14 rounded-[20px] px-10 text-[11px]",
        xl: "h-16 rounded-[24px] px-12 text-[12px] tracking-[0.2em]",
        icon: "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
