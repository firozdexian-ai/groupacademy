import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Visual Ingestion Placeholders
 * High-fidelity skeletons for asynchronous data states.
 * 2026 Standard: Executive Logic geometry with reinforced scannability.
 */

export function DashboardCardSkeleton() {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
      <CardHeader className="p-6">
        <Skeleton className="h-6 w-48 bg-muted/20" />
        <Skeleton className="h-4 w-32 mt-2 bg-muted/10" />
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-xl bg-muted/10" />
          <Skeleton className="h-10 w-full rounded-xl bg-muted/10" />
          <Skeleton className="h-10 w-full rounded-xl bg-muted/10" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardTableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
      <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64 bg-muted/20 rounded-lg" />
          <Skeleton className="h-10 w-32 bg-primary/10 rounded-xl" />
        </div>
        <div className="flex gap-4 mt-6">
          <Skeleton className="h-12 flex-1 rounded-2xl bg-muted/10" />
          <Skeleton className="h-12 w-48 rounded-2xl bg-muted/10" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-border/5">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b-2">
                {Array.from({ length: columns }).map((_, i) => (
                  <TableHead key={i} className="py-6 px-8">
                    <Skeleton className="h-3 w-24 bg-muted/20 rounded-full" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="border-b border-border/5">
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <TableCell key={colIndex} className="py-6 px-8">
                      <Skeleton className={cn("h-4 bg-muted/10 rounded-md", colIndex === 0 ? "w-full" : "w-2/3")} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function DashboardErrorState({
  title = "Registry Sync Fault",
  message = "A logic mismatch occurred during artifact ingestion.",
  onRetry,
}: DashboardErrorStateProps) {
  return (
    <Card className="rounded-[32px] border-4 border-destructive/20 bg-destructive/5 backdrop-blur-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <CardContent className="py-20 text-center flex flex-col items-center">
        <div className="h-20 w-20 rounded-[24px] bg-destructive/10 flex items-center justify-center mb-6 border-2 border-destructive/20">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>

        <div className="space-y-2 max-w-md">
          <h3 className="text-2xl font-black uppercase tracking-tighter italic text-destructive">{title}</h3>
          <p className="text-sm font-medium text-muted-foreground italic leading-relaxed">{message}</p>
        </div>

        {onRetry && (
          <div className="mt-10">
            <Button
              onClick={onRetry}
              variant="outline"
              className="h-14 px-10 rounded-2xl border-2 font-black uppercase text-[10px] tracking-[0.2em] transition-all hover:bg-destructive hover:text-white hover:border-destructive shadow-xl shadow-destructive/10 group"
            >
              <RefreshCw className="w-4 h-4 mr-3 group-hover:rotate-180 transition-transform duration-700" />
              Re-Initialize Handshake
            </Button>
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 opacity-20">
          <Terminal className="h-3 w-3" />
          <span className="text-[8px] font-black uppercase tracking-widest">Protocol Error Log: 0x2A94F</span>
        </div>
      </CardContent>
    </Card>
  );
}
