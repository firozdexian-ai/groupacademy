import { useState } from "react";
import { useAbroadGraph } from "./hooks/useAbroadGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Map, ShieldCheck, User, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Group Academy — Abroad Group Tab: Roadmap Inquiry CRM Leads Management
 * Version: Phase 10i.2 Hardened (Production Candidate Edition)
 * Surface: /dashboard?tab=roadmap-leads (Admin Command Center Viewport)
 * Operations Mode: Human-in-the-loop sales pipeline engine managing counselor advisory queues.
 */

export function AbroadRoadmapLeadsTab() {
  const {
    abroadGraphQuery,
    mutations: { upsertRoadmap, deleteRoadmap },
  } = useAbroadGraph();

  const { data, isLoading } = abroadGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ status: "new" });

  const handleOpenChange = (nextOpenState: boolean) => {
    if (upsertRoadmap.isPending) return;
    setOpen(nextOpenState);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-6 rounded-2xl border border-border/60">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Map className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Counseling Inquiry Leads</h2>
          </div>
          <p className="text-xs text-muted-foreground">Top-of-Funnel Student Consulting & Advisory Pipeline CRM</p>
        </div>
        <Button
          onClick={() => {
            setDraft({ status: "new" });
            setOpen(true);
          }}
          className="h-10 px-6 rounded-xl font-semibold text-xs gap-2 bg-primary hover:bg-primary/90 text-white transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Lead Record
        </Button>
      </header>

      <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-600" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30 border-b border-border/40">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-semibold text-xs py-4 pl-6 text-muted-foreground">
                    Lead File Reference
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Student Reference ID</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Target Destination</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Pipeline Status</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground text-right py-4 pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data?.roadmaps?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-sm font-medium text-muted-foreground/60 italic"
                    >
                      No counseling inquiry records found in the database.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.roadmaps?.map((row) => (
                    <TableRow key={row.id} className="group hover:bg-muted/20 transition-colors">
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-muted border border-border/40 flex items-center justify-center shrink-0">
                            <Map className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-mono text-xs font-semibold text-muted-foreground">
                            {row.id?.substring(0, 8)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-foreground flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                          {row.talent_id ? row.talent_id.substring(0, 8) : "Anonymous Talent"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-xs uppercase flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-3.5 w-3.5 text-primary" /> {row.destination || "Not Specified"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border-none",
                            row.status === "converting" || row.status === "contacted"
                              ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                              : row.status === "closed"
                                ? "bg-rose-500/10 text-rose-700 hover:bg-rose-500/10"
                                : "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10",
                          )}
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit lead details"
                            onClick={() => {
                              setDraft(row);
                              setOpen(true);
                            }}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete inquiry record"
                            className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                            onClick={() => {
                              if (
                                confirm("Are you sure you want to permanently delete this counseling inquiry record?")
                              ) {
                                deleteRoadmap.mutate(row.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md rounded-2xl p-6 border border-border/60 text-left">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" /> Review Pipeline Lead
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update the active counseling and advisor tracking attributes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Student Account UUID</Label>
              <Input
                placeholder="Enter Student UUID"
                value={draft.talent_id || ""}
                disabled={upsertRoadmap.isPending}
                onChange={(e) => setDraft({ ...draft, talent_id: e.target.value })}
                className="h-10 rounded-xl border font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Target Destination Country</Label>
                <Input
                  placeholder="e.g. UK, CA, DE"
                  value={draft.destination || ""}
                  disabled={upsertRoadmap.isPending}
                  onChange={(e) => setDraft({ ...draft, destination: e.target.value })}
                  className="h-10 rounded-xl border font-semibold text-sm uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">CRM Workflow Status</Label>
                <Select
                  value={draft.status}
                  disabled={upsertRoadmap.isPending}
                  onValueChange={(v) => setDraft({ ...draft, status: v })}
                >
                  <SelectTrigger className="h-10 rounded-xl border font-semibold text-xs uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="new" className="font-semibold text-xs text-amber-600 focus:text-amber-700">
                      New Inquiry
                    </SelectItem>
                    <SelectItem value="contacted" className="font-semibold text-xs text-blue-600 focus:text-blue-700">
                      Contacted
                    </SelectItem>
                    <SelectItem
                      value="converting"
                      className="font-semibold text-xs text-emerald-600 focus:text-emerald-700"
                    >
                      Converting
                    </SelectItem>
                    <SelectItem value="closed" className="font-semibold text-xs text-rose-600 focus:text-rose-700">
                      Closed File
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              disabled={upsertRoadmap.isPending}
              onClick={() => setOpen(false)}
              className="h-10 px-4 rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              disabled={!draft.talent_id || upsertRoadmap.isPending}
              onClick={() => {
                const payload = { ...draft, target_countries: [draft.destination] };
                delete payload.destination;
                upsertRoadmap.mutate(payload, { onSuccess: () => setOpen(false) });
              }}
              className="h-10 px-5 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-white text-xs flex items-center gap-2 shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" /> Save Lead Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AbroadRoadmapLeadsTab;
