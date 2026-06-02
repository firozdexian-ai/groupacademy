import { useState } from "react";
import { useAbroadGraph } from "./hooks/useAbroadGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, ClipboardList, ShieldCheck, User, GraduationCap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Group Academy — Abroad Group Tab: Applications Management
 * Version: Phase 10i.2 Hardened (Production Candidate Edition)
 * Surface: /dashboard?tab=applications (Admin Command Center Layout)[cite: 2, 4]
 * Operations Mode: Human-in-the-loop validation console for global student intakes[cite: 3].
 */

export function AbroadApplicationsTab() {
  const {
    abroadGraphQuery,
    mutations: { upsertApplication, deleteApplication },
  } = useAbroadGraph();

  const { data, isLoading } = abroadGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ status: "pending" });

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-6 rounded-2xl border border-border/60">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-blue-500">
            <ClipboardList className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Study Abroad Applications</h2>
          </div>
          <p className="text-xs text-muted-foreground">Global Admissions & Placement Ledger[cite: 6]</p>
        </div>
        <Button
          onClick={() => {
            setOpen(true);
            setDraft({ status: "pending" });
          }}
          className="h-10 px-6 rounded-xl font-semibold text-xs gap-2 shadow-sm shadow-blue-500/10 bg-blue-600 hover:bg-blue-700 text-white transition-all"
        >
          <Plus className="h-4 w-4" /> Create Application Entry
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
                    Program Reference
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Applicant User</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Admissions Stage</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground text-right">
                    Date Submitted
                  </TableHead>
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
                ) : data?.applications?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-sm font-medium text-muted-foreground/60 italic"
                    >
                      No active applications found in the system.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.applications?.map((row) => (
                    <TableRow key={row.id} className="group hover:bg-muted/20 transition-colors">
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-muted border border-border/40 flex items-center justify-center shrink-0">
                            <GraduationCap className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {row.program_id?.substring(0, 8) || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                          {row.talent_user_id ? row.talent_user_id.substring(0, 8) : "Anonymous User"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border-none",
                            row.status === "accepted"
                              ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                              : row.status === "rejected"
                                ? "bg-rose-500/10 text-rose-700 hover:bg-rose-500/10"
                                : row.status === "reviewing"
                                  ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10"
                                  : "bg-muted text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit application entry"
                            onClick={() => {
                              setDraft(row);
                              setOpen(true);
                            }}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete application entry"
                            className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this application record?")) {
                                deleteApplication.mutate(row.id);
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
              <ClipboardList className="h-5 w-5 text-blue-600" /> Review Application File
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update the current workflow status of this student intake pipeline[cite: 6].
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Program UUID Reference</Label>
                <Input
                  placeholder="Enter Program ID"
                  value={draft.program_id || ""}
                  disabled={isSubmitting}
                  onChange={(e) => setDraft({ ...draft, program_id: e.target.value })}
                  className="h-10 rounded-xl border font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">User Account UUID</Label>
                <Input
                  placeholder="Enter Student User ID"
                  value={draft.talent_user_id || ""}
                  disabled={isSubmitting}
                  onChange={(e) => setDraft({ ...draft, talent_user_id: e.target.value })}
                  className="h-10 rounded-xl border font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Current Process Stage</Label>
              <Select
                value={draft.status}
                disabled={isSubmitting}
                onValueChange={(v) => setDraft({ ...draft, status: v })}
              >
                <SelectTrigger className="h-10 rounded-xl border font-semibold text-xs uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="pending" className="font-semibold text-xs">
                    Pending
                  </SelectItem>
                  <SelectItem value="reviewing" className="font-semibold text-xs text-amber-600 focus:text-amber-700">
                    In Review
                  </SelectItem>
                  <SelectItem
                    value="accepted"
                    className="font-semibold text-xs text-emerald-600 focus:text-emerald-700"
                  >
                    Accepted
                  </SelectItem>
                  <SelectItem value="rejected" className="font-semibold text-xs text-rose-600 focus:text-rose-700">
                    Rejected
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setOpen(false)}
              className="h-10 px-4 rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              disabled={!draft.program_id || upsertApplication.isPending}
              onClick={() => {
                const payload = { ...draft, stage: draft.status };
                delete payload.status;
                upsertApplication.mutate(payload, { onSuccess: () => setOpen(false) });
              }}
              className="h-10 px-5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white text-xs flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" /> Save Record Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AbroadApplicationsTab;
