import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useInstitutionGraph,
  type InstitutionType,
} from "hooks/useInstitutionGraph";
import {
  Plus,
  Pencil,
  Trash2,
  Library,
  ShieldCheck,
  RefreshCw,
  Network,
} from "lucide-react";

export function InstitutionTypesManager() {
  const { typesQuery, upsertType, deleteType } = useInstitutionGraph();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] =
    useState<Partial<InstitutionType> | null>(null);

  const handleOpenDialog = (type?: InstitutionType) => {
    if (type) {
      setEditingType(type);
    } else {
      setEditingType({
        key: "",
        label: "",
        sort_order: (typesQuery.data?.length || 0) * 10 + 10,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingType?.key || !editingType?.label) return;
    await upsertType.mutateAsync(editingType);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to purge this taxonomy node?")) return;
    await deleteType.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Library className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Institution Taxonomy
            </h2>
            <p className="text-sm text-muted-foreground">
              Global Graph Classifications &amp; Organizational Types
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => typesQuery.refetch()}
            disabled={typesQuery.isRefetching}
            className="h-12 w-12 rounded-xl border-2 bg-background/50 hover:bg-primary/5 shrink-0 shadow-sm"
            aria-label="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${typesQuery.isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> Inject Type
          </Button>
        </div>
      </div>

      {/* Dynamic Registry Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Network className="h-4 w-4 text-primary" />
            Classification Nodes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Order</TableHead>
                <TableHead>Display Label</TableHead>
                <TableHead>Database Key</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typesQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      Syncing Database…
                    </div>
                  </TableCell>
                </TableRow>
              ) : typesQuery.data?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-sm text-muted-foreground py-8"
                  >
                    Zero taxonomies found.
                  </TableCell>
                </TableRow>
              ) : (
                typesQuery.data?.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
                      <span className="inline-flex items-center justify-center h-7 w-10 rounded-md bg-muted font-mono text-xs">
                        {type.sort_order}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {type.label}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs px-2 py-1 rounded-md bg-muted font-mono text-muted-foreground">
                        {type.key}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(type)}
                          className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(type.id)}
                          className="h-9 w-9 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                          aria-label="Delete"
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
        </CardContent>
      </Card>

      {/* Deployment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Taxonomy Node</DialogTitle>
                <DialogDescription>
                  Define global institution classification
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Display Label</Label>
              <Input
                value={editingType?.label ?? ""}
                onChange={(e) =>
                  setEditingType({ ...editingType, label: e.target.value })
                }
                placeholder="E.g. University"
                className="h-14 rounded-xl border-2 font-bold bg-muted/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Database Key</Label>
                <Input
                  value={editingType?.key ?? ""}
                  onChange={(e) =>
                    setEditingType({
                      ...editingType,
                      key: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "_"),
                    })
                  }
                  placeholder="e.g. university"
                  className="h-14 rounded-xl border-2 font-mono text-xs bg-muted/20 lowercase"
                  // Prevent changing key after creation to protect relations
                  disabled={!!editingType?.id}
                />
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={editingType?.sort_order ?? 0}
                  onChange={(e) =>
                    setEditingType({
                      ...editingType,
                      sort_order: Number(e.target.value),
                    })
                  }
                  className="h-14 rounded-xl border-2 font-black text-center bg-muted/20"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="h-12 px-6 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest italic"
            >
              Abort
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                upsertType.isPending || !editingType?.key || !editingType?.label
              }
              className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
            >
              <ShieldCheck className="h-4 w-4" /> Authorize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InstitutionTypesManager;
