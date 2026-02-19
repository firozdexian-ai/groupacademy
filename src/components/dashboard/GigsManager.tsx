import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Coins } from "lucide-react";

const CATEGORIES = [
  { value: "cv_upload", label: "CV Upload" },
  { value: "job_posting", label: "Job Posting" },
  { value: "job_sharing", label: "Job Sharing" },
  { value: "content_creation", label: "Content Creation" },
  { value: "course_resell", label: "Course Resell" },
];

interface GigForm {
  title: string;
  description: string;
  category: string;
  credit_reward: number;
  icon: string;
  is_active: boolean;
  max_completions_per_user: number;
  total_budget: number | null;
  requirements: string;
  display_order: number;
}

const defaultForm: GigForm = {
  title: "",
  description: "",
  category: "cv_upload",
  credit_reward: 10,
  icon: "gift",
  is_active: true,
  max_completions_per_user: 10,
  total_budget: null,
  requirements: "",
  display_order: 0,
};

export function GigsManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GigForm>(defaultForm);

  const { data: gigs, isLoading } = useQuery({
    queryKey: ["admin-gigs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gigs")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from("gigs").update(form).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("gigs").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Gig updated" : "Gig created");
      queryClient.invalidateQueries({ queryKey: ["admin-gigs"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(defaultForm);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openEdit = (gig: any) => {
    setEditingId(gig.id);
    setForm({
      title: gig.title,
      description: gig.description,
      category: gig.category,
      credit_reward: gig.credit_reward,
      icon: gig.icon || "gift",
      is_active: gig.is_active,
      max_completions_per_user: gig.max_completions_per_user || 10,
      total_budget: gig.total_budget,
      requirements: gig.requirements || "",
      display_order: gig.display_order || 0,
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Manage Gigs</h2>
        <Button onClick={openNew} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> New Gig
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : gigs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No gigs created yet
                </TableCell>
              </TableRow>
            ) : (
              gigs?.map((gig: any) => (
                <TableRow key={gig.id}>
                  <TableCell className="font-medium">{gig.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{gig.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5 text-amber-500" />
                      {gig.credit_reward}
                    </span>
                  </TableCell>
                  <TableCell>{gig.total_completed}</TableCell>
                  <TableCell>
                    <Badge variant={gig.is_active ? "default" : "secondary"}>
                      {gig.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(gig)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Gig" : "Create New Gig"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Credit Reward</Label>
                <Input type="number" value={form.credit_reward} onChange={(e) => setForm({ ...form, credit_reward: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon (Lucide name)</Label>
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="gift" />
              </div>
              <div className="space-y-2">
                <Label>Max per user</Label>
                <Input type="number" value={form.max_completions_per_user} onChange={(e) => setForm({ ...form, max_completions_per_user: parseInt(e.target.value) || 10 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Requirements (shown to user)</Label>
              <Input value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.title || !form.description || saveMutation.isPending}>
              {editingId ? "Update Gig" : "Create Gig"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
