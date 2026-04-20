import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { cn } from "@/lib/utils";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Platform Logic: Event Disclosure Protocol
 * High-fidelity notification system for real-time system feedback and logic handshakes.
 * Synchronized with the 2026 'Executive Logic' depth and geometry tokens.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: cn(
            "group toast",
            // Executive Logic Geometry & Depth
            "group-[.toaster]:bg-background/80 group-[.toaster]:backdrop-blur-2xl",
            "group-[.toaster]:text-foreground group-[.toaster]:border-border/40",
            "group-[.toaster]:shadow-[0_20px_50px_rgba(0,0,0,0.1)] group-[.toaster]:rounded-[28px]",
            "group-[.toaster]:p-6 group-[.toaster]:gap-4",
          ),
          title:
            "group-[.toast]:font-black group-[.toast]:uppercase group-[.toast]:tracking-tighter group-[.toast]:text-sm",
          description:
            "group-[.toast]:text-[10px] group-[.toast]:font-bold group-[.toast]:uppercase group-[.toast]:tracking-[0.2em] group-[.toast]:text-muted-foreground/60 group-[.toast]:italic",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl group-[.toast]:font-black group-[.toast]:uppercase group-[.toast]:text-[10px] group-[.toast]:tracking-widest group-[.toast]:h-10 group-[.toast]:px-4",
          cancelButton:
            "group-[.toast]:bg-muted/50 group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl group-[.toast]:font-black group-[.toast]:uppercase group-[.toast]:text-[10px] group-[.toast]:tracking-widest group-[.toast]:h-10 group-[.toast]:px-4",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
