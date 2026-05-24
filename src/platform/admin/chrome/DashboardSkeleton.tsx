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
    <Card className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <CardHeader className="p-6">
        <Skeleton className="h-6 w-48 bg-muted/30" />
        <Skeleton className="h-4 w-32 mt-2 bg-muted/20" />
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-xl bg-muted/20" />
          <Skeleton className="h-10 w-full rounded-xl bg-muted/20" />
          <Skeleton className="h-10 w-full rounded-xl bg-muted/20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardTableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <Card className="rounded-2xl border border-border/60 overflow-hidden bg-card">
      <CardHeader className="p-6 border-b border-border/40 bg-muted/10">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-64 bg-muted/30 rounded-md" />
          <Skeleton className="h-9 w-28 bg-primary/10 rounded-lg" />
        </div>
        <div className="flex gap-3 mt-4">
          <Skeleton className="h-10 flex-1 rounded-lg bg-muted/20" />
          <Skeleton className="h-10 w-40 rounded-lg bg-muted/20" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b">
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i} className="py-4 px-6">
                  <Skeleton className="h-3 w-24 bg-muted/30 rounded-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="border-b border-border/30">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <TableCell key={colIndex} className="py-4 px-6">
                    <Skeleton className={cn("h-4 bg-muted/20 rounded-md", colIndex === 0 ? "w-full" : "w-2/3")} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
  title = "Something went wrong",
  message = "We couldn't load this view. Please try again.",
  onRetry,
}: DashboardErrorStateProps) {
  return (
    <Card className="rounded-[32px] border-2 border-destructive/20 bg-destructive/5 backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <CardContent className="py-20 text-center flex flex-col items-center">
        <div className="h-20 w-20 rounded-[24px] bg-destructive/10 flex items-center justify-center mb-6 border-2 border-destructive/20">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>

        <div className="space-y-2 max-w-md">
          <h3 className="text-2xl font-semibold tracking-tight text-destructive">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        </div>

        {onRetry && (
          <div className="mt-10">
            <Button
              onClick={onRetry}
              variant="outline"
              className="h-11 px-6 rounded-xl border-2 font-medium transition-all hover:bg-destructive hover:text-white hover:border-destructive group"
            >
              <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-700" />
              Try again
            </Button>
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 opacity-30">
          <Terminal className="h-3 w-3" />
          <span className="text-[10px] font-medium text-muted-foreground">Error code: 0x2A94F</span>
        </div>
      </CardContent>
    </Card>
  );
}
