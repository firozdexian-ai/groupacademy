import { useState } from "react";
import { useAbroadGraph } from "./hooks/useAbroadGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Globe, ShieldCheck, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AbroadDestinationsTab() {
  const {
    abroadGraphQuery,
    mutations: { upsertAgent, deleteAgent },
  } = useAbroadGraph();
  const { data, isLoading } = abroadGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ status: "active" });

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-pink-500">
            <Globe className="h-8 w-8 text-pink-500 fill-pink-500/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Destinations
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Regional Agent Network
          </p>
        </div>
        <Button
          onClick={() => {
            setDraft({ status: "active" });
            setOpen(true);
          }}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-pink-500/20 bg-pink-600 hover:bg-pink-700 text-white"
        >
          <Plus className="h-4 w-4" /> Register Agent
        </Button>
      </header>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-pink-400 via-rose-500 to-pink-600" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">
                    Agent / Partner
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Region Code</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="text-right py-5 pr-8">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/5">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-20 text-center">
                      <Skeleton className="h-8 w-32 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data?.agents?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/50 italic"
                    >
                      Zero agents detected.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.agents?.map((row) => (
                    <TableRow key={row.id} className="group hover:bg-pink-500/[0.02]">
                      <TableCell className="py-6 pl-8">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-background border-2 border-border/20 flex items-center justify-center shrink-0">
                            <Globe className="h-3 w-3 text-pink-500" />
                          </div>
                          <span className="font-black text-sm uppercase italic tracking-tight">{row.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-xs uppercase flex items-center gap-2 text-foreground/80">
                          <MapPin className="h-3 w-3 text-pink-500" /> {row.country || "GLOBAL"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "font-bold text-[9px] uppercase tracking-widest border-none px-3",
                            row.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-rose-500/10 text-rose-600",
                          )}
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDraft(row);
                              setOpen(true);
                            }}
                            className="hover:bg-pink-500/10 hover:text-pink-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm("Purge Agent?")) deleteAgent.mutate(row.id);
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-[40px] p-8 border-4 border-border/40 text-left">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-pink-500 flex items-center gap-2">
              <Globe className="h-6 w-6" /> Register Agent
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">
              Update regional partner network.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                Agent / Partner Name
              </Label>
              <Input
                placeholder="e.g. EduGlobal Partners"
                value={draft.name || ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="h-14 rounded-xl border-2 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                Country / Region Code
              </Label>
              <Input
                placeholder="e.g. UK, CA, AU"
                value={draft.country || ""}
                onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                className="h-14 rounded-xl border-2 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                Network Status
              </Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
                <SelectTrigger className="h-14 rounded-xl border-2 font-bold text-xs uppercase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="font-bold text-xs uppercase tracking-widest text-emerald-500">
                    Active
                  </SelectItem>
                  <SelectItem value="inactive" className="font-bold text-xs uppercase tracking-widest text-rose-500">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            disabled={!draft.name || upsertAgent.isPending}
            onClick={() => {
              const payload = {
                ...draft,
                display_name: draft.name,
                country_code: draft.country,
                is_active: draft.status === "active",
              };
              delete payload.name;
              delete payload.country;
              delete payload.status;
              upsertAgent.mutate(payload, { onSuccess: () => setOpen(false) });
            }}
            className="h-14 rounded-xl font-black uppercase bg-pink-600 hover:bg-pink-700 text-white"
          >
            <ShieldCheck className="mr-2 h-5 w-5" /> Enforce Agent
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AbroadDestinationsTab;
