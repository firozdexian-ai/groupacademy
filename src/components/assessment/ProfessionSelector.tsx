import { useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap, ShieldCheck, Sparkles, Briefcase } from "lucide-react";
import { getIcon } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Professional Trajectory Selector (V5.6.0)
 * CTO Reference: Authoritative funnel entrance routing talent to category assessment vectors.
 * Architecture: Optimized via global regex sanitizers eliminating broken string token outputs.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

interface ProfessionSelectorProps {
  categories: ProfessionCategory[];
  onSelect: (category: ProfessionCategory) => void;
  onBack: () => void;
}

export function ProfessionSelector({ categories = [], onSelect, onBack }: ProfessionSelectorProps) {
  // Clean click delegation avoids micro-closure execution leaks down row elements
  const handleCategorySelection = useCallback(
    (category: ProfessionCategory) => {
      if (onSelect) onSelect(category);
    },
    [onSelect],
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 text-left select-none">
      {/* HUD: NAVIGATION_INGRESS_BAR */}
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="mb-10 rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2 transition-all hover:bg-muted/10"
      >
        <ArrowLeft className="h-4 w-4" /> ABORT_TRAJECTORY
      </Button>

      {/* HUD: REGISTRY_HEADER_SECTOR */}
      <div className="mb-16 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground leading-none">
            Initialize_Sync
          </h2>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground italic max-w-lg ml-1 leading-relaxed">
          Select your professional trajectory to commence neural artifact alignment.
        </p>
      </div>

      {/* COMPONENT: REGISTRY_GRID_CARDS_DECK */}
      {categories.length === 0 ? (
        <div className="text-center py-20 rounded-[32px] border-2 border-dashed border-border/20 bg-muted/5">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 italic">
            No professional tracks seeded inside this node ledger.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            // --- PHASE: SAFE_STRING_UNDERSCORE_CONVERSION ---
            // Architecture Fix: Globally replace all space variations to preserve structural cyberpunk aesthetics uniformly
            const standardizedDisplayTitle = useMemo(() => {
              return String(category.name || "TRAJECTORY_NODE")
                .trim()
                .replace(/\s+/g, "_");
            }, [category.name]);

            // --- PHASE: ACCREDITED_ICON_LOOKUP ---
            const ResolvedIconComponent = useMemo(() => {
              try {
                return getIcon(category.icon) || Briefcase; // Fallback to stable baseline glyph if database strings resolve null
              } catch (err) {
                console.warn("[Digital Workforce] WARNING: Failed to map asset icon token reference.", category.icon);
                return Briefcase;
              }
            }, [category.icon]);

            return (
              <Card
                key={category.id}
                className={cn(
                  "group cursor-pointer rounded-[32px] border-2 border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-500 outline-none focus:border-primary/40 focus:bg-card/60",
                  "hover:border-primary/40 hover:shadow-2xl hover:-translate-y-2 active:scale-[0.98] overflow-hidden",
                )}
                onClick={() => handleCategorySelection(category)}
                onKeyDown={(e) => e.key === "Enter" && handleCategorySelection(category)}
                tabIndex={0}
              >
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    {/* CONTAINER: GLYPH_WRAPPER */}
                    <div className="w-16 h-16 bg-primary/5 rounded-[22px] border-2 border-primary/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                      <ResolvedIconComponent className="w-8 h-8 text-primary fill-current opacity-60" />
                    </div>
                    <Sparkles className="h-4 w-4 text-primary/20 group-hover:text-primary transition-colors animate-pulse shrink-0" />
                  </div>

                  <div className="space-y-2 text-left">
                    <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-foreground group-hover:text-primary transition-colors line-clamp-1 truncate">
                      {standardizedDisplayTitle}
                    </CardTitle>

                    <CardDescription className="text-xs font-medium italic text-muted-foreground/80 leading-relaxed min-h-[48px] line-clamp-3">
                      {category.description?.trim() ||
                        `High-fidelity assessment protocol tailored for validating ${category.name} execution parameters.`}
                    </CardDescription>
                  </div>

                  {/* METRICS HUD: LEDGER_ALIGNMENT_STATUS */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/10 font-mono">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                        Verified_Track
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
                      <span className="text-[9px] font-black uppercase tracking-tighter italic">Initialize</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
